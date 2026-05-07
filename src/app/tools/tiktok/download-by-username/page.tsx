"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Search,
  Play,
  ImageIcon,
  Eye,
  Heart,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface PostData {
  id: string;
  desc: string;
  type: "video" | "photo";
  thumbnail: string;
  url: string;
  urls?: string[];
  stats: {
    playCount: number;
    likeCount: number;
    shareCount: number;
    commentCount: number;
  };
  createTime: number;
}

interface UserPostsResult {
  username: string;
  totalPosts: number;
  posts: PostData[];
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default function DownloadByUsernamePage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UserPostsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadAllState, setDownloadAllState] = useState<
    "idle" | "loading" | "done"
  >("idle");
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/tiktok/user-posts?username=${encodeURIComponent(username.trim())}`
      );

        if (!res.ok) {
          const errMsg = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
          throw new Error(errMsg.error || "Gagal mengambil postingan");
        }

      const data = await res.json();
      setResult(data as UserPostsResult);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSingle = (post: PostData) => {
    const extension = post.type === "video" ? "mp4" : "jpg";
    const filename = `reetools-${post.id}.${extension}`;

    const a = document.createElement("a");
    a.href = `/api/tiktok/stream?url=${encodeURIComponent(post.url)}&download=1&filename=${encodeURIComponent(filename)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadingIds((prev) => {
      const next = new Set(prev);
      next.add(post.id);
      return next;
    });
    setTimeout(() => {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }, 1500);
  };

  const handleDownloadAll = async () => {
    if (!result || downloadAllState === "loading") return;

    const posts = result.posts;
    setDownloadAllState("loading");
    setDownloadProgress({ current: 0, total: posts.length });

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const extension = post.type === "video" ? "mp4" : "jpg";
      const filename = `reetools-${post.id}.${extension}`;
      const streamUrl = `/api/tiktok/stream?url=${encodeURIComponent(post.url)}&download=1&filename=${encodeURIComponent(filename)}`;

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

      setDownloadProgress({ current: i + 1, total: posts.length });
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    setDownloadAllState("done");
    setTimeout(() => {
      setDownloadAllState("idle");
      setDownloadProgress({ current: 0, total: 0 });
    }, 3000);
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl">
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-xl shadow-blue-500/20 mb-6">
            <Download size={32} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Download All Videos by Username v2
          </h1>
          <p className="text-white/40 text-lg max-w-md mx-auto">
            Masukkan username TikTok dan download semua postingan sekaligus.
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
            <span className="pl-5 text-white/20 text-sm flex-shrink-0 select-none">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username TikTok..."
              className="flex-1 bg-transparent px-2 py-4 text-white placeholder-white/20 outline-none border-none text-[15px]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="flex-shrink-0 m-1.5 px-6 py-2.5 rounded-xl glass-btn flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Mencari...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Cari
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
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-white font-semibold text-lg">
                  @{result.username}
                </p>
                <p className="text-white/40 text-sm">
                  {result.totalPosts} postingan ditemukan
                </p>
              </div>
              <button
                onClick={handleDownloadAll}
                disabled={downloadAllState === "loading"}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium flex items-center justify-center gap-2 hover:from-blue-400 hover:to-cyan-400 transition-all disabled:opacity-50 text-sm"
              >
                {downloadAllState === "loading" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {downloadProgress.current}/{downloadProgress.total}
                  </>
                ) : downloadAllState === "done" ? (
                  <>
                    <CheckCircle2 size={16} />
                    Selesai!
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download Semua ({result.posts.length})
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {result.posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="glass-card overflow-hidden group"
                >
                  <div className="relative aspect-[3/4] bg-black/40 overflow-hidden">
                    {post.thumbnail ? (
                      <Image
                        src={post.thumbnail}
                        alt={post.desc || "TikTok post"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white/20 text-xs">No preview</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium flex items-center gap-1">
                      {post.type === "video" ? (
                        <>
                          <Play size={10} />
                          Video
                        </>
                      ) : (
                        <>
                          <ImageIcon size={10} />
                          Foto
                        </>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <div className="flex items-center gap-3 text-white/80 text-[10px]">
                        <span className="flex items-center gap-1">
                          <Eye size={10} />
                          {formatCount(post.stats.playCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={10} />
                          {formatCount(post.stats.likeCount)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSingle(post);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-blue-500/90 hover:bg-blue-500 flex items-center justify-center transition-colors"
                    >
                      {downloadingIds.has(post.id) ? (
                        <CheckCircle2 size={14} className="text-white" />
                      ) : (
                        <Download size={14} className="text-white" />
                      )}
                    </button>
                  </div>
                  {post.desc && (
                    <div className="p-2.5">
                      <p className="text-white/60 text-xs line-clamp-2 leading-relaxed">
                        {post.desc}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="mt-12 text-center">
          <p className="text-white/15 text-xs">
            Tools ini hanya untuk mengunduh konten TikTok publik. Gunakan dengan
            bijak.
          </p>
        </div>
      </div>
    </div>
  );
}
