import { Octokit } from "@octokit/rest";

/**
 * Pushes a compiled codebase file tree directly to a GitHub repository using the Git database REST API.
 * Uses standard Tree/Commit/Ref update mechanics.
 */
export async function pushToGithub(
  accessToken: string,
  repositoryName: string,
  fileTree: Record<string, string>,
  branch = "main"
): Promise<string> {
  const [owner, repo] = repositoryName.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repository format: ${repositoryName}`);
  }

  // Initialize Octokit client with user credential token
  const octokit = new Octokit({ auth: accessToken });

  let lastCommitSha: string | null = null;
  let baseTreeSha: string | undefined = undefined;
  let isNewBranch = false;

  try {
    // 1. Fetch reference for the target branch
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    lastCommitSha = refData.object.sha;

    // 2. Fetch the commit details to retrieve the base tree SHA
    const { data: commitData } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: lastCommitSha,
    });
    baseTreeSha = commitData.tree.sha;
  } catch (err: any) {
    // If the branch or repository is empty/doesn't exist, we will create a fresh root commit
    if (err.status === 404 || err.message?.includes("Not Found") || err.message?.includes("empty")) {
      isNewBranch = true;
    } else {
      throw err;
    }
  }

  // If the branch is new or the repository is completely empty, initialize it first
  if (isNewBranch) {
    const files = Object.keys(fileTree);
    if (files.length > 0) {
      const firstFileKey = files[0];
      const firstFileContent = fileTree[firstFileKey];

      // Create the first file to initialize the branch and repository
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: firstFileKey,
        message: "🌱 Initialize repository with FlowForge backend codebase",
        content: Buffer.from(firstFileContent).toString("base64"),
        branch,
      });

      // Refetch the newly created reference to get SHAs
      const { data: refData } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      lastCommitSha = refData.object.sha;

      const { data: commitData } = await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: lastCommitSha,
      });
      baseTreeSha = commitData.tree.sha;
      isNewBranch = false; // Reset flag as branch now exists
    }
  }

  // 3. Construct tree nodes
  const treeNodes = Object.entries(fileTree).map(([path, content]) => ({
    path,
    mode: "100644" as const, // 100644 indicates standard file
    type: "blob" as const,
    content,
  }));

  // 4. Create new Git Tree
  const { data: treeData } = await octokit.git.createTree({
    owner,
    repo,
    tree: treeNodes,
    base_tree: baseTreeSha,
  });

  // 5. Create a new Commit
  const { data: newCommitData } = await octokit.git.createCommit({
    owner,
    repo,
    message: "🚀 Deploy compiled FlowForge visual backend updates",
    tree: treeData.sha,
    parents: lastCommitSha ? [lastCommitSha] : [],
  });

  // 6. Update or create reference pointer on remote branch
  if (isNewBranch) {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: newCommitData.sha,
    });
  } else {
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommitData.sha,
    });
  }

  return newCommitData.sha;
}
