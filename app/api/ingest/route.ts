import { NextResponse } from "next/server";
import { fetchRepoReadme, fetchRepoTree, fetchTextFile, parseGitHubRepoUrl, pickImportantPaths } from "@/lib/github";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { repoUrl?: string };
    const repoUrl = body.repoUrl?.trim();
    if (!repoUrl) {
      return NextResponse.json({ ok: false, error: "repoUrl is required" }, { status: 400 });
    }

    const ref = parseGitHubRepoUrl(repoUrl);
    const readme = await fetchRepoReadme(ref);
    const { branch, defaultBranch, tree } = await fetchRepoTree(ref);

    const allPaths = tree
      .filter((n) => n.type === "blob")
      .map((n) => n.path)
      .filter(Boolean) as string[];

    const picked = pickImportantPaths(allPaths);
    const files = (await Promise.all(picked.map((p) => fetchTextFile(ref, p)))).filter(Boolean);

    return NextResponse.json({
      ok: true,
      repo: { owner: ref.owner, repo: ref.repo, ref: ref.ref ?? null, branch, defaultBranch },
      summary: { totalFilesInTree: allPaths.length, pickedFiles: picked.length, fetchedFiles: files.length + (readme ? 1 : 0) },
      readme,
      files,
      picked,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? String(error) }, { status: 500 });
  }
}


