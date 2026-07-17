import { Blob } from "node:buffer";

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseJsonObject(text) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("模型没有返回可解析的 JSON");
  }
}

export async function callChatModel({ config, messages, systemPrompt }) {
  const models = [...new Set([config.llmModel, ...(config.llmFallbackModels || [])].filter(Boolean))];
  const errors = [];

  for (const [index, model] of models.entries()) {
    const timeoutMs = index === 0 ? config.llmTimeoutMs : (config.llmFallbackTimeoutMs || config.llmTimeoutMs);
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await fetchWithTimeout(
          joinUrl(config.llmBaseUrl, config.llmChatPath),
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.llmApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              temperature: config.llmTemperature,
              max_tokens: config.llmMaxTokens,
              response_format: { type: "json_object" },
              messages: [{ role: "system", content: systemPrompt }, ...messages],
            }),
          },
          timeoutMs,
        );

        if (!response.ok) {
          const detail = await response.text();
          throw new Error(`请求失败 (${response.status}): ${detail.slice(0, 500)}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content?.trim()) {
          const reasoningTokens = data.usage?.completion_tokens_details?.reasoning_tokens;
          const finishReason = data.choices?.[0]?.finish_reason || "unknown";
          const emptyError = new Error(`响应正文为空${reasoningTokens ? `，已消耗 ${reasoningTokens} 个推理 token` : ""}，finish=${finishReason}`);
          emptyError.retryEmptyResponse = true;
          throw emptyError;
        }
        return { data: parseJsonObject(content), model };
      } catch (error) {
        errors.push(`${model}#${attempt}: ${error.name === "AbortError" ? "请求超时" : error.message}`);
        if (!error.retryEmptyResponse) break;
      }
    }
  }

  throw new Error(`文本模型全部失败：${errors.join("；")}`);
}

export async function transcribeAudio({ config, file }) {
  const form = new FormData();
  const blob = new Blob([file.buffer], { type: file.mimetype || "audio/webm" });
  form.append("file", blob, file.originalname || "speech.webm");
  form.append("model", config.sttModel);
  form.append("language", "zh");

  const response = await fetchWithTimeout(
    joinUrl(config.sttBaseUrl, config.sttPath),
    {
      method: "POST",
      headers: { Authorization: `Bearer ${config.sttApiKey}` },
      body: form,
    },
    config.audioTimeoutMs,
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`语音识别请求失败 (${response.status}): ${detail.slice(0, 500)}`);
  }

  const data = await response.json();
  return data.text ?? data.transcript ?? "";
}

export async function synthesizeSpeech({ config, text }) {
  const response = await fetchWithTimeout(
    joinUrl(config.ttsBaseUrl, config.ttsPath),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.ttsApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.ttsModel,
        voice: config.ttsVoice,
        input: text,
        response_format: "mp3",
      }),
    },
    config.audioTimeoutMs,
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`语音合成请求失败 (${response.status}): ${detail.slice(0, 500)}`);
  }

  return {
    contentType: response.headers.get("content-type") || "audio/mpeg",
    buffer: Buffer.from(await response.arrayBuffer()),
  };
}
