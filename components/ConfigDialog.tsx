"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { Settings, Eye, EyeOff } from "lucide-react";

export function ConfigDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const configSetting = await db.settings.where({ key: "config" }).first();
        if (configSetting?.value) {
          setApiUrl(configSetting.value.apiUrl || "");
          setApiKey(configSetting.value.apiKey || "");
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      const existingConfig = await db.settings.where({ key: "config" }).first();

      await db.settings.put({
        id: existingConfig?.id,
        key: "config",
        value: {
          apiUrl,
          apiKey,
        },
      });

      toast.success("配置已保存");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("保存配置失败");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          配置生图密钥
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>配置设置</DialogTitle>
          <DialogDescription>
            请输入您的 API 地址和密钥。这些信息将保存在您的本地浏览器中。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="api-url" className="text-right">
              API 地址
            </Label>
            <Input
              id="api-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.example.com"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="api-key" className="text-right">
              API Key
            </Label>
            <div className="col-span-3 relative">
              <Input
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                type={showApiKey ? "text" : "password"}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>保存配置</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}