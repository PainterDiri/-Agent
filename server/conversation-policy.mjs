const PRODUCT_PREFERENCE_PATTERN = /DIY|自己做|亲手|亲手制作|动手|体验|随机|惊喜|拆开惊喜|盲盒|福袋|兵器|贴纸|直接|成品|带走|随身香气|赶时间|头巾|穿戴|穿戴留影|戴着|拍照|装扮|户外/i;
const SALES_LANGUAGE_PATTERN = /香囊|福袋|头巾|福物|商品|购买|带走|DIY|亲手做|随机惊喜/;
const MIN_USER_TURNS_BEFORE_PRODUCT_QUESTION = 4;
const MIN_USER_TURNS_BEFORE_RECOMMENDATION = 6;

export function hasProductPreference(messages = []) {
  return messages
    .filter((message) => message.role === "user")
    .some((message) => PRODUCT_PREFERENCE_PATTERN.test(message.content));
}

function countUserTurns(messages = []) {
  return messages.filter((message) => message.role === "user").length;
}

function buildFortuneBridge(messages = []) {
  const userTurns = countUserTurns(messages);
  if (userTurns <= 1) {
    return {
      reply: "客官愿意把这份心愿说出来，已经是个好开头。先生先替你看一看：最近更想添些顺意、添些欢喜，还是让心里安稳些？",
      quickReplies: ["诸事顺意", "多些欢喜", "心里安稳"],
    };
  }
  if (userTurns === 2) {
    return {
      reply: "你求的不是虚浮热闹，而是日子里真能用得上的好意头，可见心里很有分寸。再让先生问一句：这份福最想落在自己、家人，还是一路同行的人身上？",
      quickReplies: ["落在自己", "落在家人", "送给同行的人"],
    };
  }
  return {
    reply: "先生听下来，你既惦记眼前，也替往后的日子留了余地，这是能把福气稳稳接住的人。今日若得一份好兆头，你最想把它用在出行办事、家人相聚，还是放松心情上？",
    quickReplies: ["出行办事", "家人相聚", "放松心情"],
  };
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
  const userTurns = countUserTurns(messages);
  if (!result?.recommendation && !(userTurns < MIN_USER_TURNS_BEFORE_PRODUCT_QUESTION && SALES_LANGUAGE_PATTERN.test(result?.reply || ""))) {
    return result;
  }
  if (userTurns < MIN_USER_TURNS_BEFORE_PRODUCT_QUESTION) {
    const bridge = buildFortuneBridge(messages);
    return { ...bridge, stage: "fortune", recommendation: null };
  }
  if (!hasProductPreference(messages)) {
    return {
      reply: "这份好运已经说得圆满。若想让它随身留个念想，客官更喜欢留一缕随身香气、亲手做点东西、拆开一份惊喜，还是穿戴起来留个影？",
      stage: "fortune",
      quickReplies: ["随身香气", "亲手制作", "拆开惊喜", "穿戴留影"],
      recommendation: null,
    };
  }
  if (userTurns < MIN_USER_TURNS_BEFORE_RECOMMENDATION) {
    return {
      reply: "眼光不错，这件东西和你方才说的好意头确实相合。先生再替你收一句福：愿你所念之人常有笑意，所走之路多遇顺风。",
      stage: "fortune",
      quickReplies: ["请先生点定福物"],
      recommendation: null,
    };
  }
  return result;
}
