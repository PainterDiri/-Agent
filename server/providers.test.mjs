import assert from "node:assert/strict";
import { test } from "node:test";
import { callChatModel } from "./providers.mjs";

const config = {
  llmBaseUrl: "https://example.test",
  llmApiKey: "test-key",
  llmModel: "reasoning-model",
  llmFallbackModels: ["chat-model"],
  llmChatPath: "/chat/completions",
  llmTemperature: 0.6,
  llmMaxTokens: 900,
  llmTimeoutMs: 5000,
};

test("chat provider requests JSON output and returns the used model", async () => {
  const originalFetch = global.fetch;
  let requestBody;
  global.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return Response.json({ choices: [{ message: { content: '{"reply":"吉","stage":"fortune","quickReplies":[],"recommendation":null}' } }] });
  };

  try {
    const result = await callChatModel({ config, messages: [], systemPrompt: "test" });
    assert.equal(result.model, "reasoning-model");
    assert.equal(result.data.reply, "吉");
    assert.deepEqual(requestBody.response_format, { type: "json_object" });
    assert.equal(requestBody.max_tokens, 900);
  } finally {
    global.fetch = originalFetch;
  }
});

test("chat provider falls back when reasoning model returns empty content", async () => {
  const originalFetch = global.fetch;
  const requestedModels = [];
  global.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    requestedModels.push(body.model);
    if (body.model === "reasoning-model") {
      return Response.json({
        choices: [{ message: { content: "", reasoning_content: "thinking" } }],
        usage: { completion_tokens_details: { reasoning_tokens: 900 } },
      });
    }
    return Response.json({ choices: [{ message: { content: '{"reply":"稳","stage":"fortune","quickReplies":[],"recommendation":null}' } }] });
  };

  try {
    const result = await callChatModel({ config, messages: [], systemPrompt: "test" });
    assert.equal(result.model, "chat-model");
    assert.equal(result.data.reply, "稳");
    assert.deepEqual(requestedModels, ["reasoning-model", "reasoning-model", "chat-model"]);
  } finally {
    global.fetch = originalFetch;
  }
});
