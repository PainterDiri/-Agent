import { Hash, RotateCcw, Volume2, VolumeX } from "lucide-react";

export default function TopBar({ muted, onToggleMuted, onReset, onOpenMagic, status }) {
  return (
    <header className="topbar">
      <div className="brand-mark" aria-hidden="true">福</div>
      <h1>西溪四福局</h1>
      <div className="topbar-spacer" />
      <span className="service-status">{status.model === "api" ? "智能对话" : "现场演示"}</span>
      <button className="icon-command" type="button" onClick={onOpenMagic} title="1089 好汉数字魔术">
        <Hash aria-hidden="true" />
        <span>数字魔术</span>
      </button>
      <button className="icon-command" type="button" onClick={onReset} title="重新开始">
        <RotateCcw aria-hidden="true" />
        <span>重新开始</span>
      </button>
      <button className="icon-command" type="button" onClick={onToggleMuted} title={muted ? "打开声音" : "关闭声音"}>
        {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
        <span>{muted ? "声音关闭" : "声音开启"}</span>
      </button>
      <span className="folk-label">民俗娱乐体验</span>
    </header>
  );
}
