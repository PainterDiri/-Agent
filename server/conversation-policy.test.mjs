import assert from "node:assert/strict";
import { test } from "node:test";
import { enforceRecommendationTiming, sanitizeAgentResult } from "./conversation-policy.mjs";

const recommendationResult = {
  reply: "建议选 DIY 香囊",
  stage: "recommendation",
  quickReplies: [],
  recommendation: { productType: "diy_sachet" },
};

test("recommendation is blocked during the early fortune conversation", () => {
  const result = enforceRecommendationTiming(recommendationResult, [
    { role: "user", content: "为父母求日子顺当" },
  ]);
  assert.equal(result.recommendation, null);
  assert.equal(result.stage, "fortune");
  assert.doesNotMatch(result.reply, /香囊|福袋|头巾|商品/);
});

test("product preference cannot skip the minimum fortune turns", () => {
  const result = enforceRecommendationTiming(recommendationResult, [
    { role: "user", content: "想和孩子亲手 DIY" },
    { role: "assistant", content: "孩子有你陪着很有福气。" },
    { role: "user", content: "希望他开心" },
  ]);
  assert.equal(result.recommendation, null);
  assert.doesNotMatch(result.reply, /香囊|福袋|头巾|商品/);
});

test("early sales language is replaced even without recommendation data", () => {
  const result = enforceRecommendationTiming({
    reply: "推荐你买一个香囊。",
    stage: "fortune",
    quickReplies: [],
    recommendation: null,
  }, [{ role: "user", content: "为自己求顺利" }]);
  assert.doesNotMatch(result.reply, /香囊|福袋|头巾|商品/);
  assert.match(result.reply, /好开头/);
});

test("recommendation asks for a keepsake preference after four fortune turns", () => {
  const messages = ["为自己", "求顺利", "出行办事", "希望心里踏实"].map((content) => ({ role: "user", content }));
  const result = enforceRecommendationTiming(recommendationResult, messages);
  assert.equal(result.recommendation, null);
  assert.match(result.reply, /留个念想/);
  assert.doesNotMatch(result.reply, /香囊|福袋|头巾|商品/);
  assert.deepEqual(result.quickReplies, ["随身香气", "亲手制作", "拆开惊喜", "穿戴留影"]);
});

test("recommendation waits for a final blessing after five turns and a product preference", () => {
  const messages = ["为孩子", "求开心", "喜欢热闹", "想留纪念", "想和孩子亲手 DIY"].map((content) => ({ role: "user", content }));
  const result = enforceRecommendationTiming(recommendationResult, messages);
  assert.equal(result.recommendation, null);
  assert.match(result.reply, /愿你所念之人/);
  assert.deepEqual(result.quickReplies, ["请先生点定福物"]);
});

test("recommendation is preserved on the sixth turn after a natural keepsake choice", () => {
  const messages = ["为孩子", "求开心", "喜欢热闹", "想留纪念", "亲手制作", "请先生点定福物"].map((content) => ({ role: "user", content }));
  const result = enforceRecommendationTiming(recommendationResult, messages);
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
