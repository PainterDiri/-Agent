import "dotenv/config";
import { synthesizeVolcengineSpeech, transcribeVolcengineRecording } from "../server/volcengine-speech.mjs";

const config = {
  volcengineAppId: process.env.VOLCENGINE_APP_ID || "",
  volcengineTtsApiKey: process.env.VOLCENGINE_TTS_API_KEY || process.env.VOLCENGINE_API_KEY || "",
  volcengineTtsEndpoint: process.env.VOLCENGINE_TTS_ENDPOINT || "",
  volcengineTtsResourceId: process.env.VOLCENGINE_TTS_RESOURCE_ID || "seed-tts-2.0",
  volcengineTtsVoiceType: process.env.VOLCENGINE_TTS_VOICE_TYPE || "zh_male_zhuangzhou_uranus_bigtts",
  volcengineTtsSpeechRate: Number(process.env.VOLCENGINE_TTS_SPEECH_RATE || -8),
  volcengineTtsLoudnessRate: Number(process.env.VOLCENGINE_TTS_LOUDNESS_RATE || 0),
  volcengineAsrApiKey: process.env.VOLCENGINE_ASR_API_KEY || "",
  volcengineAccessToken: process.env.VOLCENGINE_ACCESS_TOKEN || "",
  volcengineAsrSubmitEndpoint: process.env.VOLCENGINE_ASR_SUBMIT_ENDPOINT || "",
  volcengineAsrQueryEndpoint: process.env.VOLCENGINE_ASR_QUERY_ENDPOINT || "",
  volcengineAsrPollMs: Number(process.env.VOLCENGINE_ASR_POLL_MS || 1200),
  audioTimeoutMs: Number(process.env.AUDIO_TIMEOUT_MS || 45000),
};

const required = [
  ["VOLCENGINE_APP_ID", config.volcengineAppId],
  ["VOLCENGINE_API_KEY", config.volcengineTtsApiKey],
];
const missing = required.filter(([, value]) => !value).map(([key]) => key);
if (missing.length) {
  console.error(`缺少配置：${missing.join("、")}。请先运行“配置火山语音.cmd”。`);
  process.exit(1);
}

let failed = false;
let ttsAudio;

console.log("[1/2] 正在测试火山语音合成 2.0……");
try {
  const result = await synthesizeVolcengineSpeech({
    config,
    text: "客官请坐。今日想为自己、孩子、父母，还是全家问一份好彩头？",
  });
  ttsAudio = result.buffer;
  console.log(`TTS 成功：庄周 2.0，返回 ${(result.buffer.length / 1024).toFixed(1)} KB 音频。`);
} catch (error) {
  failed = true;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`TTS 测试失败：${message}`);
  if (/45000010|requested grant not found/i.test(message)) {
    console.error(`当前 API Key 没有 ${config.volcengineTtsResourceId} 资源授权，或 Resource ID 与控制台调用示例不一致。`);
    console.error("请复制语音合成 2.0 页面“API 接入/调用示例”中的 API Key 和 Resource ID，不要使用账号通用 Access Key。 ");
  } else if (/401|403|unauthorized|invalid.*api.?key/i.test(message)) {
    console.error("TTS 鉴权失败：请确认填写的是语音应用页面生成的 API Key。");
  } else {
    console.error("请确认语音合成 2.0 服务、庄周音色及 Resource ID 均已开通。");
  }
}

console.log("\n[2/2] 正在测试录音文件识别 1.0……");
if (!ttsAudio) {
  console.error("ASR 跳过：需要先由 TTS 生成一段测试音频。");
} else if (!config.volcengineAsrApiKey && !config.volcengineAccessToken) {
  console.log("ASR 使用浏览器中文听写：未配置录音文件识别 1.0 专用凭证，未复用 TTS Key。 ");
} else {
  try {
    const transcript = await transcribeVolcengineRecording({
      config,
      file: { buffer: ttsAudio, mimetype: "audio/mpeg", originalname: "tts-test.mp3" },
    });
    console.log(`ASR 成功：识别结果“${transcript}”`);
  } catch (error) {
    failed = true;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`ASR 测试失败：${message}`);
    if (/vc\.async\.default|requested resource not granted/i.test(message)) {
      console.error("当前 Key 已通过格式校验，但没有录音文件识别 1.0 的 vc.async.default 资源授权。");
      console.error("请在该服务的“API 接入/调用示例”中复制专用 API Key；如果页面只显示 Access Token，请填写 VOLCENGINE_ACCESS_TOKEN 并清空 VOLCENGINE_ASR_API_KEY。");
    } else if (/Invalid X-Api-Key|401|requested grant not found/i.test(message)) {
      console.error("请确认 ASR 使用的是录音文件识别 1.0 页面提供的 API Key 或 Access Token，而不是 TTS Key。");
    }
  }
}

console.log("\n凭证值未被打印，也不会上传 GitHub。");
if (failed) process.exit(1);
