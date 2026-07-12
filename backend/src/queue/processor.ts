import { ZipArchive } from "archiver";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../services/db.js";
import { compileProject } from "../services/compiler.js";
import { pushToGithub } from "../services/github.js";
import { decrypt } from "../services/crypto.js";

export interface CompilationJobData {
  projectId: string;
  userId: string;
  pushToGit?: boolean;
}

export async function processCompilation(data: CompilationJobData) {
  const { projectId, userId, pushToGit } = data;

  console.log(`📦 Starting compilation job for project ${projectId}`);

  // 1. Retrieve project and workflows
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { workflows: true },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  // 2. Run graph compiler
  const fileTree = compileProject(project.name, project.workflows);

  // 3. Zip files in-memory and write to local exports directory
  const exportsDir = path.resolve("exports");
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  const zipPath = path.join(exportsDir, `${projectId}.zip`);
  const outputStream = fs.createWriteStream(zipPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  await new Promise<void>((resolve, reject) => {
    outputStream.on("close", () => resolve());
    archive.on("error", (err: any) => reject(err));

    archive.pipe(outputStream);

    // Append files from tree
    for (const [filePath, content] of Object.entries(fileTree)) {
      archive.append(content, { name: filePath });
    }

    archive.finalize();
  });

  console.log(`✅ Project archived successfully to: ${zipPath}`);

  // 4. Push to remote Git repository if requested
  if (pushToGit) {
    const gitConfig = await prisma.gitConfiguration.findFirst({
      where: { userId, isActive: true },
    });

    if (!gitConfig) {
      throw new Error("Git push requested but no active Git Configuration found");
    }

    console.log(`🐙 Pushing codebase to repository ${gitConfig.repositoryName}`);
    
    // Decrypt credential token
    const decryptedToken = decrypt(gitConfig.accessToken);

    // Commit and push
    const commitSha = await pushToGithub(
      decryptedToken,
      gitConfig.repositoryName,
      fileTree
    );

    console.log(`✅ Pushed successfully. Commit SHA: ${commitSha}`);
    return { zipPath, commitSha };
  }

  return { zipPath };
}
