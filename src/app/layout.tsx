import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GlassNavbar } from "@/components/ui/GlassNavbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReeTools - Powerful Online Tools",
  description: "Kumpulan tools online gratis untuk mempermudah pekerjaanmu. TikTok Watermark Remover, Image Compressor, File Converter, dan masih banyak lagi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Animated background blobs */}
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-blob bg-blob-3" />

        <GlassNavbar />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
