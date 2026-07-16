import { useCallback, useEffect, useRef, useState } from "react";

export function useVoiceInput({ mode, onText, onError }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => () => {
    recognitionRef.current?.abort?.();
    recorderRef.current?.stop?.();
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
  }, []);

  const startBrowserRecognition = useCallback(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      onError("当前浏览器不支持语音听写，请使用 Edge 或 Chrome，或配置语音识别 API。");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => onError(`没有听清：${event.error}`);
    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript?.trim();
      if (text) onText(text);
    };
    recognitionRef.current = recognition;
    recognition.start();
  }, [onError, onText]);

  const startApiRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        setListening(false);
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const form = new FormData();
        form.append("audio", blob, "speech.webm");
        try {
          const response = await fetch("/api/transcribe", { method: "POST", body: form });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "语音识别失败");
          if (data.text?.trim()) onText(data.text.trim());
        } catch (error) {
          onError(error.message);
        }
      };
      recorder.start();
      setListening(true);
    } catch (error) {
      onError(`无法使用麦克风：${error.message}`);
    }
  }, [onError, onText]);

  const toggle = useCallback(() => {
    if (listening) {
      if (mode === "api") recorderRef.current?.stop();
      else recognitionRef.current?.stop?.();
      return;
    }
    if (mode === "api") startApiRecording();
    else startBrowserRecognition();
  }, [listening, mode, startApiRecording, startBrowserRecognition]);

  return { listening, toggle };
}

export function useSpeechOutput({ mode, muted }) {
  const audioRef = useRef(null);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const speak = useCallback(async (text) => {
    if (muted || !text) return;
    stop();

    if (mode === "api") {
      try {
        const response = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!response.ok) throw new Error("API speech failed");
        const url = URL.createObjectURL(await response.blob());
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
        return;
      } catch {
        // Fall through to the browser voice.
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.9;
    utterance.pitch = 0.94;
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const chineseVoice = voices.find((voice) => /^zh/i.test(voice.lang));
    if (chineseVoice) utterance.voice = chineseVoice;
    window.speechSynthesis?.speak(utterance);
  }, [mode, muted, stop]);

  useEffect(() => stop, [stop]);
  return { speak, stop };
}
