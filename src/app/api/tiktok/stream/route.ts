import { NextRequest, NextResponse } from "next/server";

const CDN_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://www.tiktok.com/",
  Origin: "https://www.tiktok.com",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "video",
  "Sec-Fetch-Mode": "no-cors",
  "Sec-Fetch-Site": "cross-site",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mediaUrl = searchParams.get("url");
  const isDownload = searchParams.get("download") === "1";
  const filename = searchParams.get("filename") || "reetools-download.mp4";

  if (!mediaUrl) {
    return NextResponse.json(
      { error: "URL media diperlukan" },
      { status: 400 }
    );
  }

  try {
    // Ensure HTTPS
    const secureUrl = mediaUrl.startsWith("https://")
      ? mediaUrl
      : mediaUrl.replace("http://", "https://");

    const fetchHeaders: Record<string, string> = { ...CDN_HEADERS };

    // Forward Range header for video seeking
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    const cdnRes = await fetch(secureUrl, { headers: fetchHeaders });

    if (!cdnRes.ok && !cdnRes.body) {
      // If CDN blocks, redirect browser directly to the URL
      // Browser might have cookies that allow access
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
      responseHeaders["Content-Disposition"] =
        `attachment; filename="${filename}"`;
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
