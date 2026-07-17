import { useCallback, useEffect, useState } from "react";
import ConversationStage from "./components/ConversationStage";
import RecommendationPanel from "./components/RecommendationPanel";
import TopBar from "./components/TopBar";
import { useSpeechOutput, useVoiceInput } from "./hooks/useVoice";

const openingMessage = "客官请坐。今日想为自己、孩子、父母，还是全家问一份好彩头？";
const openingReplies = ["为自己", "为孩子", "为父母或全家"];

export default function App() {
  const [status, setStatus] = useState({ model: "mock", modelName: "local-rules", stt: "browser", tts: "browser" });
  const [messages, setMessages] = useState([{ role: "assistant", content: openingMessage }]);
  const [quickReplies, setQuickReplies] = useState(openingReplies);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const { speak, stop } = useSpeechOutput({ mode: status.tts, muted });

  useEffect(() => {
    fetch("/api/status")
      .then((response) => response.json())
      .then(setStatus)
      .catch(() => setStatus({ model: "mock", modelName: "local-rules", stt: "browser", tts: "browser" }));
  }, []);

  const reset = useCallback(() => {
    stop();
    setMessages([{ role: "assistant", content: openingMessage }]);
    setQuickReplies(openingReplies);
    setRecommendation(null);
    setError("");
  }, [stop]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    const userMessage = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);
    setError("");
    setQuickReplies([]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "先生暂时没有听清");
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
      setQuickReplies(data.quickReplies || []);
      if (data.recommendation) setRecommendation(data.recommendation);
      if (data.modelUsed) {
        setStatus((current) => ({
          ...current,
          model: data.degraded ? "mock" : "api",
          modelName: data.modelUsed,
        }));
      }
      // A local response can bridge an occasional empty model response without interrupting the visitor.
      if (!data.degraded) setError("");
      speak(data.reply);
    } catch (requestError) {
      setError(requestError.message);
      setQuickReplies(["再说一次", "重新开始"]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, speak]);

  const handleVoiceText = useCallback((text) => sendMessage(text), [sendMessage]);
  const handleVoiceError = useCallback((message) => setError(message), []);
  const { listening, toggle } = useVoiceInput({ mode: status.stt, onText: handleVoiceText, onError: handleVoiceError });
  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant")?.content;

  return (
    <div className="app-shell">
      <TopBar
        muted={muted}
        onToggleMuted={() => setMuted((value) => !value)}
        onReset={reset}
        status={status}
      />
      <ConversationStage
        messages={messages}
        quickReplies={quickReplies}
        loading={loading}
        listening={listening}
        onMic={toggle}
        onSend={(text) => text === "重新开始" ? reset() : sendMessage(text)}
        onReplay={() => speak(lastAssistant)}
        error={error}
      />
      <RecommendationPanel recommendation={recommendation} />
    </div>
  );
}
