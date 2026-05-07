"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Video, Download, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ResultData {
  type: "video" | "photo";
  url: string;
  urls?: string[];
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
  const [downloadAllState, setDownloadAllState] = useState<"idle" | "loading" | "done">("idle");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentImageIndex(0);

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

    const allUrls = result.urls && result.urls.length > 0 ? result.urls : [result.url];
    const downloadUrl = allUrls[currentImageIndex] || result.url;
    const extension = result.type === "video" ? "mp4" : "jpg";
    const filename = `reetools-tiktok-${Date.now()}.${extension}`;

    const a = document.createElement("a");
    a.href = `/api/tiktok/stream?url=${encodeURIComponent(downloadUrl)}&download=1&filename=${encodeURIComponent(filename)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadState("done");
    setTimeout(() => setDownloadState("idle"), 2000);
  };

  const handleDownloadAll = async () => {
    if (!result || downloadAllState === "loading") return;

    const allUrls = result.urls && result.urls.length > 0 ? result.urls : [result.url];
    setDownloadAllState("loading");

    for (let i = 0; i < allUrls.length; i++) {
      const filename = `reetools-tiktok-${Date.now()}-${i + 1}.jpg`;
      const streamUrl = `/api/tiktok/stream?url=${encodeURIComponent(allUrls[i])}&download=1&filename=${encodeURIComponent(filename)}`;

      try {
        const res = await fetch(streamUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch {
        window.open(streamUrl, "_blank");
      }

      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    setDownloadAllState("done");
    setTimeout(() => setDownloadAllState("idle"), 2000);
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/tools/tiktok"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back to TikTok Tools</span>
        </Link>

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
              <>
                {(() => {
                  const photoUrls = result.urls && result.urls.length > 0 ? result.urls : [result.url];
                  const hasMultiple = photoUrls.length > 1;
                  const currentImage = photoUrls[currentImageIndex] || photoUrls[0];

                  return (
                    <>
                      <div className="relative rounded-2xl overflow-hidden bg-black/40 mb-3">
                        {hasMultiple && (
                          <>
                            <button
                              onClick={() =>
                                setCurrentImageIndex((i) => (i === 0 ? photoUrls.length - 1 : i - 1))
                              }
                              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                            >
                              <ChevronLeft size={20} className="text-white" />
                            </button>
                            <button
                              onClick={() =>
                                setCurrentImageIndex((i) => (i === photoUrls.length - 1 ? 0 : i + 1))
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                            >
                              <ChevronRight size={20} className="text-white" />
                            </button>
                            <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
                              {currentImageIndex + 1} / {photoUrls.length}
                            </div>
                          </>
                        )}
                        <Image
                          src={currentImage}
                          alt="TikTok photo"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>

                      {hasMultiple && (
                        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                          {photoUrls.map((imageUrl, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                                idx === currentImageIndex
                                  ? "border-emerald-400 opacity-100"
                                  : "border-transparent opacity-50 hover:opacity-80"
                              }`}
                            >
                              <Image
                                src={imageUrl}
                                alt={`Photo ${idx + 1}`}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            {result.description && (
              <p className="text-white/50 text-sm mb-5">{result.description}</p>
            )}

            <div className="space-y-3">
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

              {result.type === "photo" && result.urls && result.urls.length > 1 && (
                <button
                  onClick={handleDownloadAll}
                  disabled={downloadAllState === "loading"}
                  className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  {downloadAllState === "loading" ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Downloading all...
                    </>
                  ) : downloadAllState === "done" ? (
                    <>
                      <CheckCircle2 size={18} />
                      All Downloaded!
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Download Semua ({result.urls.length} Foto)
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}

        <div className="mt-12 text-center">
          <p className="text-white/15 text-xs">
            Tools ini hanya untuk menghapus watermark TikTok. Gunakan dengan bijak.
          </p>
        </div>
      </div>
    </div>
  );
}
