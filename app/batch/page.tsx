"use client";

import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { BatchPromptInput } from "@/components/BatchPromptInput";
import { TaskHistory } from "@/components/TaskHistory";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";

export default function BatchPage() {
  return (
    <main className="min-h-screen bg-orange-50/30">
      <Header />
      <div className="container mx-auto px-4 pb-20">
        <Hero />
        <div className="flex flex-col items-center gap-8">
          <div className="w-full max-w-3xl text-center">
            <h2 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-gray-200">
              批量生成模式
            </h2>
            <p className="text-sm text-gray-500">
              一次性生成多个视频任务，高效创作。
            </p>
          </div>
          <BatchPromptInput />
          <TaskHistory />
          <Footer />
        </div>
      </div>
      <Toaster />
    </main>
  );
}