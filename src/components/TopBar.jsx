import { RotateCcw, Volume2, VolumeX } from "lucide-react";

export default function TopBar({ muted, onToggleMuted, onReset, status }) {
  const online = status.model === "api";
  const modelLabel = online
    ? status.modelName === "deepseek-v4-flash" ? "DeepSeek V4 在线" : `${status.modelName || "DeepSeek"} 在线`
    : "本地规则接待";

  return (
    <header className="topbar">
      <div className="brand-mark" aria-hidden="true">福</div>
      <h1>西溪四福局</h1>
      <div className="topbar-spacer" />
      <span className={`service-status ${online ? "is-online" : ""}`}>
        <i aria-hidden="true" />
        {modelLabel}
      </span>
      <button className="icon-command" type="button" onClick={onReset} title="重新开始">
        <RotateCcw aria-hidden="true" />
        <span>重新开始</span>
      </button>
      <button className="icon-command" type="button" onClick={onToggleMuted} title={muted ? "打开声音" : "关闭声音"}>
        {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
        <span>{muted ? "声音关闭" : "声音开启"}</span>
      </button>
    </header>
  );
}
