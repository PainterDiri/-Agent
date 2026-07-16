import "dotenv/config";
import { buildSystemPrompt } from "../server/prompt.mjs";
import { callChatModel } from "../server/providers.mjs";

const config = {
  llmBaseUrl: process.env.LLM_BASE_URL || "",
  llmApiKey: process.env.LLM_API_KEY || "",
  llmModel: process.env.LLM_MODEL || "",
  llmFallbackModels: (process.env.LLM_FALLBACK_MODELS || "deepseek-v4-pro,deepseek-chat")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean),
  llmChatPath: process.env.LLM_CHAT_PATH || "/chat/completions",
  llmTemperature: Number(process.env.LLM_TEMPERATURE || 0.75),
  llmMaxTokens: Number(process.env.LLM_MAX_TOKENS || 900),
  llmTimeoutMs: Number(process.env.LLM_TIMEOUT_MS || 30000),
};

const missing = ["llmBaseUrl", "llmApiKey", "llmModel"].filter((key) => !config[key]);
if (missing.length) {
  console.error(`缺少 LLM 配置：${missing.join("、")}`);
  process.exit(1);
}

const messages = [{ role: "user", content: "我为全家求个安稳，也喜欢能戴着拍照的纪念品。" }];
try {
  const result = await callChatModel({ config, messages, systemPrompt: buildSystemPrompt(messages) });
  console.log(`DeepSeek 调用成功，实际模型：${result.model}`);
  console.log(`阶段：${result.data.stage}；回复长度：${result.data.reply?.length || 0}；JSON：有效`);
} catch (error) {
  console.error(`DeepSeek 测试失败：${error.message}`);
  process.exit(1);
}
