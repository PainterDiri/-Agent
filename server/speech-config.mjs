export function resolveVolcengineSpeechConfig(env = process.env) {
  const volcengineAsrApiKey = env.VOLCENGINE_ASR_API_KEY || "";
  const volcengineAccessToken = env.VOLCENGINE_ACCESS_TOKEN || "";
  const volcengineTtsApiKey = env.VOLCENGINE_TTS_API_KEY || env.VOLCENGINE_API_KEY || "";
  const volcengineAppId = env.VOLCENGINE_APP_ID || "";
  const volcengineTtsVoiceType = env.VOLCENGINE_TTS_VOICE_TYPE || "zh_male_zhuangzhou_uranus_bigtts";

  return {
    volcengineAppId,
    volcengineAsrApiKey,
    volcengineAccessToken,
    volcengineTtsApiKey,
    volcengineTtsVoiceType,
    hasVolcengineStt: env.STT_PROVIDER === "volcengine-recording-v1" && Boolean(
      (volcengineAsrApiKey || volcengineAccessToken) && (volcengineAppId || volcengineAsrApiKey),
    ),
    hasVolcengineTts: env.TTS_PROVIDER === "volcengine-tts-v2" && Boolean(
      volcengineTtsApiKey && volcengineTtsVoiceType,
    ),
  };
}
