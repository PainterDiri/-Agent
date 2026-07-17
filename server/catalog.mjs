export const CHARACTERS = {
  luzhishen: {
    name: "鲁智深",
    blessing: "拔掉烦恼",
    fortuneTitle: "烦事渐轻",
    keywords: ["烦恼", "压力", "放下", "轻松", "不开心", "焦虑", "累", "芦苇", "墨绿"],
    shortBlessing: "眼前的重事宜一件件放下，轻装之后，路自然越走越宽。",
  },
  likui: {
    name: "李逵",
    blessing: "快乐加倍",
    fortuneTitle: "笑口添福",
    keywords: ["开心", "快乐", "孩子", "亲子", "热闹", "朋友", "笑", "朱红", "南"],
    shortBlessing: "今日的人气与笑声都是福气，越愿意分享，越容易收获好心情。",
  },
  zhangshun: {
    name: "张顺",
    blessing: "顺风顺水",
    fortuneTitle: "顺水得势",
    keywords: ["顺利", "旅行", "工作", "学业", "考试", "办事", "出行", "前程", "水", "江蓝", "东"],
    shortBlessing: "水势正顺，接下来适合借力而行，不必急着与每一道浪较劲。",
  },
  andaoquan: {
    name: "安道全",
    blessing: "安到全家",
    fortuneTitle: "家和心安",
    keywords: ["家人", "父母", "长辈", "平安", "健康", "家庭", "安心", "团圆", "桥", "北", "鎏金"],
    shortBlessing: "你心里有牵挂，也有安定人的力量；稳稳照顾好当下，家中便多一份和气。",
  },
};

export const PRODUCT_TYPES = {
  finished_sachet: {
    label: "人物成品香囊",
    shortName: "成品香囊",
    image: "/assets/product-sachet.png",
    reason: "适合直接带走或送给家人，人物寓意明确，也不需要等待制作。",
  },
  diy_sachet: {
    label: "人物 DIY 香囊",
    shortName: "DIY 香囊",
    image: "/assets/product-sachet.png",
    reason: "适合亲子或喜欢动手的游客，亲手完成的过程本身就是一份纪念。",
  },
  lucky_bag: {
    label: "水浒随机福袋",
    shortName: "随机福袋",
    image: "/assets/product-lucky-bag.png",
    reason: "适合喜欢开袋惊喜和水浒小物的游客，每次拆开都有一点江湖趣味。",
  },
  headscarf: {
    label: "水浒特色头巾",
    shortName: "水浒特色头巾",
    image: "/assets/product-headscarf.png",
    reason: "适合喜欢穿戴、拍照或户外活动的游客，醒目又能反复使用。",
  },
};

function resolveCharacterId(value) {
  const normalized = String(value || "").toLowerCase().replace(/[\s_-]/g, "");
  if (CHARACTERS[normalized]) return normalized;
  if (/鲁智深|luzhi/.test(normalized)) return "luzhishen";
  if (/李逵|likui/.test(normalized)) return "likui";
  if (/安道全|andao/.test(normalized)) return "andaoquan";
  if (/张顺|zhangshun/.test(normalized)) return "zhangshun";
  return "zhangshun";
}

function resolveProductType(value) {
  const normalized = String(value || "").toLowerCase().replace(/[\s_-]/g, "");
  if (PRODUCT_TYPES[normalized]) return normalized;
  if (/头巾|headscarf|bandana/.test(normalized)) return "headscarf";
  if (/diy|自制|自己做|亲手/.test(normalized)) return "diy_sachet";
  if (/福袋|luckybag|随机|盲盒/.test(normalized)) return "lucky_bag";
  if (/香囊|sachet|成品/.test(normalized)) return "finished_sachet";
  return "finished_sachet";
}

function normalizeFortuneTitle(value, fallback) {
  const firstPhrase = String(value || fallback)
    .split(/[，,。；;！!？?]/)[0]
    .replace(/\s+/g, "")
    .trim();
  return (firstPhrase || fallback).slice(0, 8);
}

export function buildRecommendation(characterId, productType, details = {}) {
  const resolvedCharacterId = resolveCharacterId(characterId);
  const resolvedProductType = resolveProductType(productType);
  const character = CHARACTERS[resolvedCharacterId];
  const product = PRODUCT_TYPES[resolvedProductType];

  return {
    characterId: resolvedCharacterId,
    characterName: character.name,
    blessing: character.blessing,
    productType: resolvedProductType,
    productTypeLabel: product.label,
    productName: resolvedProductType === "lucky_bag"
      ? product.label
      : `${character.name}·${character.blessing} ${product.shortName}`,
    productImage: product.image,
    fortuneTitle: normalizeFortuneTitle(details.fortuneTitle, character.fortuneTitle),
    fortuneReading: details.fortuneReading || character.shortBlessing,
    reason: details.reason || product.reason,
    salesLine: resolvedProductType === "diy_sachet"
      ? `建议亲手做一只 ${character.name} DIY 香囊，把“${character.blessing}”装进今天的共同回忆。`
      : resolvedProductType === "lucky_bag"
        ? "建议带走一只水浒随机福袋，好意头已经点定，袋里的江湖小物留一份开袋惊喜。"
        : resolvedProductType === "headscarf"
          ? `建议选一条 ${character.name} 主题水浒头巾，把“${character.blessing}”戴在身上，也方便拍照留念。`
          : `建议选 ${character.name} 成品香囊，寓意是“${character.blessing}”，可以直接随身带走。`,
  };
}
