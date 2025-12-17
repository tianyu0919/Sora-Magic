"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings2, ArrowUp, Image as ImageIcon, Video, Wand2, Check } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

interface ModelOption {
  value: string;
  label: string;
  type: "image" | "video";
  description: string;
  tags: string[];
}

const MODELS: ModelOption[] = [
  // Image Models
  {
    value: "sora-image",
    label: "Sora Image Square",
    type: "image",
    description: "生成 1:1 方形图像，适合社交媒体头像或展示。",
    tags: ["360x360", "Fast"],
  },
  {
    value: "sora-image-landscape",
    label: "Sora Image Landscape",
    type: "image",
    description: "生成 16:9 宽屏图像，适合桌面壁纸或视频封面。",
    tags: ["540x360", "Landscape"],
  },
  {
    value: "sora-image-portrait",
    label: "Sora Image Portrait",
    type: "image",
    description: "生成 9:16 竖屏图像，适合手机壁纸或 Stories。",
    tags: ["360x540", "Portrait"],
  },
  // Video Models
  {
    value: "sora-video-10s",
    label: "Sora Video 10s",
    type: "video",
    description: "生成 10 秒标准视频，平衡质量与生成速度。",
    tags: ["10s", "Standard"],
  },
  {
    value: "sora-video-15s",
    label: "Sora Video 15s",
    type: "video",
    description: "生成 15 秒长视频，展现更多细节和动态。",
    tags: ["15s", "Extended"],
  },
  {
    value: "sora-video-landscape-10s",
    label: "Sora Video Landscape 10s",
    type: "video",
    description: "生成 10 秒宽屏视频，适合电影感画面。",
    tags: ["10s", "Landscape"],
  },
  {
    value: "sora-video-landscape-15s",
    label: "Sora Video Landscape 15s",
    type: "video",
    description: "生成 15 秒宽屏视频，沉浸式视觉体验。",
    tags: ["15s", "Landscape"],
  },
  {
    value: "sora-video-portrait-10s",
    label: "Sora Video Portrait 10s",
    type: "video",
    description: "生成 10 秒竖屏视频，专为短视频平台打造。",
    tags: ["10s", "Portrait"],
  },
  {
    value: "sora-video-portrait-15s",
    label: "Sora Video Portrait 15s",
    type: "video",
    description: "生成 15 秒竖屏视频，完整的短视频叙事。",
    tags: ["15s", "Portrait"],
  },
];

