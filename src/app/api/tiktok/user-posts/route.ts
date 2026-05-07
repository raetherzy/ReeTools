import { NextRequest, NextResponse } from "next/server";
import Tiktok from "@tobyg74/tiktok-api-dl";

function pickHttps(raw: string | string[] | undefined): string {
  if (!raw) return "";
  const fix = (u: string) =>
    u.startsWith("https://") ? u : u.replace(/^http:\/\//, "https://");
  if (typeof raw === "string") return fix(raw);
  if (Array.isArray(raw)) {
    const https = raw.find((u) => u.startsWith("https://"));
    return fix(https || raw[0] || "");
  }
  return "";
}

interface LibPost {
  id: string;
  desc: string;
  createTime: number;
  stats: {
    playCount: number;
    likeCount: number;
    shareCount: number;
    commentCount: number;
  };
  imagePost?: string[];
  video?: {
    playAddr: string | string[];
    downloadAddr: string | string[];
    cover: string | string[];
    originCover: string | string[];
    dynamicCover?: string | string[];
  };
}

interface LibResult {
  status: "success" | "error";
  message?: string;
  result?: LibPost[];
  totalPosts?: number;
}

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

  // ── Strategy 1: @tobyg74 GetUserPosts ────────────────────────────────
  try {
    const data = (await Promise.race([
      Tiktok.GetUserPosts(username, { postLimit }),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("Timeout setelah 40 detik")), 40_000)
      ),
    ])) as LibResult;

    if (data?.status !== "success" || !Array.isArray(data.result)) {
      throw new Error(data?.message || "Response tidak valid dari TikTok");
    }

    const posts = mapPosts(data.result);

    return NextResponse.json({
      username,
      totalPosts: data.totalPosts || posts.length,
      posts,
    });
  } catch (err1) {
    console.warn(
      "[user-posts] @tobyg74 gagal:",
      err1 instanceof Error ? err1.message : err1
    );
  }

  // ── Strategy 2: Tikwm public API (fallback) ──────────────────────────
  try {
    const posts = await fetchViaTikwm(username, postLimit);
    return NextResponse.json({ username, totalPosts: posts.length, posts });
  } catch (err2) {
    console.warn(
      "[user-posts] Tikwm gagal:",
      err2 instanceof Error ? err2.message : err2
    );
  }

  return NextResponse.json(
    {
      error:
        "Gagal mengambil postingan. Kemungkinan akun privat, username salah, atau TikTok sedang membatasi akses. Coba lagi beberapa menit lagi.",
    },
    { status: 404 }
  );
}

function mapPosts(rawList: LibPost[]) {
  return rawList
    .filter(Boolean)
    .map((post) => {
      try {
        const isPhoto =
          Array.isArray(post.imagePost) && post.imagePost.length > 0;

        if (isPhoto) {
          const urls = post.imagePost!.map(pickHttps).filter(Boolean);
          return {
            id: post.id,
            desc: post.desc || "",
            type: "photo" as const,
            thumbnail: urls[0] || "",
            url: urls[0] || "",
            urls,
            stats: normalizeStats(post.stats),
            createTime: post.createTime || 0,
          };
        }

        const v = post.video!;
        const videoUrl =
          pickHttps(v.downloadAddr) || pickHttps(v.playAddr) || "";
        const thumbnail =
          pickHttps(v.originCover) ||
          pickHttps(v.cover) ||
          pickHttps(v.dynamicCover) ||
          "";

        return {
          id: post.id,
          desc: post.desc || "",
          type: "video" as const,
          thumbnail,
          url: videoUrl,
          stats: normalizeStats(post.stats),
          createTime: post.createTime || 0,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function normalizeStats(s: LibPost["stats"]) {
  return {
    playCount: s?.playCount || 0,
    likeCount: s?.likeCount || 0,
    shareCount: s?.shareCount || 0,
    commentCount: s?.commentCount || 0,
  };
}

async function fetchViaTikwm(username: string, limit: number) {
  const res = await fetch(
    `https://www.tikwm.com/api/user/posts?unique_id=${encodeURIComponent(
      username
    )}&count=${Math.min(limit, 35)}&cursor=0`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      },
    }
  );

  if (!res.ok) throw new Error(`Tikwm HTTP ${res.status}`);

  const json = await res.json();
  if (json?.code !== 0 || !Array.isArray(json?.data?.videos)) {
    throw new Error(json?.msg || "Tikwm: response tidak valid");
  }

  return json.data.videos.map((v: Record<string, unknown>) => ({
    id: String(v.video_id || v.id || ""),
    desc: String(v.title || ""),
    type: (v.images ? "photo" : "video") as "photo" | "video",
    thumbnail: v.cover || v.origin_cover || "",
    url: v.play || v.wmplay || "",
    urls: (v.images as Array<Record<string, unknown>> | undefined)?.map(
      (img) => (img.url || img) as string
    ) || undefined,
    stats: {
      playCount: v.play_count || 0,
      likeCount: v.digg_count || 0,
      shareCount: v.share_count || 0,
      commentCount: v.comment_count || 0,
    },
    createTime: v.create_time || 0,
  }));
}
