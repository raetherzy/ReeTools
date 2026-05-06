"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Instagram,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  ImageIcon,
  Film,
} from "lucide-react";
import Link from "next/link";

interface InstagramItem {
  type: "video" | "photo";
  url: string;
  thumbnail?: string;
}

interface ResultData {
  type: "video" | "photo" | "carousel";
  url?: string;
  thumbnail?: string;
  description?: string;
  author?: string;
  title?: string;
  items?: InstagramItem[];
}

export default function InstagramDownloaderPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<
    Record<string, "idle" | "done">
  >({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setDownloadState({});

    try {
      // Strip tracking params (utm, igsh, etc.) before sending
      const cleanUrl = url.trim().split("?")[0].replace(/\/$/, "");
      const finalUrl = cleanUrl.includes("instagram.com/p/") || cleanUrl.includes("instagram.com/reel/")
        ? cleanUrl + "/"
        : cleanUrl;

      const res = await fetch(
        `/api/instagram?url=${encodeURIComponent(finalUrl)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses URL Instagram");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (mediaUrl: string, type: "video" | "photo") => {
    const ext = type === "video" ? "mp4" : "jpg";
    const filename = `reetools-instagram-${Date.now()}.${ext}`;

    const a = document.createElement("a");
    a.href = `/api/instagram/stream?url=${encodeURIComponent(mediaUrl)}&download=1&filename=${encodeURIComponent(filename)}&type=${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadState((prev) => ({ ...prev, [mediaUrl]: "done" }));
    setTimeout(() => {
      setDownloadState((prev) => {
        const next = { ...prev };
        next[mediaUrl] = "idle";
        return next;
      });
    }, 2000);
  };

  const renderMediaPreview = (
    item: { type: "video" | "photo"; url: string; thumbnail?: string },
    index?: number
  ) => {
    const streamUrl = `/api/instagram/stream?url=${encodeURIComponent(item.url)}`;
    if (item.type === "video") {
      return (
        <div className="relative rounded-2xl overflow-hidden bg-black/40 mb-4">
          <video
            src={streamUrl}
            controls
            className="w-full max-h-[400px] object-contain"
            poster={item.thumbnail}
            preload="metadata"
          />
        </div>
      );
    }
    return (
      <div className="relative rounded-2xl overflow-hidden bg-black/40 mb-4 aspect-video">
        <img
          src={streamUrl}
          alt={`Instagram photo${index !== undefined ? ` ${index + 1}` : ""}`}
          className="w-full h-full object-contain"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back to Home</span>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-xl shadow-purple-500/20 mb-6">
            <Instagram size={32} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Instagram Downloader
          </h1>
          <p className="text-white/40 text-lg max-w-md mx-auto">
            Download video Reels, foto, carousel, story, dan highlight dari Instagram. Cukup paste URL dan download hasilnya.
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="glass-card p-1 mb-8"
        >
          <div className="flex items-center gap-0">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste URL Instagram (post, reel, story, highlight)..."
              className="flex-1 bg-transparent px-5 py-4 text-white placeholder-white/20 outline-none border-none text-[15px]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex-shrink-0 m-1.5 px-6 py-2.5 rounded-xl glass-btn flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Ambil
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 mb-8 border-red-500/20"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="text-red-400 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-red-400 font-medium text-sm">Gagal</p>
                <p className="text-white/50 text-sm mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Result - Single Video/Photo */}
        {result && result.type !== "carousel" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <CheckCircle2 size={22} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Berhasil!</span>
              <span className="text-white/30 text-sm ml-auto flex items-center gap-1.5">
                {result.type === "video" ? (
                  <>
                    <Film size={14} /> Video
                  </>
                ) : (
                  <>
                    <ImageIcon size={14} /> Foto
                  </>
                )}
              </span>
            </div>

            {/* Preview */}
            {result.url &&
              renderMediaPreview({
                type: result.type as "video" | "photo",
                url: result.url,
                thumbnail: result.thumbnail,
              })}

            {/* Info */}
            {(result.description || result.author || result.title) && (
              <div className="mb-5 space-y-1">
                {result.author && (
                  <p className="text-white/40 text-sm">@{result.author}</p>
                )}
                {(result.description || result.title) && (
                  <p className="text-white/60 text-sm">
                    {result.description || result.title}
                  </p>
                )}
              </div>
            )}

            {/* Download Button */}
            {result.url && (
              <button
                onClick={() =>
                  handleDownload(
                    result.url!,
                    result.type as "video" | "photo"
                  )
                }
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold flex items-center justify-center gap-2 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50"
              >
                {downloadState[result.url] === "done" ? (
                  <>
                    <CheckCircle2 size={18} />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download {result.type === "video" ? "Video" : "Foto"}
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}

        {/* Result - Carousel */}
        {result && result.type === "carousel" && result.items && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <CheckCircle2 size={22} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Berhasil!</span>
              <span className="text-white/30 text-sm ml-auto">
                {result.items.length} item carousel
              </span>
            </div>

            {/* Info */}
            {(result.description || result.author) && (
              <div className="mb-5 space-y-1">
                {result.author && (
                  <p className="text-white/40 text-sm">@{result.author}</p>
                )}
                {result.description && (
                  <p className="text-white/60 text-sm">
                    {result.description}
                  </p>
                )}
              </div>
            )}

            {/* Carousel Items Grid */}
            <div className="grid grid-cols-2 gap-3">
              {result.items.map((item, i) => (
                <div
                  key={i}
                  className="border border-white/[0.06] rounded-xl p-3 bg-white/[0.02]"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    {item.type === "video" ? (
                      <Film size={12} className="text-white/40" />
                    ) : (
                      <ImageIcon size={12} className="text-white/40" />
                    )}
                    <span className="text-white/30 text-xs">
                      {item.type === "video" ? "Video" : "Foto"} {i + 1}
                    </span>
                  </div>

                  {item.thumbnail && (
                    <div className="relative rounded-lg overflow-hidden bg-black/40 mb-2 aspect-square">
                      <img
                        src={`/api/instagram/stream?url=${encodeURIComponent(item.thumbnail)}`}
                        alt={`Item ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => handleDownload(item.url, item.type)}
                    className="w-full py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                  >
                    {downloadState[item.url] === "done" ? (
                      <>
                        <CheckCircle2 size={12} />
                        Downloaded
                      </>
                    ) : (
                      <>
                        <Download size={12} />
                        Download
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Info */}
        <div className="mt-12 text-center">
          <p className="text-white/15 text-xs">
            Post & Reel: tanpa login. Story & Highlight: memerlukan Python backend + cookies Instagram.
          </p>
        </div>
      </div>
    </div>
  );
}
