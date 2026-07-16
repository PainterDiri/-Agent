import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const DEFAULT_ASR_SUBMIT = "https://openspeech.bytedance.com/api/v1/vc/submit";
const DEFAULT_ASR_QUERY = "https://openspeech.bytedance.com/api/v1/vc/query";
const DEFAULT_TTS_ENDPOINT = "https://openspeech.bytedance.com/api/v3/tts/unidirectional";

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function parseJsonText(text, context) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${context} 返回了无法解析的内容：${text.slice(0, 300)}`);
  }
}

function extractError(payload) {
  if (!payload || typeof payload !== "object") return "";
  return payload.message || payload.error || payload.msg || payload.code || "";
}

function extractTranscript(payload) {
  const result = payload?.result ?? payload;
  if (typeof result?.text === "string" && result.text.trim()) return result.text.trim();
  if (typeof payload?.text === "string" && payload.text.trim()) return payload.text.trim();
  const utterances = result?.utterances ?? payload?.utterances;
  if (Array.isArray(utterances)) {
    return utterances.map((item) => item?.text).filter(Boolean).join("").trim();
  }
  return "";
}

function buildAsrHeaders(config, contentType) {
  const headers = { Accept: "*/*" };
  if (contentType) headers["Content-Type"] = contentType;
  if (config.volcengineAsrApiKey) headers["x-api-key"] = config.volcengineAsrApiKey;
  else if (config.volcengineAccessToken) headers.Authorization = `Bearer;${config.volcengineAccessToken}`;
  return headers;
}

async function convertToMp3(file) {
  if (!ffmpegPath) throw new Error("找不到内置 FFmpeg，无法转换浏览器录音");
  const directory = await mkdtemp(path.join(tmpdir(), "xixi-asr-"));
  const inputPath = path.join(directory, "input.webm");
  const outputPath = path.join(directory, "speech.mp3");
  await writeFile(inputPath, file.buffer);

  try {
    await new Promise((resolve, reject) => {
      const process = spawn(ffmpegPath, [
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-i", inputPath,
        "-ac", "1",
        "-ar", "16000",
        "-b:a", "64k",
        outputPath,
      ], { windowsHide: true });
      let errorOutput = "";
      process.stderr.on("data", (chunk) => { errorOutput += chunk.toString(); });
      process.on("error", reject);
      process.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`音频转换失败：${errorOutput.slice(0, 500)}`));
      });
    });
    return await readFile(outputPath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function transcribeVolcengineRecording({ config, file }) {
  const audioBuffer = await convertToMp3(file);
  const submitUrl = new URL(config.volcengineAsrSubmitEndpoint || DEFAULT_ASR_SUBMIT);
  if (config.volcengineAppId) submitUrl.searchParams.set("appid", config.volcengineAppId);
  submitUrl.searchParams.set("language", "zh-CN");
  submitUrl.searchParams.set("use_itn", "True");
  submitUrl.searchParams.set("use_punc", "True");
  submitUrl.searchParams.set("use_capitalize", "True");
  submitUrl.searchParams.set("max_lines", "1");
  submitUrl.searchParams.set("words_per_line", "30");

  const submitResponse = await fetch(submitUrl, {
    method: "POST",
    headers: buildAsrHeaders(config, "audio/mpeg"),
    body: audioBuffer,
  });
  const submitText = await submitResponse.text();
  const submitPayload = parseJsonText(submitText, "火山 ASR 提交");
  if (!submitResponse.ok || (submitPayload.code !== undefined && Number(submitPayload.code) !== 0)) {
    throw new Error(`火山 ASR 提交失败 (${submitResponse.status})：${extractError(submitPayload) || submitText.slice(0, 300)}`);
  }

  const taskId = submitPayload.id ?? submitPayload.data?.id;
  if (!taskId) throw new Error("火山 ASR 提交成功，但响应中没有任务 id");

  const queryUrl = new URL(config.volcengineAsrQueryEndpoint || DEFAULT_ASR_QUERY);
  if (config.volcengineAppId) queryUrl.searchParams.set("appid", config.volcengineAppId);
  queryUrl.searchParams.set("id", taskId);

  const deadline = Date.now() + config.audioTimeoutMs;
  while (Date.now() < deadline) {
    await sleep(config.volcengineAsrPollMs);
    const queryResponse = await fetch(queryUrl, { headers: buildAsrHeaders(config) });
    const queryText = await queryResponse.text();
    const payload = parseJsonText(queryText, "火山 ASR 查询");
    const code = Number(payload.code ?? 0);
    if (code === 2000 || /processing|running|处理中/i.test(String(payload.message ?? ""))) continue;
    if (!queryResponse.ok || code !== 0) {
      throw new Error(`火山 ASR 查询失败 (${queryResponse.status})：${extractError(payload) || queryText.slice(0, 300)}`);
    }
    const text = extractTranscript(payload);
    if (text) return text;
    throw new Error("火山 ASR 已完成，但没有返回识别文本");
  }
  throw new Error("火山 ASR 识别超时，请缩短单次说话时间或检查服务状态");
}

export async function synthesizeVolcengineSpeech({ config, text }) {
  const response = await fetch(config.volcengineTtsEndpoint || DEFAULT_TTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-App-Id": config.volcengineAppId,
      "X-Api-Access-Key": config.volcengineTtsApiKey,
      "X-Api-Resource-Id": config.volcengineTtsResourceId,
    },
    body: JSON.stringify({
      user: { uid: `xixi-${Date.now()}` },
      req_params: {
        text,
        speaker: config.volcengineTtsVoiceType,
        model: "seed-tts-2.0-standard",
        audio_params: {
          format: "mp3",
          sample_rate: 24000,
          speech_rate: config.volcengineTtsSpeechRate,
          loudness_rate: config.volcengineTtsLoudnessRate,
        },
        additions: JSON.stringify({
          explicit_language: "zh",
          enable_language_detector: "true",
          disable_markdown_filter: true,
        }),
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`火山 TTS 请求失败 (${response.status})：${detail.slice(0, 500)}`);
  }

  const responseText = await response.text();
  const audioChunks = [];
  for (const line of responseText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const payload = parseJsonText(line, "火山 TTS");
    if (Number(payload.code ?? 0) > 0 && Number(payload.code) !== 20000000) {
      throw new Error(`火山 TTS 合成失败：${extractError(payload) || line.slice(0, 300)}`);
    }
    if (payload.data) audioChunks.push(Buffer.from(payload.data, "base64"));
  }
  if (!audioChunks.length) throw new Error("火山 TTS 没有返回音频数据");
  return { contentType: "audio/mpeg", buffer: Buffer.concat(audioChunks) };
}

