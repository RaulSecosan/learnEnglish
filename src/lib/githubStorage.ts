const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER;
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO;
const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH || "main";
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

interface GithubUploadResult {
  contentUrl: string;
  contentPath: string;
  contentSha: string;
}

const encoder = new TextEncoder();

function bytesToBase64(input: Uint8Array) {
  let binary = "";
  for (let i = 0; i < input.length; i += 1) {
    binary += String.fromCharCode(input[i]);
  }
  return btoa(binary);
}

function encodePath(path: string) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getConfig() {
  if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_TOKEN) {
    throw new Error("github-storage-missing-config");
  }

  return {
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    branch: GITHUB_BRANCH,
    token: GITHUB_TOKEN,
  };
}

function githubCdnUrl(owner: string, repo: string, branch: string, path: string) {
  const normalizedPath = encodePath(path);
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${normalizedPath}`;
}

export async function uploadBookContentToGithub(
  userId: string,
  bookId: string,
  content: string,
): Promise<GithubUploadResult> {
  const { owner, repo, branch, token } = getConfig();
  const contentPath = `books/${userId}/${bookId}/content.txt`;
  const endpoint = `https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(contentPath)}`;

  const payload = {
    message: `Upload book content (${bookId})`,
    content: bytesToBase64(encoder.encode(content)),
    branch,
  };

  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let githubMessage = "";
    try {
      const errorData = (await response.json()) as { message?: string };
      githubMessage = errorData.message?.trim() || "";
    } catch {
      // ignore json parse errors
    }
    throw new Error(
      `github-upload-failed:${response.status}:${githubMessage || "unknown-error"}`,
    );
  }

  const data = (await response.json()) as {
    content?: {
      sha?: string;
      path?: string;
    };
  };

  const contentSha = data.content?.sha;
  if (!contentSha) {
    throw new Error("github-upload-missing-sha");
  }

  return {
    contentUrl: githubCdnUrl(owner, repo, branch, contentPath),
    contentPath,
    contentSha,
  };
}

export async function deleteBookContentFromGithub(
  contentPath: string,
  contentSha: string,
) {
  const { owner, repo, branch, token } = getConfig();
  const endpoint = `https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(contentPath)}`;

  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Delete book content (${contentPath})`,
      sha: contentSha,
      branch,
    }),
  });

  if (!response.ok) {
    let githubMessage = "";
    try {
      const errorData = (await response.json()) as { message?: string };
      githubMessage = errorData.message?.trim() || "";
    } catch {
      // ignore json parse errors
    }
    throw new Error(
      `github-delete-failed:${response.status}:${githubMessage || "unknown-error"}`,
    );
  }
}
