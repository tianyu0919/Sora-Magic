import { Sparkles } from "lucide-react";
import { ConfigDialog } from "./ConfigDialog";
import { ModeToggle } from "./ModeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Sora Magic
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ConfigDialog />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}