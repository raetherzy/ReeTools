import { NextRequest, NextResponse } from "next/server";
import { instagramGetUrl } from "instagram-url-direct";

interface InstagramItem {
  type: "video" | "photo";
  url: string;
  thumbnail?: string;
}

interface InstagramResponse {
  type: "video" | "photo" | "carousel";
  url?: string;
  thumbnail?: string;
  description?: string;
  author?: string;
  title?: string;
  items?: InstagramItem[];
}

function isStoryUrl(url: string): boolean {
  return url.includes("instagram.com/stories/") && !url.includes("/highlights/");
}

function isHighlightUrl(url: string): boolean {
  return url.includes("instagram.com/stories/highlights/");
}

async function fetchFromPythonBackend(
  endpoint: string,
  url: string
): Promise<InstagramResponse> {
  const backendUrl =
    process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
  const requestUrl = `${backendUrl}${endpoint}?url=${encodeURIComponent(url)}`;

  const res = await fetch(requestUrl, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Python backend error (${res.status}): ${errorBody.slice(0, 200)}`
    );
  }

  return res.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const instagramUrl = searchParams.get("url");

  if (!instagramUrl || !instagramUrl.includes("instagram.com")) {
    return NextResponse.json(
      { error: "URL Instagram tidak valid" },
      { status: 400 }
    );
  }

  // --- Story & Highlight → forward to Python backend (yt-dlp + cookies) ---
  if (isStoryUrl(instagramUrl)) {
    try {
      const data = await fetchFromPythonBackend(
        "/instagram/story",
        instagramUrl
      );
      return NextResponse.json(data);
    } catch (err: any) {
      console.error("Story error:", err);
      return NextResponse.json(
        {
          error:
            "Gagal mengambil story. Pastikan Python backend berjalan dan cookies sudah diset. " +
            (err.message || ""),
        },
        { status: 500 }
      );
    }
  }

  if (isHighlightUrl(instagramUrl)) {
    try {
      const data = await fetchFromPythonBackend(
        "/instagram/highlight",
        instagramUrl
      );
      return NextResponse.json(data);
    } catch (err: any) {
      console.error("Highlight error:", err);
      return NextResponse.json(
        {
          error:
            "Gagal mengambil highlight. Pastikan Python backend berjalan dan cookies sudah diset. " +
            (err.message || ""),
        },
        { status: 500 }
      );
    }
  }

  // --- Post & Reel → use instagram-url-direct package ---
  try {
    const apiUrl = instagramUrl
      .replace("/reel/", "/p/")
      .replace("/reels/", "/p/");

    const data = await instagramGetUrl(apiUrl);

    if (!data || data.results_number === 0) {
      return NextResponse.json(
        {
          error:
            "Media tidak ditemukan. Pastikan URL benar dan konten publik.",
        },
        { status: 404 }
      );
    }

    const description = data.post_info?.caption || "";
    const author = data.post_info?.owner_username || "";

    if (data.results_number > 1) {
      const items: InstagramItem[] = data.media_details.map((media) => ({
        type: media.type === "video" ? "video" : "photo",
        url: media.url,
        thumbnail: media.thumbnail || media.url,
      }));

      return NextResponse.json<InstagramResponse>({
        type: "carousel",
        items,
        description,
        author,
      });
    }

    const media = data.media_details[0];
    const mediaType = media.type === "video" ? "video" : "photo";

    return NextResponse.json<InstagramResponse>({
      type: mediaType,
      url: media.url,
      thumbnail: media.thumbnail || (mediaType === "photo" ? media.url : ""),
      description,
      author,
    });
  } catch (err: any) {
    console.error("Instagram API error:", err);
    return NextResponse.json(
      {
        error:
          err.message ||
          "Gagal memproses URL Instagram. Pastikan URL benar dan konten publik.",
      },
      { status: 500 }
    );
  }
}
