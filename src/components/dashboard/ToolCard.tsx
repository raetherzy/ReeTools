"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Tool } from "@/lib/tools";
import {
  Video,
  Image,
  FileText,
  Scissors,
  Link as LinkIcon,
  File,
  ArrowRight,
  Clock,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  video: <Video size={28} />,
  image: <Image size={28} />,
  file: <File size={28} />,
  "file-text": <FileText size={28} />,
  scissors: <Scissors size={28} />,
  link: <LinkIcon size={28} />,
};

function ToolCardContent({ tool, isComingSoon }: { tool: Tool; isComingSoon: boolean }) {
  return (
    <>
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
    </>
  );
}

export function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  const isComingSoon = tool.status === "coming-soon";

  const classes = `block glass-card p-6 md:p-8 group cursor-pointer ${
    isComingSoon ? "opacity-60" : ""
  }`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {isComingSoon ? (
        <div className={classes} style={{ cursor: "not-allowed" }}>
          <ToolCardContent tool={tool} isComingSoon={true} />
        </div>
      ) : (
        <Link href={tool.href} className={classes}>
          <ToolCardContent tool={tool} isComingSoon={false} />
        </Link>
      )}
    </motion.div>
  );
}
