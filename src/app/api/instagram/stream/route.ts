import { NextRequest, NextResponse } from "next/server";

const CDN_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://www.instagram.com/",
  Origin: "https://www.instagram.com",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "cross-site",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mediaUrl = searchParams.get("url");
  const isDownload = searchParams.get("download") === "1";
  const filename = searchParams.get("filename") || "reetools-instagram-media";
  const mediaType = searchParams.get("type") || "";

  if (!mediaUrl) {
    return NextResponse.json(
      { error: "URL media diperlukan" },
      { status: 400 }
    );
  }

  try {
    const secureUrl = mediaUrl.startsWith("https://")
      ? mediaUrl
      : mediaUrl.replace("http://", "https://");

    const fetchHeaders: Record<string, string> = { ...CDN_HEADERS };

    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    const cdnRes = await fetch(secureUrl, { headers: fetchHeaders });

    if (!cdnRes.ok && !cdnRes.body) {
      if (isDownload) {
        return NextResponse.redirect(secureUrl);
      }
      return NextResponse.json(
        { error: `CDN error (${cdnRes.status})` },
        { status: 502 }
      );
    }

    const contentType =
      cdnRes.headers.get("content-type") || "application/octet-stream";
    const contentLength = cdnRes.headers.get("content-length");
    const contentRange = cdnRes.headers.get("content-range");
    const status = rangeHeader && cdnRes.status === 206 ? 206 : 200;

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    };

    if (isDownload) {
      const ext =
        mediaType === "photo"
          ? "jpg"
          : contentType.includes("video")
            ? "mp4"
            : "jpg";
      responseHeaders["Content-Disposition"] =
        `attachment; filename="${filename}.${ext}"`;
    }

    if (contentLength) responseHeaders["Content-Length"] = contentLength;
    if (contentRange) responseHeaders["Content-Range"] = contentRange;

    return new NextResponse(cdnRes.body, {
      status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("Stream proxy error:", err);
    return NextResponse.json(
      { error: "Gagal streaming media" },
      { status: 502 }
    );
  }
}
