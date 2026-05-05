"use client";

import { motion } from "framer-motion";
import { Wrench } from "lucide-react";

export function HeroBanner() {
  return (
    <section className="max-w-7xl mx-auto px-6 pt-24 pb-16 text-center relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="inline-flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <Wrench size={24} className="text-white" />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
          Ree<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Tools</span>
        </h1>

        <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
          Kumpulan tools online gratis dan powerful untuk mempermudah pekerjaanmu.
          Tidak perlu install software — semuanya berjalan langsung di browser.
        </p>
      </motion.div>

      {/* Decorative line */}
      <div className="mt-12 flex justify-center">
        <div className="w-24 h-1 rounded-full bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-cyan-500/50" />
      </div>
    </section>
  );
}
