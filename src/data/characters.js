export const characters = [
  {
    id: "luzhishen",
    name: "鲁智深",
    blessing: "拔掉烦恼",
    image: "/assets/03-luzhishen-badiao-fannao-q.png",
    color: "#b52b22",
  },
  {
    id: "likui",
    name: "李逵",
    blessing: "快乐加倍",
    image: "/assets/05-likui-kuile-jiabei-q.png",
    color: "#2f6744",
  },
  {
    id: "zhangshun",
    name: "张顺",
    blessing: "顺风顺水",
    image: "/assets/16-zhangshun-shunfeng-shunshui-q.png",
    color: "#316675",
  },
  {
    id: "andaoquan",
    name: "安道全",
    blessing: "安到全家",
    image: "/assets/17-andaoquan-an-dao-quanjia-q.png",
    color: "#96711d",
  },
];

export const characterMap = Object.fromEntries(characters.map((character) => [character.id, character]));
