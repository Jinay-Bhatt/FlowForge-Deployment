import path from "node:path";
import fs from "node:fs";
import { prisma } from "../services/db.js";
import { compileProject } from "../services/compiler.js";
import { pushToGithub } from "../services/github.js";
import { decrypt } from "../services/crypto.js";

export interface CompilationJobData {
  projectId: string;
  userId: string;
  pushToGit: boolean;
}

/**
 * Core compilation processor.
 * Compiles a project's visual workflow into a Fastify codebase, writes a ZIP,
 * and optionally pushes the file tree to GitHub.
 */
export async function processCompilation(data: CompilationJobData): Promise<{ zipPath?: string; commitSha?: string }> {
  const { projectId, userId, pushToGit } = data;

  // 1. Load project and workflows from database
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
    include: { workflows: true },
  });

  if (!project) {
    throw new Error(`Project '${projectId}' not found or unauthorized`);
  }

  // 2. Compile project into an in-memory file tree
  const fileTree = compileProject(project.name, project.workflows);

  // 3. Write compiled ZIP archive to disk for download
  const exportsDir = path.resolve("exports");
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  const zipPath = path.join(exportsDir, `${projectId}.zip`);
  await writeZip(fileTree, zipPath);

  const result: { zipPath?: string; commitSha?: string } = { zipPath };

  // 4. Optionally push to GitHub
  if (pushToGit) {
    const gitConfig = await prisma.gitConfiguration.findFirst({
      where: { userId, isActive: true },
    });

    if (!gitConfig) {
      throw new Error("No active Git configuration found. Please link a GitHub repository first.");
    }

    const accessToken = decrypt(gitConfig.accessToken);
    const commitSha = await pushToGithub(accessToken, gitConfig.repositoryName, fileTree);
    result.commitSha = commitSha;
  }

  return result;
}

/**
 * Creates a ZIP archive in-memory using raw Deflate (no external archiver library).
 * Uses Node's built-in zlib and produces a valid ZIP file written to disk.
 */
async function writeZip(fileTree: Record<string, string>, outputPath: string): Promise<void> {
  const { deflateRawSync } = await import("node:zlib");

  const entries: Buffer[] = [];
  const centralDirectory: Buffer[] = [];
  let offset = 0;

  for (const [filePath, content] of Object.entries(fileTree)) {
    const nameBuffer = Buffer.from(filePath, "utf8");
    const contentBuffer = Buffer.from(content, "utf8");
    const compressed = deflateRawSync(contentBuffer, { level: 6 });

    const crc = crc32(contentBuffer);
    const modTime = dosTime(new Date());

    // Local file header
    const localHeader = Buffer.alloc(30 + nameBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0);  // Local file header signature
    localHeader.writeUInt16LE(20, 4);           // Version needed: 2.0
    localHeader.writeUInt16LE(0, 6);            // General purpose bit flag
    localHeader.writeUInt16LE(8, 8);            // Compression method: Deflate
    localHeader.writeUInt16LE(modTime.time, 10);
    localHeader.writeUInt16LE(modTime.date, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(contentBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);           // Extra field length
    nameBuffer.copy(localHeader, 30);

    entries.push(localHeader);
    entries.push(compressed);

    // Central directory entry
    const centralEntry = Buffer.alloc(46 + nameBuffer.length);
    centralEntry.writeUInt32LE(0x02014b50, 0); // Central directory signature
    centralEntry.writeUInt16LE(20, 4);          // Version made by
    centralEntry.writeUInt16LE(20, 6);          // Version needed
    centralEntry.writeUInt16LE(0, 8);           // General purpose bit flag
    centralEntry.writeUInt16LE(8, 10);          // Compression method
    centralEntry.writeUInt16LE(modTime.time, 12);
    centralEntry.writeUInt16LE(modTime.date, 14);
    centralEntry.writeUInt32LE(crc, 16);
    centralEntry.writeUInt32LE(compressed.length, 20);
    centralEntry.writeUInt32LE(contentBuffer.length, 24);
    centralEntry.writeUInt16LE(nameBuffer.length, 28);
    centralEntry.writeUInt16LE(0, 30);          // Extra field length
    centralEntry.writeUInt16LE(0, 32);          // File comment length
    centralEntry.writeUInt16LE(0, 34);          // Disk number start
    centralEntry.writeUInt16LE(0, 36);          // Internal attributes
    centralEntry.writeUInt32LE(0, 38);          // External attributes
    centralEntry.writeUInt32LE(offset, 42);     // Relative offset of local header
    nameBuffer.copy(centralEntry, 46);

    centralDirectory.push(centralEntry);
    offset += localHeader.length + compressed.length;
  }

  const centralDirBuffer = Buffer.concat(centralDirectory);
  const endOfCentral = Buffer.alloc(22);
  endOfCentral.writeUInt32LE(0x06054b50, 0);           // End of central directory signature
  endOfCentral.writeUInt16LE(0, 4);                     // Disk number
  endOfCentral.writeUInt16LE(0, 6);                     // Disk with central directory
  endOfCentral.writeUInt16LE(centralDirectory.length, 8);
  endOfCentral.writeUInt16LE(centralDirectory.length, 10);
  endOfCentral.writeUInt32LE(centralDirBuffer.length, 12);
  endOfCentral.writeUInt32LE(offset, 16);
  endOfCentral.writeUInt16LE(0, 20);                    // Comment length

  const zipBuffer = Buffer.concat([...entries, centralDirBuffer, endOfCentral]);
  fs.writeFileSync(outputPath, zipBuffer);
}

/** Compute CRC-32 checksum for ZIP compatibility */
function crc32(buf: Buffer): number {
  const table = makeCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeCrcTable(): number[] {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

/** Convert a JS Date to DOS time/date format used inside ZIP headers */
function dosTime(d: Date): { time: number; date: number } {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}
