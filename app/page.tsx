"use client";

import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { PromptInput } from "@/components/PromptInput";
import { TaskHistory } from "@/components/TaskHistory";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  return (
    <main className="min-h-screen bg-orange-50/30">
      <Header />
      <div className="container mx-auto px-4 pb-20">
        <Hero />
        <div className="flex flex-col items-center gap-8">
          <PromptInput />
          <TaskHistory />
          <Footer />
        </div>
      </div>
      <Toaster />
    </main>
  );
}
