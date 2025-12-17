"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Layers, Zap } from "lucide-react";
import { ConfigDialog } from "./ConfigDialog";
import { ModeToggle } from "./ModeToggle";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Sora Magic
          </span>
        </Link>
        
        <nav className="flex items-center gap-1">
          <Link href="/">
             <Button
                variant={pathname === "/" ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
             >
                <Zap className="h-4 w-4" />
                单次生成
             </Button>
          </Link>
          <Link href="/batch">
             <Button
                variant={pathname === "/batch" ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
             >
                <Layers className="h-4 w-4" />
                批量生成
             </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ConfigDialog />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}