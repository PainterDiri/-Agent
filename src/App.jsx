import { useCallback, useEffect, useMemo, useState } from "react";
import CharacterRail from "./components/CharacterRail";
import ConversationStage from "./components/ConversationStage";
import MagicPanel from "./components/MagicPanel";
import RecommendationPanel from "./components/RecommendationPanel";
import TopBar from "./components/TopBar";
import { characterMap, characters } from "./data/characters";
import { useSpeechOutput, useVoiceInput } from "./hooks/useVoice";

const openingMessage = "客官请坐。今天想为自己、孩子、父母，还是全家问一份好彩头？";
const openingReplies = ["为自己", "为孩子", "为父母或全家"];

export default function App() {
  const [status, setStatus] = useState({ model: "mock", stt: "browser", tts: "browser" });
  const [messages, setMessages] = useState([{ role: "assistant", content: openingMessage }]);
  const [quickReplies, setQuickReplies] = useState(openingReplies);
  const [recommendation, setRecommendation] = useState(null);
  const [activeId, setActiveId] = useState("zhangshun");
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [magicOpen, setMagicOpen] = useState(false);
  const { speak, stop } = useSpeechOutput({ mode: status.tts, muted });

  useEffect(() => {
    fetch("/api/status")
      .then((response) => response.json())
      .then(setStatus)
      .catch(() => setStatus({ model: "mock", stt: "browser", tts: "browser" }));
  }, []);

  const reset = useCallback(() => {
    stop();
    setMessages([{ role: "assistant", content: openingMessage }]);
    setQuickReplies(openingReplies);
    setRecommendation(null);
    setActiveId("zhangshun");
    setProfile({});
    setError("");
    setMagicOpen(false);
  }, [stop]);

  const sendMessage = useCallback(async (text, profilePatch = {}) => {
    if (!text.trim() || loading) return;
    const updatedProfile = { ...profile, ...profilePatch };
    const userMessage = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setProfile(updatedProfile);
    setLoading(true);
    setError("");
    setQuickReplies([]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, profile: updatedProfile }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "先生暂时没有听清");
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
      setQuickReplies(data.quickReplies || []);
      if (data.recommendation) {
        setRecommendation(data.recommendation);
        setActiveId(data.recommendation.characterId);
      }
      if (data.degraded) setError(data.error);
      speak(data.reply);
    } catch (requestError) {
      setError(requestError.message);
      setQuickReplies(["再说一次", "重新开始"]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, profile, speak]);

  const handleVoiceText = useCallback((text) => sendMessage(text), [sendMessage]);
  const handleVoiceError = useCallback((message) => setError(message), []);
  const { listening, toggle } = useVoiceInput({ mode: status.stt, onText: handleVoiceText, onError: handleVoiceError });

  const activeCharacter = useMemo(() => characterMap[activeId] || characters[0], [activeId]);
  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant")?.content;

  const selectCharacter = (character) => {
    setActiveId(character.id);
    sendMessage(`我对${character.name}的“${character.blessing}”最有感觉。`, { selectedCharacterId: character.id });
  };

  return (
    <div className="app-shell">
      <TopBar
        muted={muted}
        onToggleMuted={() => setMuted((value) => !value)}
        onReset={reset}
        onOpenMagic={() => setMagicOpen(true)}
        status={status}
      />
      <CharacterRail activeId={activeId} onSelect={selectCharacter} />
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
      <RecommendationPanel recommendation={recommendation} activeCharacter={activeCharacter} />
      <MagicPanel
        open={magicOpen}
        onClose={() => setMagicOpen(false)}
        onComplete={(characterId, text) => sendMessage(text, { magicCharacterId: characterId })}
      />
    </div>
  );
}
