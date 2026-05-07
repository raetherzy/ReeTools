export interface TikTokSubTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  status: "active" | "coming-soon";
  color: string;
}

export const tiktokTools: TikTokSubTool[] = [
  {
    id: "watermark",
    name: "TikTok Watermark Remover",
    description: "Hapus watermark video & foto TikTok tanpa mengurangi kualitas asli. Cukup paste URL dan download hasilnya.",
    icon: "video",
    href: "/tools/tiktok/watermark",
    status: "active",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "download-by-username",
    name: "Download All Videos by Username",
    description: "Download semua video TikTok dari satu username sekaligus dengan satu klik.",
    icon: "download",
    href: "/tools/tiktok/download-by-username",
    status: "coming-soon",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "audio-downloader",
    name: "TikTok Audio Downloader",
    description: "Ekstrak dan download audio / music dari video TikTok dalam format MP3.",
    icon: "music",
    href: "/tools/tiktok/audio-downloader",
    status: "coming-soon",
    color: "from-purple-500 to-violet-500",
  },
  {
    id: "profile-analyzer",
    name: "TikTok Profile Analyzer",
    description: "Analisis profil TikTok: total likes, views, engagement rate, dan statistik lengkap.",
    icon: "bar-chart",
    href: "/tools/tiktok/profile-analyzer",
    status: "coming-soon",
    color: "from-emerald-500 to-teal-500",
  },
];
