const PRODUCT_PREFERENCE_PATTERN = /DIY|自己做|亲手|动手|体验|随机|惊喜|盲盒|福袋|兵器|贴纸|直接|成品|带走|赶时间|头巾|穿戴|戴着|拍照|装扮|户外/i;

export function hasProductPreference(messages = []) {
  return messages
    .filter((message) => message.role === "user")
    .some((message) => PRODUCT_PREFERENCE_PATTERN.test(message.content));
}

function cleanVisibleText(value) {
  return typeof value === "string"
    ? value.replace(/\*\*|__|`|^#{1,6}\s*/gm, "").trim()
    : value;
}

export function sanitizeAgentResult(result) {
  if (!result || typeof result !== "object") return result;
  const recommendation = result.recommendation && typeof result.recommendation === "object"
    ? {
        ...result.recommendation,
        fortuneTitle: cleanVisibleText(result.recommendation.fortuneTitle),
        fortuneReading: cleanVisibleText(result.recommendation.fortuneReading),
        reason: cleanVisibleText(result.recommendation.reason),
      }
    : result.recommendation;
  return {
    ...result,
    reply: cleanVisibleText(result.reply),
    quickReplies: Array.isArray(result.quickReplies) ? result.quickReplies.map(cleanVisibleText) : [],
    recommendation,
  };
}

export function enforceRecommendationTiming(result, messages = []) {
  if (!result?.recommendation || hasProductPreference(messages)) return result;
  return {
    reply: "先生已经看清这份好运的方向，最后还差一个落点：客官想直接带走香囊、亲手做一只、开个随机福袋，还是戴一条水浒头巾？",
    stage: "profiling",
    quickReplies: ["直接带走", "亲手 DIY", "开随机福袋", "想戴头巾"],
    recommendation: null,
  };
}
