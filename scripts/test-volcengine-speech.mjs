import "dotenv/config";
import { synthesizeVolcengineSpeech } from "../server/volcengine-speech.mjs";

const config = {
  volcengineAppId: process.env.VOLCENGINE_APP_ID || "",
  volcengineTtsApiKey: process.env.VOLCENGINE_TTS_API_KEY || process.env.VOLCENGINE_API_KEY || "",
  volcengineTtsEndpoint: process.env.VOLCENGINE_TTS_ENDPOINT || "",
  volcengineTtsResourceId: process.env.VOLCENGINE_TTS_RESOURCE_ID || "seed-tts-2.0",
  volcengineTtsVoiceType: process.env.VOLCENGINE_TTS_VOICE_TYPE || "zh_male_zhuangzhou_uranus_bigtts",
  volcengineTtsSpeechRate: Number(process.env.VOLCENGINE_TTS_SPEECH_RATE || -8),
  volcengineTtsLoudnessRate: Number(process.env.VOLCENGINE_TTS_LOUDNESS_RATE || 0),
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

console.log("正在测试火山语音合成 2.0……");
try {
  const result = await synthesizeVolcengineSpeech({
    config,
    text: "客官请坐。今日想为自己、孩子、父母，还是全家问一份好彩头？",
  });
  console.log(`TTS 成功：庄周 2.0，返回 ${(result.buffer.length / 1024).toFixed(1)} KB 音频。`);
  console.log("ASR 需要一段真实麦克风录音，将在网页中首次点击麦克风时测试。");
} catch (error) {
  console.error(`TTS 测试失败：${error.message}`);
  console.error("请确认 App ID、API Key、语音合成 2.0 服务和庄周音色均已开通。密钥不要发到聊天中。 ");
  process.exit(1);
}

