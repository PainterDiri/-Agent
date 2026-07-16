import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import multer from "multer";
import { buildRecommendation } from "./catalog.mjs";
import { runMockAgent } from "./mock-agent.mjs";
import { SYSTEM_PROMPT } from "./prompt.mjs";
import { callChatModel, synthesizeSpeech, transcribeAudio } from "./providers.mjs";
import { synthesizeVolcengineSpeech, transcribeVolcengineRecording } from "./volcengine-speech.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const app = express();
const upload = multer({ limits: { fileSize: 12 * 1024 * 1024 } });

const config = {
  port: Number(process.env.PORT || 8787),
  mockMode: /^(1|true|yes|on)$/i.test(process.env.MOCK_MODE || "true"),
  llmBaseUrl: process.env.LLM_BASE_URL || "",
  llmApiKey: process.env.LLM_API_KEY || "",
  llmModel: process.env.LLM_MODEL || "",
  llmChatPath: process.env.LLM_CHAT_PATH || "/chat/completions",
  llmTemperature: Number(process.env.LLM_TEMPERATURE || 0.75),
  llmTimeoutMs: Number(process.env.LLM_TIMEOUT_MS || 30000),
  sttProvider: process.env.STT_PROVIDER || "browser",
  sttBaseUrl: process.env.STT_BASE_URL || process.env.LLM_BASE_URL || "",
  sttApiKey: process.env.STT_API_KEY || process.env.LLM_API_KEY || "",
  sttModel: process.env.STT_MODEL || "whisper-1",
  sttPath: process.env.STT_PATH || "/audio/transcriptions",
  ttsProvider: process.env.TTS_PROVIDER || "browser",
  ttsBaseUrl: process.env.TTS_BASE_URL || process.env.LLM_BASE_URL || "",
  ttsApiKey: process.env.TTS_API_KEY || process.env.LLM_API_KEY || "",
  ttsModel: process.env.TTS_MODEL || "gpt-4o-mini-tts",
  ttsVoice: process.env.TTS_VOICE || "alloy",
  ttsPath: process.env.TTS_PATH || "/audio/speech",
  audioTimeoutMs: Number(process.env.AUDIO_TIMEOUT_MS || 45000),
  volcengineAppId: process.env.VOLCENGINE_APP_ID || "",
  volcengineAsrApiKey: process.env.VOLCENGINE_ASR_API_KEY || process.env.VOLCENGINE_API_KEY || "",
  volcengineTtsApiKey: process.env.VOLCENGINE_TTS_API_KEY || process.env.VOLCENGINE_API_KEY || "",
  volcengineAccessToken: process.env.VOLCENGINE_ACCESS_TOKEN || "",
  volcengineAsrSubmitEndpoint: process.env.VOLCENGINE_ASR_SUBMIT_ENDPOINT || "",
  volcengineAsrQueryEndpoint: process.env.VOLCENGINE_ASR_QUERY_ENDPOINT || "",
  volcengineAsrPollMs: Number(process.env.VOLCENGINE_ASR_POLL_MS || 1200),
  volcengineTtsEndpoint: process.env.VOLCENGINE_TTS_ENDPOINT || "",
  volcengineTtsResourceId: process.env.VOLCENGINE_TTS_RESOURCE_ID || "seed-tts-2.0",
  volcengineTtsVoiceType: process.env.VOLCENGINE_TTS_VOICE_TYPE || "zh_male_zhuangzhou_uranus_bigtts",
  volcengineTtsSpeechRate: Number(process.env.VOLCENGINE_TTS_SPEECH_RATE || -8),
  volcengineTtsLoudnessRate: Number(process.env.VOLCENGINE_TTS_LOUDNESS_RATE || 0),
};

