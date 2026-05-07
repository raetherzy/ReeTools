export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  status: "active" | "coming-soon";
  color: string;
}

export const tools: Tool[] = [
  {
    id: "tiktok",
    name: "TikTok Tools",
    description: "Kumpulan tools khusus TikTok: download tanpa watermark, download semua video berdasarkan username, audio downloader, dan lainnya.",
    icon: "video",
    href: "/tools/tiktok",
    status: "active",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    description: "Kompres gambar tanpa kehilangan kualitas visual yang signifikan.",
    icon: "image",
    href: "/tools/image-compressor",
    status: "coming-soon",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "file-converter",
    name: "File Converter",
    description: "Konversi berbagai format file dengan cepat dan mudah.",
    icon: "file",
    href: "/tools/file-converter",
    status: "coming-soon",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "pdf-tools",
    name: "PDF Tools",
    description: "Merge, split, compress, dan edit file PDF dengan mudah.",
    icon: "file-text",
    href: "/tools/pdf-tools",
    status: "coming-soon",
    color: "from-red-500 to-orange-500",
  },
  {
    id: "bg-remover",
    name: "Background Remover",
    description: "Hapus background foto secara otomatis dengan AI.",
    icon: "scissors",
    href: "/tools/bg-remover",
    status: "coming-soon",
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "url-shortener",
    name: "URL Shortener",
    description: "Perpendek URL panjang jadi singkat dan mudah dibagikan.",
    icon: "link",
    href: "/tools/url-shortener",
    status: "coming-soon",
    color: "from-cyan-500 to-blue-500",
  },
];
