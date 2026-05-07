"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { tiktokTools, TikTokSubTool } from "@/lib/tiktok-tools";
import {
  Video,
  Download,
  Music,
  BarChart3,
  ArrowRight,
  Clock,
  ArrowLeft,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  video: <Video size={28} />,
  download: <Download size={28} />,
  music: <Music size={28} />,
  "bar-chart": <BarChart3 size={28} />,
};

function SubToolCard({ tool, index }: { tool: TikTokSubTool; index: number }) {
  const isComingSoon = tool.status === "coming-soon";

  const classes = `block glass-card p-6 md:p-8 group cursor-pointer ${
    isComingSoon ? "opacity-60" : ""
  }`;

  const content = (
    <div className="flex items-start gap-5">
      <div
        className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}
      >
        <div className="text-white">{iconMap[tool.icon]}</div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
            {tool.name}
          </h3>
          {isComingSoon && (
            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock size={11} />
              Soon
            </span>
          )}
        </div>
        <p className="text-white/40 text-sm leading-relaxed">
          {tool.description}
        </p>
      </div>

      {!isComingSoon && (
        <div className="flex-shrink-0 flex items-center mt-1">
          <ArrowRight
            size={20}
            className="text-white/20 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all"
          />
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {isComingSoon ? (
        <div className={classes} style={{ cursor: "not-allowed" }}>
          {content}
        </div>
      ) : (
        <Link href={tool.href} className={classes}>
          {content}
        </Link>
      )}
    </motion.div>
  );
}

export default function TikTokHubPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back to Home</span>
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
            TikTok Tools
          </h1>
          <p className="text-white/40 text-lg max-w-md mx-auto">
            Kumpulan tools khusus buat konten TikTok kamu. Download, edit, dan
            analisis dengan mudah.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tiktokTools.map((tool, index) => (
            <SubToolCard key={tool.id} tool={tool} index={index} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/15 text-xs">
            Masih banyak tools TikTok lain yang akan segera hadir.
          </p>
        </div>
      </div>
    </div>
  );
}
