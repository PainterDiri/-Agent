import { CHARACTERS, buildRecommendation } from "./catalog.mjs";
import { selectFortuneTechnique } from "./prompt.mjs";

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
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

function chooseProduct(text) {
  if (/头巾|穿戴|戴着|拍照|装扮|户外/.test(text)) return "headscarf";
  if (/自己做|亲手|动手|DIY|体验|孩子做/.test(text)) return "diy_sachet";
  if (/随机|惊喜|盲盒|福袋|兵器|贴纸|拆/.test(text)) return "lucky_bag";
  return "finished_sachet";
}

function techniqueQuestion(techniqueId) {
  const questions = {
    "three-scenes": { reply: "先不忙说愿望。水、桥、芦苇，客官第一眼更有缘的是哪一样？", quickReplies: ["水", "桥", "芦苇"] },
    direction: { reply: "你愿意凭直觉来选，说明心里有股干脆劲，这样的人遇事往往不拖泥带水。借西溪四方水气一问：东、南、西、北，客官第一感觉想选哪一方？", quickReplies: ["东", "南", "西", "北"] },
    number: { reply: "客官凭第一念，在一到九里挑一个数，不必多想。", quickReplies: ["1", "3", "6", "8"] },
    color: { reply: "朱红、墨绿、江蓝、鎏金，客官第一眼更中意哪一种？", quickReplies: ["朱红", "墨绿", "江蓝", "鎏金"] },
    "1089": { reply: "客官若喜欢数字，可想一个首尾不同的三位数；若不想算，先生也能直接听心愿。", quickReplies: ["玩数字", "直接聊心愿"] },
  };
  return questions[techniqueId];
}

export function runMockAgent(messages) {
  const userMessages = messages.filter((message) => message.role === "user");
  const userTurns = userMessages.length;
  const userText = userMessages.map((message) => message.content).join("；");
  if (/不想买|不买|只想玩|不用推荐|不需要买/.test(userText)) {
    return {
      reply: "买不买都不妨碍这份好意头。愿客官今日烦事渐轻、一路有笑，慢慢逛西溪。",
      stage: "closing",
      quickReplies: ["重新开始"],
      recommendation: null,
    };
  }

  const hasRecipient = /自己|孩子|小朋友|父母|长辈|家人|全家|朋友|同行/.test(userText);
  if (!hasRecipient) {
    return {
      reply: "客官先让先生听明白：这份好彩头，是为自己、孩子，还是父母全家问的？",
      stage: "profiling",
      quickReplies: ["为自己", "为孩子", "为父母或全家"],
      recommendation: null,
    };
  }

  const technique = selectFortuneTechnique(messages);
  const question = techniqueQuestion(technique.id);
  if (question && userMessages.length < 2) {
    return { ...question, stage: "fortune", recommendation: null };
  }

  const hasWish = Object.values(CHARACTERS).some((character) => character.keywords.some((keyword) => userText.includes(keyword)))
    || /水|桥|芦苇|东|南|西|北|朱红|墨绿|江蓝|鎏金|\b[1-9]\b/.test(userText);
  if (!hasWish) {
    return {
      reply: "你先想到家里人，这份牵挂本身就是福气。今天最想求少些烦恼、多些快乐、一路顺利，还是家中安稳？",
      stage: "profiling",
      quickReplies: ["少些烦恼", "多些快乐", "一路顺利", "家中安稳"],
      recommendation: null,
    };
  }

  if (userTurns < 3) {
    return {
      reply: "你说的愿望不贪多，求的是日子真正顺心，可见是个有分寸的人。先生再看一层：眼下最希望这份好运帮你把事情推着往前，还是让心里松快下来？",
      stage: "fortune",
      quickReplies: ["事情往前走", "心里松快些"],
      recommendation: null,
    };
  }

  if (userTurns < 4) {
    return {
      reply: "能把自己真正想要的说清楚，本身就是接住好运的本事。先生看你这份福不是猛冲的福，而是越走越稳、身边人也愿意相助的福。最近更看重出行办事、家人相聚，还是留一段开心回忆？",
      stage: "fortune",
      quickReplies: ["出行办事", "家人相聚", "开心回忆"],
      recommendation: null,
    };
  }

  const hasProductPreference = /DIY|自己做|亲手|亲手制作|动手|随机|惊喜|拆开惊喜|福袋|兵器|贴纸|直接|成品|带走|随身香气|赶时间|头巾|穿戴|穿戴留影|拍照|户外/.test(userText);
  if (!hasProductPreference) {
    return {
      reply: "这份好运已经说得圆满：你心里有方向，身边也有人气，接下来宜稳稳往前走。若想让这份好意头留个念想，你更喜欢留一缕随身香气、亲手做点东西、拆开一份惊喜，还是穿戴起来留个影？",
      stage: "fortune",
      quickReplies: ["随身香气", "亲手制作", "拆开惊喜", "穿戴留影"],
      recommendation: null,
    };
  }

  if (userTurns < 6) {
    return {
      reply: "这选择很合你的心意，也看得出你是个既讲实用、又懂得给日子添趣的人。愿你所念之人常有笑意，所走之路多遇顺风；请先生再替你收好这句福。",
      stage: "fortune",
      quickReplies: ["请先生点定福物"],
      recommendation: null,
    };
  }

  const recommendation = buildRecommendation(scoreCharacters(userText), chooseProduct(userText));
  return {
    reply: `先生替你收成一句：${recommendation.fortuneTitle}。${recommendation.fortuneReading}方才这份好意头，正好可以落在${recommendation.productName}上，留作今天的一份纪念。`,
    stage: "recommendation",
    quickReplies: ["就选这件福物", "重新开始"],
    recommendation,
  };
}
