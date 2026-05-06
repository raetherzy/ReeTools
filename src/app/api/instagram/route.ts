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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const instagramUrl = searchParams.get("url");

  if (!instagramUrl || !instagramUrl.includes("instagram.com")) {
    return NextResponse.json(
      { error: "URL Instagram tidak valid" },
      { status: 400 }
    );
  }

  try {
    // Convert /reel/ URLs to /p/ for better API compatibility
    const apiUrl = instagramUrl.replace("/reel/", "/p/").replace("/reels/", "/p/");

    const data = await instagramGetUrl(apiUrl);

    if (!data || data.results_number === 0) {
      return NextResponse.json(
        { error: "Media tidak ditemukan. Pastikan URL benar dan konten publik." },
        { status: 404 }
      );
    }

    const description = data.post_info?.caption || "";
    const author = data.post_info?.owner_username || "";

    // Carousel (multiple media items)
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

    // Single media
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
          err.message || "Gagal memproses URL Instagram. Pastikan URL benar dan konten publik.",
      },
      { status: 500 }
    );
  }
}
