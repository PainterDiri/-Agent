import { Keyboard, LoaderCircle, Mic, Send, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ConversationStage({
  messages,
  quickReplies,
  loading,
  listening,
  onMic,
  onSend,
  onReplay,
  error,
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const submit = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || loading) return;
    setDraft("");
    onSend(text);
  };

  return (
    <main className="conversation-stage">
      <div className="fortune-heading">
        <div className="fortune-avatar" aria-hidden="true">福</div>
        <div>
          <h2>四福先生在此</h2>
          <p>听三句心里话，为你点一件今日福物。</p>
        </div>
      </div>

      <div className="conversation-log" ref={scrollRef} aria-live="polite">
        {messages.map((message, index) => (
          <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
            <span className="message-role">{message.role === "assistant" ? "先生" : "客官"}</span>
            <p>{message.content}</p>
          </div>
        ))}
        {loading && (
          <div className="thinking-line">
            <LoaderCircle className="spin" aria-hidden="true" />
            正在点福物
          </div>
        )}
      </div>

      {quickReplies.length > 0 && !loading && (
        <div className="quick-replies" aria-label="快捷回答">
          {quickReplies.map((reply) => (
            <button type="button" key={reply} onClick={() => onSend(reply)}>{reply}</button>
          ))}
        </div>
      )}

      {error && <p className="inline-error">{error}</p>}

      <div className="voice-dock">
        <button className="small-tool" type="button" onClick={() => document.getElementById("text-answer")?.focus()} title="键盘输入">
          <Keyboard aria-hidden="true" />
          <span>键盘输入</span>
        </button>
        <button
          className={`mic-button ${listening ? "is-listening" : ""}`}
          type="button"
          onClick={onMic}
          aria-pressed={listening}
        >
          <Mic aria-hidden="true" />
        </button>
        <button className="small-tool" type="button" onClick={onReplay} title="重听先生的话">
          <Volume2 aria-hidden="true" />
          <span>重听语音</span>
        </button>
        <span className="mic-label">{listening ? "正在听，请说话" : "点一下说话"}</span>
      </div>

      <form className="text-entry" onSubmit={submit}>
        <label className="sr-only" htmlFor="text-answer">输入回答</label>
        <input
          id="text-answer"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="也可以在这里输入一句话"
          maxLength={300}
        />
        <button type="submit" disabled={!draft.trim() || loading} title="发送">
          <Send aria-hidden="true" />
        </button>
      </form>
    </main>
  );
}
