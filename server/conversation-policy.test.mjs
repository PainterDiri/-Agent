import assert from "node:assert/strict";
import { test } from "node:test";
import { enforceRecommendationTiming, sanitizeAgentResult } from "./conversation-policy.mjs";

const recommendationResult = {
  reply: "建议选 DIY 香囊",
  stage: "recommendation",
  quickReplies: [],
  recommendation: { productType: "diy_sachet" },
};

test("recommendation waits for an explicit product preference", () => {
  const result = enforceRecommendationTiming(recommendationResult, [
    { role: "user", content: "为父母求日子顺当" },
  ]);
  assert.equal(result.recommendation, null);
  assert.match(result.reply, /最后还差一个落点/);
  assert.deepEqual(result.quickReplies, ["直接带走", "亲手 DIY", "开随机福袋", "想戴头巾"]);
});

test("recommendation is preserved after the visitor chooses DIY", () => {
  const result = enforceRecommendationTiming(recommendationResult, [
    { role: "user", content: "想和孩子亲手 DIY" },
  ]);
  assert.equal(result, recommendationResult);
});

test("visible model text has Markdown emphasis removed", () => {
  const result = sanitizeAgentResult({
    reply: "最适合 **李逵** 的 `DIY` 香囊",
    quickReplies: ["**就要它**"],
    recommendation: { fortuneTitle: "**笑口添福**", reason: "适合 __亲子__" },
  });
  assert.equal(result.reply, "最适合 李逵 的 DIY 香囊");
  assert.deepEqual(result.quickReplies, ["就要它"]);
  assert.equal(result.recommendation.fortuneTitle, "笑口添福");
  assert.equal(result.recommendation.reason, "适合 亲子");
});
