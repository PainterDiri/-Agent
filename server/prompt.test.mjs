import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSystemPrompt, selectFortuneTechnique } from "./prompt.mjs";

test("fortune technique stays stable throughout one conversation", () => {
  const firstTurn = [{ role: "user", content: "为全家求一份平安" }];
  const laterTurn = [
    ...firstTurn,
    { role: "assistant", content: "客官凭第一感觉选一个。" },
    { role: "user", content: "我选水" },
  ];
  assert.equal(selectFortuneTechnique(firstTurn).id, selectFortuneTechnique(laterTurn).id);
});

test("system prompt integrates fortune play and complete product schema", () => {
  const prompt = buildSystemPrompt([{ role: "user", content: "为孩子求开心" }]);
  assert.match(prompt, /小术只能藏在自然对话中/);
  assert.match(prompt, /headscarf/);
  assert.match(prompt, /fortuneTitle/);
  assert.match(prompt, /判词必须吉利/);
  assert.match(prompt, /前四个用户回合/);
  assert.match(prompt, /知福先生/);
  assert.match(prompt, /宁可多聊一轮祝福/);
});