const hasLlm = Boolean(config.llmBaseUrl && config.llmApiKey && config.llmModel);
const hasSttApi = config.sttProvider === "openai-compatible" && Boolean(config.sttBaseUrl && config.sttApiKey);
const hasTtsApi = config.ttsProvider === "openai-compatible" && Boolean(config.ttsBaseUrl && config.ttsApiKey);
const hasVolcengineStt = config.sttProvider === "volcengine-recording-v1" && Boolean(
  (config.volcengineAsrApiKey || config.volcengineAccessToken) && (config.volcengineAppId || config.volcengineAsrApiKey),
);
const hasVolcengineTts = config.ttsProvider === "volcengine-tts-v2" && Boolean(
  config.volcengineAppId && config.volcengineTtsApiKey && config.volcengineTtsVoiceType,
);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/status", (_request, response) => {
  response.json({
    model: !config.mockMode && hasLlm ? "api" : "mock",
    stt: hasVolcengineStt || hasSttApi ? "api" : "browser",
    tts: hasVolcengineTts || hasTtsApi ? "api" : "browser",
    speechProvider: hasVolcengineStt || hasVolcengineTts ? "volcengine" : hasSttApi || hasTtsApi ? "openai-compatible" : "browser",
    voice: hasVolcengineTts ? config.volcengineTtsVoiceType : undefined,
  });
});

app.post("/api/chat", async (request, response) => {
  const { messages = [], profile = {} } = request.body || {};
  const safeMessages = messages
    .filter((message) => ["user", "assistant"].includes(message.role) && typeof message.content === "string")
    .slice(-12)
    .map((message) => ({ role: message.role, content: message.content.slice(0, 600) }));

  try {
    let result;
    if (config.mockMode || !hasLlm) {
      result = runMockAgent(safeMessages, profile);
    } else {
      result = await callChatModel({ config, messages: safeMessages, systemPrompt: SYSTEM_PROMPT });
      if (result.recommendation) {
        const normalized = buildRecommendation(
          result.recommendation.characterId,
          result.recommendation.productType,
        );
        result.recommendation = {
          ...normalized,
          reason: result.recommendation.reason || normalized.reason,
        };
      }
    }

    response.json(result);
  } catch (error) {
    console.error(error);
    const fallback = runMockAgent(safeMessages, profile);
    response.status(200).json({ ...fallback, degraded: true, error: "模型暂时不可用，已切换本地规则。" });
  }
});

app.post("/api/transcribe", upload.single("audio"), async (request, response) => {
  if (!hasSttApi && !hasVolcengineStt) return response.status(409).json({ error: "当前使用浏览器语音识别" });
  if (!request.file) return response.status(400).json({ error: "没有收到音频文件" });

  try {
    const text = hasVolcengineStt
      ? await transcribeVolcengineRecording({ config, file: request.file })
      : await transcribeAudio({ config, file: request.file });
    response.json({ text });
  } catch (error) {
    console.error(error);
    response.status(502).json({ error: error.message });
  }
});

app.post("/api/speech", async (request, response) => {
  if (!hasTtsApi && !hasVolcengineTts) return response.status(409).json({ error: "当前使用浏览器语音合成" });
  const text = String(request.body?.text || "").slice(0, 500);
  if (!text) return response.status(400).json({ error: "没有需要朗读的文字" });

  try {
    const audio = hasVolcengineTts
      ? await synthesizeVolcengineSpeech({ config, text })
      : await synthesizeSpeech({ config, text });
    response.type(audio.contentType).send(audio.buffer);
  } catch (error) {
    console.error(error);
    response.status(502).json({ error: error.message });
  }
});

const distPath = path.join(appRoot, "dist");
app.use(express.static(distPath));
app.use((request, response, next) => {
  if (request.method !== "GET" || request.path.startsWith("/api/")) return next();
  return response.sendFile(path.join(distPath, "index.html"));
});

app.listen(config.port, () => {
  console.log(`西溪四福局服务已启动：http://localhost:${config.port}`);
  console.log(`文本模型：${!config.mockMode && hasLlm ? "API" : "本地演示"}；语音识别：${hasVolcengineStt ? "火山 1.0" : hasSttApi ? "API" : "浏览器"}；语音合成：${hasVolcengineTts ? "火山 2.0" : hasTtsApi ? "API" : "浏览器"}`);
});
