import { NextRequest, NextResponse } from "next/server";

const SERVER_URL = process.env.TIKTOK_SERVER_URL || "";
const API_KEY = process.env.TIKTOK_API_KEY || "";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.replace(/^@/, "").trim();
  const postLimit = Math.min(
    parseInt(searchParams.get("postLimit") || "30", 10) || 30,
    50
  );

  if (!username) {
    return NextResponse.json(
      { error: "Username TikTok diperlukan" },
      { status: 400 }
    );
  }

  // ── Server (primary) ──────────────────────────────────────────────────
  if (SERVER_URL && API_KEY) {
    try {
      const url = `${SERVER_URL}/?username=${encodeURIComponent(username)}&limit=${postLimit}&key=${encodeURIComponent(API_KEY)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(50_000) });
      const data = await res.json();

      if (!res.ok) {
        return NextResponse.json(
          { error: data.error || "Gagal mengambil postingan" },
          { status: res.status }
        );
      }

      return NextResponse.json(data);
    } catch (err) {
      console.warn("[user-posts] Server failed:", (err as Error).message);
    }
  }

  // ── TikTok API directly (fallback) ─────────────────────────────────────
  try {
    const { default: Tiktok } = await import("@tobyg74/tiktok-api-dl");

    const data = await Promise.race([
      Tiktok.GetUserPosts(username, { postLimit }),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("Timeout")), 25_000)
      ),
    ]);

    const result = data as {
      status: string;
      message?: string;
      result?: Array<Record<string, unknown>>;
    };

    if (result?.status !== "success" || !Array.isArray(result.result)) {
      throw new Error(result?.message || "No posts");
    }

    const posts = result.result.map((p) => ({
      id: String(p.id || ""),
      desc: String(p.desc || ""),
      type: (p.imagePost ? "photo" : "video") as "photo" | "video",
      thumbnail: String(
        (p.video as Record<string, unknown>)?.originCover ||
          (p.video as Record<string, unknown>)?.cover ||
          (p.imagePost as string[])?.[0] ||
          ""
      ),
      url: String(
        (p.video as Record<string, unknown>)?.downloadAddr ||
          (p.video as Record<string, unknown>)?.playAddr ||
          (p.imagePost as string[])?.[0] ||
          ""
      ),
      urls: (p.imagePost as string[]) || undefined,
      stats: {
        playCount: (p.stats as Record<string, number>)?.playCount || 0,
        likeCount: (p.stats as Record<string, number>)?.likeCount || 0,
      },
      createTime: Number(p.createTime) || 0,
    }));

    return NextResponse.json({ username, totalPosts: posts.length, posts });
  } catch (err) {
    console.warn("[user-posts] Direct failed:", (err as Error).message);
  }

  return NextResponse.json(
    {
      error:
        "Gagal mengambil postingan. Coba lagi beberapa menit lagi.",
    },
    { status: 404 }
  );
}
