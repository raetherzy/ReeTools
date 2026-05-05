import { NextRequest, NextResponse } from "next/server";
import Tiktok from "@tobyg74/tiktok-api-dl";

interface TikTokVideoData {
  type: "video" | "photo";
  url: string;
  thumbnail: string;
  description: string;
  author: string;
}

/**
 * Pick HTTPS URL from TikTok URL array (returns [http, https])
 */
function pickHttps(raw: string | string[] | undefined): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw.startsWith("https://") ? raw : raw.replace("http://", "https://");
  if (Array.isArray(raw)) {
    const https = raw.find((u: string) => u.startsWith("https://"));
    if (https) return https;
    const first = raw[0] || "";
    return first.replace("http://", "https://");
  }
  return "";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tiktokUrl = searchParams.get("url");

  if (!tiktokUrl) {
    return NextResponse.json(
      { error: "URL TikTok diperlukan" },
      { status: 400 }
    );
  }

  if (!tiktokUrl.includes("tiktok.com")) {
    return NextResponse.json(
      { error: "URL bukan dari TikTok" },
      { status: 400 }
    );
  }

  try {
    const response = await Tiktok.Downloader(tiktokUrl, { version: "v1" });

    if (response.status !== "success" || !response.result) {
      return NextResponse.json(
        { error: response.message || "Gagal mengambil video TikTok" },
        { status: 500 }
      );
    }

    const result = response.result;

    // Video type
    if (result.type === "video" && result.video) {
      const videoUrl =
        result.videoHD ||
        pickHttps(result.video.downloadAddr) ||
        pickHttps(result.video.playAddr);

      if (!videoUrl) {
        return NextResponse.json(
          { error: "URL video tidak ditemukan" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        type: "video",
        url: videoUrl,
        thumbnail:
          pickHttps(result.video.cover) ||
          pickHttps(result.video.originCover) ||
          pickHttps(result.video.dynamicCover) ||
          "",
        description: result.desc || "",
        author: result.author?.nickname || "",
      });
    }

    // Photo/slideshow type
    if ((result.type === "image" || !result.video) && result.images && result.images.length > 0) {
      return NextResponse.json({
        type: "photo",
        url: pickHttps(result.images),
        thumbnail: pickHttps(result.images),
        description: result.desc || "",
        author: result.author?.nickname || "",
      });
    }

    return NextResponse.json(
      { error: "Konten tidak didukung atau tidak ditemukan" },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("TikTok API error:", err);
    return NextResponse.json(
      { error: "Gagal memproses URL TikTok. Coba lagi nanti." },
      { status: 500 }
    );
  }
}
