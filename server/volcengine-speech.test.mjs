import assert from "node:assert/strict";
import { test } from "node:test";
import { synthesizeVolcengineSpeech, transcribeVolcengineRecording } from "./volcengine-speech.mjs";

function createSilentWav() {
  const sampleRate = 16000;
  const samples = 1600;
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

test("Volcengine TTS 2.0 sends the selected voice and joins audio chunks", async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response([
      JSON.stringify({ code: 0, data: Buffer.from("first").toString("base64") }),
      JSON.stringify({ code: 0, data: Buffer.from("second").toString("base64") }),
      JSON.stringify({ code: 20000000, message: "done" }),
    ].join("\n"), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    const result = await synthesizeVolcengineSpeech({
      config: {
        volcengineAppId: "test-app",
        volcengineTtsApiKey: "test-key",
        volcengineTtsEndpoint: "https://example.test/tts",
        volcengineTtsResourceId: "seed-tts-2.0",
        volcengineTtsVoiceType: "zh_male_zhuangzhou_uranus_bigtts",
        volcengineTtsSpeechRate: -8,
        volcengineTtsLoudnessRate: 0,
      },
      text: "测试庄周音色",
    });

    assert.equal(result.contentType, "audio/mpeg");
    assert.equal(result.buffer.toString(), "firstsecond");
    assert.equal(calls.length, 1);
    const request = calls[0];
    assert.equal(request.options.headers["X-Api-App-Id"], "test-app");
    assert.equal(request.options.headers["X-Api-Access-Key"], "test-key");
    assert.equal(request.options.headers["X-Api-Resource-Id"], "seed-tts-2.0");
    const payload = JSON.parse(request.options.body);
    assert.equal(payload.req_params.speaker, "zh_male_zhuangzhou_uranus_bigtts");
    assert.equal(payload.req_params.audio_params.format, "mp3");
    assert.equal(payload.req_params.audio_params.speech_rate, -8);
  } finally {
    global.fetch = originalFetch;
  }
});

test("Volcengine recording recognition 1.0 converts audio, submits and polls", async () => {
  const originalFetch = global.fetch;
  const calls = [];
  let queryCount = 0;
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("/submit")) {
      assert.equal(options.method, "POST");
      assert.equal(options.headers["Content-Type"], "audio/mpeg");
      assert.equal(options.headers["x-api-key"], "asr-key");
      assert.ok(Buffer.isBuffer(options.body));
      assert.ok(options.body.length > 100);
      return Response.json({ id: "task-1", code: 0, message: "Success" });
    }
    queryCount += 1;
    if (queryCount === 1) return Response.json({ code: 2000, message: "processing" });
    return Response.json({ code: 0, result: { text: "西溪四福局" } });
  };

  try {
    const text = await transcribeVolcengineRecording({
      config: {
        volcengineAppId: "app-1",
        volcengineAsrApiKey: "asr-key",
        volcengineAccessToken: "",
        volcengineAsrSubmitEndpoint: "https://example.test/submit",
        volcengineAsrQueryEndpoint: "https://example.test/query",
        volcengineAsrPollMs: 1,
        audioTimeoutMs: 5000,
      },
      file: {
        buffer: createSilentWav(),
        mimetype: "audio/wav",
        originalname: "speech.wav",
      },
    });

    assert.equal(text, "西溪四福局");
    assert.equal(calls.length, 3);
    assert.match(calls[0].url, /appid=app-1/);
    assert.match(calls[0].url, /language=zh-CN/);
    assert.match(calls[1].url, /id=task-1/);
  } finally {
    global.fetch = originalFetch;
  }
});
