import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveVolcengineSpeechConfig } from "./speech-config.mjs";

test("TTS API key is never reused for recording recognition", () => {
  const config = resolveVolcengineSpeechConfig({
    STT_PROVIDER: "volcengine-recording-v1",
    TTS_PROVIDER: "volcengine-tts-v2",
    VOLCENGINE_APP_ID: "app-1",
    VOLCENGINE_API_KEY: "tts-only-key",
  });

  assert.equal(config.volcengineAsrApiKey, "");
  assert.equal(config.hasVolcengineStt, false);
  assert.equal(config.hasVolcengineTts, true);
});

test("recording recognition enables only with a dedicated ASR credential", () => {
  const config = resolveVolcengineSpeechConfig({
    STT_PROVIDER: "volcengine-recording-v1",
    VOLCENGINE_APP_ID: "app-1",
    VOLCENGINE_API_KEY: "tts-key",
    VOLCENGINE_ASR_API_KEY: "asr-key",
  });

  assert.equal(config.volcengineAsrApiKey, "asr-key");
  assert.equal(config.hasVolcengineStt, true);
});
