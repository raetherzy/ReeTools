"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Video, Download, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ResultData {
  type: "video" | "photo";
  url: string;
  thumbnail?: string;
  description?: string;
  author?: string;
  title?: string;
}

export default function TikTokWatermarkPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "done">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/tiktok?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses URL TikTok");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const extension = result.type === "video" ? "mp4" : "jpg";
    const filename = `reetools-tiktok-${Date.now()}.${extension}`;

    // Open CDN URL directly — browser handles the download natively (no CORS for navigation)
    const a = document.createElement("a");
    a.href = `/api/tiktok/stream?url=${encodeURIComponent(result.url)}&download=1&filename=${encodeURIComponent(filename)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadState("done");
    setTimeout(() => setDownloadState("idle"), 2000);
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-xl shadow-pink-500/20 mb-6">
            <Video size={32} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            TikTok Watermark Remover
          </h1>
          <p className="text-white/40 text-lg max-w-md mx-auto">
            Paste URL TikTok kamu, dan download video atau foto tanpa watermark dengan kualitas penuh.
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
              placeholder="Paste URL TikTok di sini..."
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
                  Remove
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
              <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium text-sm">Gagal</p>
                <p className="text-white/50 text-sm mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Result */}
        {result && (
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
                {result.type === "video" ? "Video" : "Foto"} tanpa watermark
              </span>
            </div>

            {/* Preview */}
            {result.type === "video" ? (
              <div className="relative rounded-2xl overflow-hidden bg-black/40 mb-5">
                <video
                  src={`/api/tiktok/stream?url=${encodeURIComponent(result.url)}`}
                  controls
                  className="w-full max-h-[400px] object-contain"
                  poster={result.thumbnail}
                  preload="metadata"
                />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black/40 mb-5 aspect-video">
                <Image
                  src={result.url}
                  alt="TikTok photo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}

            {/* Description */}
            {result.description && (
              <p className="text-white/50 text-sm mb-5">{result.description}</p>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={downloadState === "loading"}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold flex items-center justify-center gap-2 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50"
            >
              {downloadState === "loading" ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Downloading...
                </>
              ) : downloadState === "done" ? (
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
          </motion.div>
        )}

        {/* Info */}
        <div className="mt-12 text-center">
          <p className="text-white/15 text-xs">
            Tools ini hanya untuk menghapus watermark TikTok. Gunakan dengan bijak.
          </p>
        </div>
      </div>
    </div>
  );
}
