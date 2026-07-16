import { CHARACTERS, buildRecommendation } from "./catalog.mjs";

function scoreCharacters(text) {
  const scores = Object.fromEntries(Object.keys(CHARACTERS).map((id) => [id, 0]));

  for (const [id, character] of Object.entries(CHARACTERS)) {
    for (const keyword of character.keywords) {
      if (text.includes(keyword)) scores[id] += 2;
    }
  }

  if (/父母|长辈|全家|家里/.test(text)) scores.andaoquan += 4;
  if (/孩子|小朋友|亲子/.test(text)) scores.likui += 3;
  if (/西溪|旅游|出门|路上/.test(text)) scores.zhangshun += 2;
  if (/累|压力|烦/.test(text)) scores.luzhishen += 3;

  const [id, score] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return { id, score };
}

function chooseProduct(text) {
  if (/自己做|亲手|动手|DIY|体验|孩子做/.test(text)) return "diy_sachet";
  if (/随机|惊喜|盲盒|福袋|兵器|贴纸|拆/.test(text)) return "lucky_bag";
  return "finished_sachet";
}

export function runMockAgent(messages, profile = {}) {
  const userText = messages.filter((message) => message.role === "user").map((message) => message.content).join("；");
  if (/不想买|不买|只想玩|不用推荐|不需要买/.test(userText)) {
    return {
      reply: "明白，玩得开心就好。愿你今日少些烦恼、一路顺意，慢慢逛西溪。",
      stage: "closing",
      quickReplies: ["玩数字魔术", "重新开始"],
      recommendation: null,
    };
  }
  const hasRecipient = /自己|孩子|小朋友|父母|长辈|家人|全家|朋友|同行/.test(userText);
  const hasWish = Object.values(CHARACTERS).some((character) => character.keywords.some((keyword) => userText.includes(keyword)));
  const hasProductPreference = /DIY|自己做|亲手|动手|体验|随机|惊喜|盲盒|福袋|兵器|贴纸|直接|成品|带走|赶时间/.test(userText);

  if (!hasRecipient) {
    return {
      reply: "这份好彩头是为自己，还是为孩子、父母或全家问的？",
      stage: "profiling",
      quickReplies: ["为自己", "为孩子", "为父母或全家"],
      recommendation: null,
    };
  }

  if (!hasWish) {
    return {
      reply: "今天最想求个什么好彩头：少些烦恼、多些快乐、一路顺利，还是全家平安？",
      stage: "profiling",
      quickReplies: ["少些烦恼", "快乐加倍", "一路顺利", "全家平安"],
      recommendation: null,
    };
  }

  if (!hasProductPreference) {
    return {
      reply: "最后问一句：你更想直接带走、亲手做一只，还是喜欢开袋惊喜？",
      stage: "profiling",
      quickReplies: ["直接带走", "亲手 DIY", "喜欢随机惊喜"],
      recommendation: null,
    };
  }

  const scoredCharacter = scoreCharacters(userText);
  const characterId = profile.selectedCharacterId || (scoredCharacter.score > 0 ? scoredCharacter.id : profile.magicCharacterId) || "zhangshun";
  const productType = chooseProduct(userText);
  const recommendation = buildRecommendation(characterId, productType);

  return {
    reply: `${recommendation.blessingLine}${recommendation.salesLine}`,
    stage: "recommendation",
    quickReplies: ["看看这件福物", "再听一次", "重新开始"],
    recommendation,
  };
}
