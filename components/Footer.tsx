import { Sparkles, AlertTriangle, Monitor, Wifi } from "lucide-react";

export function Footer() {
  return (
    <div className="mx-auto mt-16 grid max-w-5xl gap-6 rounded-2xl bg-orange-50 p-8 text-sm text-orange-800 md:grid-cols-2">
      <div className="flex gap-3">
        <Sparkles className="h-5 w-5 flex-shrink-0 text-orange-500" />
        <p>
          生成图片仅保存在本地浏览器，请及时【下载】保存，图片数据会占用电脑系统盘空间，如空间不足可清理生图数据，注：删除浏览器缓存可删除所有生图数据。
        </p>
      </div>
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-orange-500" />
        <p>生图时请不要【刷新】网页，会中断生图。</p>
      </div>
      <div className="flex gap-3">
        <Monitor className="h-5 w-5 flex-shrink-0 text-orange-500" />
        <p>
          生图失败请先排查提示内容是否含敏感内容，可能是模型审核。
        </p>
      </div>
      <div className="flex gap-3">
        <Wifi className="h-5 w-5 flex-shrink-0 text-orange-500" />
        <p>建议使用电脑联网生图，网络连接更稳定。</p>
      </div>
    </div>
  );
}