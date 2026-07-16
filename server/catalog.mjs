export const CHARACTERS = {
  luzhishen: {
    name: "鲁智深",
    blessing: "拔掉烦恼",
    keywords: ["烦恼", "压力", "放下", "轻松", "不开心", "焦虑", "累"],
    shortBlessing: "先拔掉一件小烦恼，轻装上阵，眼前自然开阔。",
  },
  likui: {
    name: "李逵",
    blessing: "快乐加倍",
    keywords: ["开心", "快乐", "孩子", "亲子", "热闹", "朋友", "笑"],
    shortBlessing: "和同行的人击个掌，让今天的快乐不止一份。",
  },
  zhangshun: {
    name: "张顺",
    blessing: "顺风顺水",
    keywords: ["顺利", "旅行", "工作", "学业", "考试", "办事", "出行", "前程"],
    shortBlessing: "顺水而行，不急着与浪较劲，今天一路从容。",
  },
  andaoquan: {
    name: "安道全",
    blessing: "安到全家",
    keywords: ["家人", "父母", "长辈", "平安", "健康", "家庭", "安心", "团圆"],
    shortBlessing: "把平安带给自己，也把惦念送给家里每一个人。",
  },
};

export const PRODUCT_TYPES = {
  finished_sachet: {
    label: "人物成品香囊",
    reason: "适合直接带走或送给家人，选择明确、无需等待。",
  },
  diy_sachet: {
    label: "人物 DIY 香囊",
    reason: "适合亲子或喜欢动手的游客，能把共同制作变成纪念。",
  },
  lucky_bag: {
    label: "主题随机福袋",
    reason: "适合喜欢开袋惊喜、兵器与贴纸小物的游客。",
  },
};

export function buildRecommendation(characterId, productType) {
  const resolvedCharacterId = CHARACTERS[characterId] ? characterId : "zhangshun";
  const resolvedProductType = PRODUCT_TYPES[productType] ? productType : "finished_sachet";
  const character = CHARACTERS[resolvedCharacterId];
  const product = PRODUCT_TYPES[resolvedProductType];
  const typeName = resolvedProductType === "lucky_bag" ? "随机福袋" : resolvedProductType === "diy_sachet" ? "DIY 香囊" : "成品香囊";

  return {
    characterId: resolvedCharacterId,
    characterName: character.name,
    blessing: character.blessing,
    productType: resolvedProductType,
    productTypeLabel: product.label,
    productName: `${character.name}·${character.blessing} ${typeName}`,
    reason: product.reason,
    blessingLine: character.shortBlessing,
    salesLine:
      resolvedProductType === "diy_sachet"
        ? `建议选 ${character.name} 的 DIY 香囊，现场几分钟完成，把“${character.blessing}”亲手装进去。`
        : resolvedProductType === "lucky_bag"
          ? `建议选 ${character.name} 主题随机福袋，祝福方向确定，袋内江湖小物随机。`
          : `建议选 ${character.name} 成品香囊，寓意是“${character.blessing}”，可以直接随身带走。`,
  };
}
