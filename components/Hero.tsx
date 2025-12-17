"use client";

import { motion } from "framer-motion";

export function Hero() {
  return (
    <div className="relative flex flex-col items-center justify-center space-y-8 py-16 text-center perspective-1000">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <h1 className="bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
          Sora Magic Creative
          <br />
          <span className="text-4xl text-gray-600 dark:text-gray-300 sm:text-5xl">
            让 AI 实现你的无限创意
          </span>
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-2xl text-lg text-gray-500 dark:text-gray-400 relative z-10"
      >
        探索 AI 视频与图像生成的无限可能。支持最新的 Sora
        模型，一键生成高质量视频和图像。
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-wrap items-center justify-center gap-4 relative z-10"
      >
        <motion.div
          whileHover={{ scale: 1.05, rotate: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-6 py-2 text-blue-700 shadow-[0_10px_20px_rgba(59,130,246,0.1)] dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300"
        >
          <span className="text-xl">📹</span>
          <span className="font-medium">Sora Video</span>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05, rotate: 2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-6 py-2 text-purple-700 shadow-[0_10px_20px_rgba(168,85,247,0.1)] dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-300"
        >
          <span className="text-xl">🎨</span>
          <span className="font-medium">Sora Image</span>
        </motion.div>
      </motion.div>

      {/* 3D Floating Elements Background */}
      <div className="absolute inset-0 -z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-[10%] top-[20%] text-6xl opacity-20 blur-sm"
        >
          🎨
        </motion.div>
        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute right-[10%] top-[30%] text-6xl opacity-20 blur-sm"
        >
          📹
        </motion.div>
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute left-[20%] bottom-[10%] text-4xl opacity-10 blur-sm"
        >
          ✨
        </motion.div>
        <motion.div
          animate={{
            y: [0, 15, 0],
            rotate: [0, -10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
          className="absolute right-[20%] bottom-[20%] text-5xl opacity-10 blur-sm"
        >
          🚀
        </motion.div>
      </div>
    </div>
  );
}