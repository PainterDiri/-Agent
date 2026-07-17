import assert from "node:assert/strict";
import { test } from "node:test";
import { buildRecommendation } from "./catalog.mjs";

test("recommendation normalizes model aliases and long fortune titles", () => {
  const result = buildRecommendation("安 道 全", "特色头巾", {
    fortuneTitle: "家和心安，福气常在",
  });
  assert.equal(result.characterId, "andaoquan");
  assert.equal(result.productType, "headscarf");
  assert.equal(result.fortuneTitle, "家和心安");
});
