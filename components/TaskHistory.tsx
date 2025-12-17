"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Loader2, AlertCircle, FileVideo, ImageIcon, Clock, Download, CheckCircle2, Film } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function TaskHistory() {
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [isStitching, setIsStitching] = useState(false);

  const tasks = useLiveQuery(() =>
    db.tasks.orderBy("createdAt").reverse().limit(50).toArray()
  );

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("开始下载");
    } catch (error) {
      console.error('Download failed:', error);
      toast.error("下载失败，尝试在新窗口打开");
      window.open(url, '_blank');
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedTaskIds(prev =>
      prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
    );
  };

  const handleStitch = async () => {
    if (selectedTaskIds.length < 2) {
        toast.error("请至少选择两个视频进行拼接");
        return;
    }

    setIsStitching(true);
    try {
        const configSetting = await db.settings.where({ key: "config" }).first();
        const apiUrl = configSetting?.value?.apiUrl;
        const apiKey = configSetting?.value?.apiKey;

        if (!apiUrl || !apiKey) {
            toast.error("请先配置 API 地址和密钥");
            return;
        }

        const selectedTasks = tasks?.filter(t => t.id && selectedTaskIds.includes(t.id));
        const videoUrls = selectedTasks?.map(t => t.result).filter(Boolean) as string[];

        if (videoUrls.length < 2) {
             toast.error("选中的任务中包含无效的视频链接");
             return;
        }

        const response = await fetch("/api/stitch", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                config: { apiUrl, apiKey },
                videoUrls,
            }),
        });
        
        const data = await response.json();

        if (response.ok && data.success) {
            toast.success("拼接请求已发送");
            // Assuming the stitch API returns a result immediately or we handle it somehow.
            // If it returns a new video URL directly:
            if (data.result) {
                 await db.tasks.add({
                    prompt: `Stitch of ${selectedTaskIds.length} videos`,
                    model: "stitch-v1",
                    type: "video",
                    status: "success",
                    result: data.result,
                    createdAt: new Date(),
                 });
            }
            setSelectedTaskIds([]);
        } else {
            throw new Error(data.error || "Stitch failed");
        }

    } catch (error) {
        console.error("Stitch failed:", error);
        toast.error("拼接失败");
    } finally {
        setIsStitching(false);
    }
  };


  if (!tasks?.length) return null;

  return (
    <div className="w-full max-w-[1400px]">
      <div className="mb-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-700">生成历史</h2>
        </div>
        {selectedTaskIds.length > 0 && (
             <div className="flex items-center gap-4">
                 <span className="text-sm text-gray-500">已选择 {selectedTaskIds.length} 项</span>
                 <Button
                    size="sm"
                    onClick={handleStitch}
                    disabled={isStitching || selectedTaskIds.length < 2}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                 >
                    {isStitching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
                    拼接/Remix
                 </Button>
                 <Button variant="ghost" size="sm" onClick={() => setSelectedTaskIds([])}>取消</Button>
             </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
                "group relative flex flex-col overflow-hidden rounded-3xl bg-card border shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:shadow-none dark:hover:bg-card/80",
                selectedTaskIds.includes(task.id!)
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-border hover:border-primary/50"
            )}
            onClick={() => task.id && toggleSelection(task.id)}
          >
             {/* Header: Result Preview (Top) */}
             <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
               <div className="absolute right-3 top-10 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                        selectedTaskIds.includes(task.id!)
                            ? "bg-blue-500 border-blue-500"
                            : "bg-black/30 border-white"
                    )}>
                        {selectedTaskIds.includes(task.id!) && <CheckCircle2 className="h-4 w-4 text-white" />}
                    </div>
               </div>
               {task.status === 'pending' && (
                 <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
                   <Loader2 className="h-8 w-8 animate-spin" />
                   <span className="text-xs font-medium">AI 正在创作中...</span>
                 </div>
               )}
               
               {task.status === 'failed' && (
                 <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-destructive/10 p-4 text-center text-destructive">
                   <AlertCircle className="h-6 w-6" />
                   <span className="text-xs font-medium line-clamp-2">{task.result}</span>
                 </div>
               )}
               
               {task.status === 'success' && task.result && (
                 <Dialog>
                   <DialogTrigger asChild>
                     <div className="group/image relative h-full w-full cursor-pointer" onClick={(e) => e.stopPropagation()}>
                       {task.type === 'video' ? (
                         <video
                           src={task.result}
                           className="h-full w-full object-cover transition-transform duration-700 group-hover/image:scale-105"
                           controls={false}
                           muted
                           loop
                           playsInline
                           onMouseOver={(e) => e.currentTarget.play()}
                           onMouseOut={(e) => e.currentTarget.pause()}
                         />
                       ) : (
                         <img
                           src={task.result}
                           alt={task.prompt}
                           className="h-full w-full object-cover transition-transform duration-700 group-hover/image:scale-105"
                           loading="lazy"
                         />
                       )}
                       <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover/image:bg-black/20 group-hover/image:opacity-100">
                          <div className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-gray-900 shadow-xl backdrop-blur-md transition-transform duration-300 group-hover/image:scale-110">
                            查看详情
                          </div>
                       </div>
                     </div>
                   </DialogTrigger>
                   <DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none">
                    <DialogTitle className="sr-only">预览</DialogTitle>
                    <DialogDescription className="sr-only">{task.prompt}</DialogDescription>
                    <div className="relative flex items-center justify-center overflow-hidden rounded-lg bg-black/50 backdrop-blur-sm group/modal">
                      {task.type === 'video' ? (
                        <video
                          src={task.result}
                          className="max-h-[85vh] w-full rounded-lg shadow-2xl"
                          controls
                          autoPlay
                          loop
                        />
                      ) : (
                         <img
                           src={task.result}
                           alt={task.prompt}
                           className="max-h-[85vh] w-full rounded-lg object-contain shadow-2xl"
                         />
                      )}
                      <Button
                        className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover/modal:opacity-100"
                        onClick={() => handleDownload(
                          task.result!,
                          `sora-${task.id}-${task.type === 'video' ? 'video.mp4' : 'image.png'}`
                        )}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        下载{task.type === 'video' ? '视频' : '图片'}
                      </Button>
                    </div>
                 </DialogContent>
                 </Dialog>
               )}
               
               {/* Type Badge & Status */}
               <div className="absolute right-3 top-3 flex gap-2">
                 <div className={cn(
                   "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md shadow-sm",
                   task.type === 'video' ? "bg-blue-500/80" : "bg-orange-500/80"
                 )}>
                    {task.type === 'video' ? <FileVideo className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                    {task.type === 'video' ? 'VIDEO' : 'IMAGE'}
                 </div>
               </div>
             </div>
             
             {/* Body: Prompt and Meta (Bottom) */}
             <div className="flex flex-1 flex-col justify-between p-5">
               <div className="mb-4 space-y-2">
                 <p className="line-clamp-3 text-sm leading-relaxed text-foreground/80 transition-colors group-hover:text-foreground" title={task.prompt}>
                   {task.prompt}
                 </p>
                 <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                   <span>{new Date(task.createdAt).toLocaleString()}</span>
                 </div>
               </div>

               <div className="flex items-center justify-between border-t border-gray-50 pt-3 dark:border-gray-800">
                 <div className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-500 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">
                   {task.model}
                 </div>
                 {task.status === 'success' && task.result && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(
                          task.result!,
                          `sora-${task.id}-${task.type === 'video' ? 'video.mp4' : 'image.png'}`
                        );
                      }}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">下载</span>
                    </Button>
                 )}
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
