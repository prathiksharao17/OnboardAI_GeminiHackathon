import { Octokit } from "@octokit/rest";

export type RepoRef = { owner: string; repo: string; ref?: string };

export function parseGitHubRepoUrl(input: string): RepoRef {
  // Accepts:
  // - https://github.com/owner/repo
  // - https://github.com/owner/repo/tree/branch
  // - owner/repo
  const trimmed = input.trim();

  if (/^[\w-]+\/[\w.-]+$/.test(trimmed)) {
    const [owner, repo] = trimmed.split("/");
    return { owner, repo };
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname !== "github.com") throw new Error("Not a github.com URL");
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) throw new Error("Invalid GitHub repo URL");
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");
    // /owner/repo/tree/<ref>/...
    const ref = parts[2] === "tree" && parts[3] ? decodeURIComponent(parts[3]) : undefined;
    return { owner, repo, ref };
  } catch {
    throw new Error("Invalid GitHub repository URL. Use https://github.com/owner/repo");
  }
}

export function createOctokit() {
  // For public repos, token is optional. If you later add it, you get higher rate limits.
  const token = process.env.GITHUB_TOKEN;
  return new Octokit(token ? { auth: token } : {});
}

export type IngestedFile = {
  path: string;
  sha?: string;
  size?: number;
  content: string; // utf-8 text (best effort)
};

function isLikelyTextFile(path: string) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif") || lower.endsWith(".webp")) return false;
  if (lower.endsWith(".svg")) return true;
  if (lower.endsWith(".pdf") || lower.endsWith(".zip") || lower.endsWith(".exe")) return false;
  return true;
}

export async function fetchRepoReadme(ref: RepoRef) {
  const octokit = createOctokit();
  try {
    const res = await octokit.repos.getReadme({
      owner: ref.owner,
      repo: ref.repo,
      ref: ref.ref,
    });
    const content = Buffer.from(res.data.content, "base64").toString("utf8");
    return { path: res.data.path, content };
  } catch {
    return null;
  }
}

export async function fetchRepoTree(ref: RepoRef) {
  const octokit = createOctokit();
  const repo = await octokit.repos.get({ owner: ref.owner, repo: ref.repo });
  const branch = ref.ref ?? repo.data.default_branch;

  const tree = await octokit.git.getTree({
    owner: ref.owner,
    repo: ref.repo,
    tree_sha: branch,
    recursive: "true",
  });

  return { defaultBranch: repo.data.default_branch, branch, tree: tree.data.tree };
}

export async function fetchTextFile(ref: RepoRef, path: string): Promise<IngestedFile | null> {
  if (!isLikelyTextFile(path)) return null;
  const octokit = createOctokit();
  const res = await octokit.repos.getContent({
    owner: ref.owner,
    repo: ref.repo,
    path,
    ref: ref.ref,
  });

  // Could be directory; ignore.
  if (Array.isArray(res.data)) return null;
  if (!("content" in res.data) || !res.data.content) return null;

  const content = Buffer.from(res.data.content, "base64").toString("utf8");
  return { path, sha: res.data.sha, size: res.data.size, content };
}

export function pickImportantPaths(allPaths: string[]) {
  const paths = allPaths.filter(Boolean);
  const picked = new Set<string>();

  // Always-valuable top-level docs/config
  const topPriority = [
    "README.md",
    "README.MD",
    "readme.md",
    "package.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "requirements.txt",
    "manage.py",
    "pyproject.toml",
    "poetry.lock",
    "setup.py",
    "Dockerfile",
    "docker-compose.yml",
    ".env.example",
    ".nvmrc",
    "tsconfig.json",
    "next.config.js",
    "next.config.ts",
  ];
  for (const p of topPriority) if (paths.includes(p)) picked.add(p);

  // Entry points (common)
  const entryRegexes = [
    /^app\/page\.(t|j)sx?$/i,
    /^app\/layout\.(t|j)sx?$/i,
    /^src\/index\.(t|j)sx?$/i,
    /^src\/main\.(t|j)sx?$/i,
    /^index\.(t|j)sx?$/i,
    /^main\.(t|j)sx?$/i,
    /^server\.(t|j)s$/i,
    /^app\.(t|j)s$/i,
    /^cmd\/[^/]+\/main\.go$/i,
    /^main\.py$/i,
    /^app\.py$/i,
  ];
  for (const p of paths) {
    if (entryRegexes.some((r) => r.test(p))) picked.add(p);
  }

  // Representative files from common "core" folders (cap per folder)
  const folderPrefixes = ["src/", "app/", "server/", "backend/", "api/", "packages/"];
  const coreKeywords = ["routes", "controllers", "services", "components", "lib", "utils", "models"];

  for (const prefix of folderPrefixes) {
    const candidates = paths
      .filter((p) => p.startsWith(prefix))
      .filter((p) => coreKeywords.some((k) => p.toLowerCase().includes(`/${k}/`) || p.toLowerCase().endsWith(`/${k}.ts`)));

    // pick up to 12 per prefix
    for (const p of candidates.slice(0, 12)) picked.add(p);
  }

  // Python/Django common structure
  const pyPrefixes = ["creditrisk/", "src/", ""];
  const pyKeywords = ["settings.py", "urls.py", "views.py", "models.py", "forms.py", "admin.py", "wsgi.py", "asgi.py"];
  for (const prefix of pyPrefixes) {
    const candidates = paths
      .filter((p) => (prefix ? p.startsWith(prefix) : true))
      .filter((p) => pyKeywords.some((k) => p.toLowerCase().endsWith(k)));
    for (const p of candidates.slice(0, 12)) picked.add(p);
  }

  // Cap overall to keep prompt size sane
  return Array.from(picked).slice(0, 40);
}