export function BatchPromptInput() {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].value);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [batchCount, setBatchCount] = useState("1");

  const selectedModelData = MODELS.find((m) => m.value === selectedModel) || MODELS[0];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("请输入提示词");
      return;
    }

    setIsLoading(true);
    const count = parseInt(batchCount);
    const taskIds: number[] = [];

    try {
      const configSetting = await db.settings.where({ key: "config" }).first();
      const apiUrl = configSetting?.value?.apiUrl;
      const apiKey = configSetting?.value?.apiKey;

      if (!apiUrl || !apiKey) {
        toast.error("请先在右上角配置 API 地址和密钥");
        return;
      }

      const currentModelInfo = MODELS.find((m) => m.value === selectedModel);

      // Create pending tasks
      for (let i = 0; i < count; i++) {
        const id = await db.tasks.add({
          prompt,
          model: selectedModel,
          type: currentModelInfo?.type || "image",
          status: "pending",
          createdAt: new Date(),
        });
        taskIds.push(id as number);
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: { apiUrl, apiKey },
          globalModel: selectedModel,
          tasks: taskIds.map(() => ({ prompt, model: selectedModel })),
        }),
      });

      if (!response.ok) throw new Error("BFF request failed");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.includes("[DONE]")) break;
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              const { taskId: taskIndex, status, result, error } = data;
              
              const actualTaskId = taskIds[taskIndex];
              if (actualTaskId) {
                if (status === 'success') {
                    await db.tasks.update(actualTaskId, {
                        status: "success",
                        result: result,
                    });
                } else if (status === 'failed') {
                    await db.tasks.update(actualTaskId, {
                        status: "failed",
                        result: error,
                    });
                }
                // We could also handle 'processing' status to show partial updates if DB supports it
              }
            } catch (e) {
              console.error("Error parsing stream chunk", e);
            }
          }
        }
      }

      toast.success("任务提交成功！");
      setPrompt("");
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("生成失败，请检查配置或网络");
      // Update all tasks to failed if the batch request itself fails
      for (const id of taskIds) {
        await db.tasks.update(id, {
          status: "failed",
          result: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl rounded-3xl border bg-background/80 dark:bg-card/30 backdrop-blur-xl p-4 shadow-2xl dark:border-white/10">
      <Textarea
        placeholder="输入你的生图提示词..."
        className="min-h-[120px] resize-none border-0 text-lg focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="h-10 border-0 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
              >
                <Settings2 className="mr-2 h-4 w-4" />
                <span className="max-w-[120px] truncate">{selectedModelData.label}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>选择模型</DialogTitle>
                <DialogDescription>
                  选择最适合您创作需求的 AI 模型。
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue={selectedModelData.type} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="image" className="gap-2">
                    <ImageIcon className="h-4 w-4" /> 图像生成 (Image)
                  </TabsTrigger>
                  <TabsTrigger value="video" className="gap-2">
                    <Video className="h-4 w-4" /> 视频生成 (Video)
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="image" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {MODELS.filter((m) => m.type === "image").map((model) => (
                      <div
                        key={model.value}
                        className={cn(
                          "cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-orange-950/20",
                          selectedModel === model.value
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-500"
                            : "border-border bg-card hover:border-primary/50"
                        )}
                        onClick={() => {
                          setSelectedModel(model.value);
                          setIsModelDialogOpen(false);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="font-semibold">{model.label}</div>
                          {selectedModel === model.value && (
                            <div className="rounded-full bg-orange-500 p-1 text-white">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          {model.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {model.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="bg-white/50 text-[10px] text-gray-600"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="video" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {MODELS.filter((m) => m.type === "video").map((model) => (
                      <div
                        key={model.value}
                        className={cn(
                          "cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
                          selectedModel === model.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500"
                            : "border-border bg-card hover:border-blue-500/50"
                        )}
                        onClick={() => {
                          setSelectedModel(model.value);
                          setIsModelDialogOpen(false);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="font-semibold">{model.label}</div>
                          {selectedModel === model.value && (
                            <div className="rounded-full bg-blue-500 p-1 text-white">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          {model.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {model.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="bg-white/50 text-[10px] text-gray-600"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <Select defaultValue="9:16">
            <SelectTrigger className="w-[100px] border-0 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground dark:bg-white/5 dark:hover:bg-white/10 transition-colors focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="比例" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="9:16">9:16</SelectItem>
              <SelectItem value="16:9">16:9</SelectItem>
              <SelectItem value="1:1">1:1</SelectItem>
            </SelectContent>
          </Select>
          <Select value={batchCount} onValueChange={setBatchCount}>
            <SelectTrigger className="w-[100px] border-0 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground dark:bg-white/5 dark:hover:bg-white/10 transition-colors focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="数量" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">生成1条</SelectItem>
              <SelectItem value="2">生成2条</SelectItem>
              <SelectItem value="4">生成4条</SelectItem>
              <SelectItem value="5">生成5条</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
            <Wand2 className="h-4 w-4" />
          </Button>
        </div>
        <Button
          className="h-10 w-10 rounded-xl bg-orange-500 p-0 hover:bg-orange-600 dark:bg-primary dark:hover:bg-primary/90 transition-colors"
          onClick={handleGenerate}
          disabled={isLoading}
        >
          <ArrowUp className="h-5 w-5 text-white" />
        </Button>
      </div>
    </div>
  );
}