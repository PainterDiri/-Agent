import { Calculator, Check, Compass, Hash, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { characterMap, characters } from "../data/characters";

function reverseThreeDigits(number) {
  return Number(String(number).padStart(3, "0").split("").reverse().join(""));
}

function kaprekarSteps(value) {
  let current = String(value).padStart(4, "0");
  const rows = [];
  for (let index = 0; index < 7 && current !== "6174"; index += 1) {
    const descending = current.split("").sort((a, b) => b.localeCompare(a)).join("");
    const ascending = [...descending].reverse().join("");
    const next = String(Number(descending) - Number(ascending)).padStart(4, "0");
    rows.push({ descending, ascending, next });
    current = next;
  }
  return rows;
}

const directionFortunes = [
  { id: "east", label: "东方", hint: "启程", characterId: "zhangshun", line: "东方取启程之意，宜顺水前行。" },
  { id: "south", label: "南方", hint: "添喜", characterId: "likui", line: "南方取明快之意，宜把快乐分给同行的人。" },
  { id: "west", label: "西方", hint: "放下", characterId: "luzhishen", line: "西方取收束之意，宜放下一件压心的小事。" },
  { id: "north", label: "北方", hint: "守安", characterId: "andaoquan", line: "北方取守护之意，宜把平安放在全家心上。" },
];

export default function MagicPanel({ open, onClose, onComplete }) {
  const [mode, setMode] = useState("menu");
  const [number, setNumber] = useState("");
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(null);
  const numeric = Number(number);
  const valid1089 = /^\d{3}$/.test(number) && Math.abs(Number(number[0]) - Number(number[2])) >= 2;
  const valid6174 = /^\d{4}$/.test(number) && new Set(number.split("")).size >= 2;

  const calculation1089 = useMemo(() => {
    if (!valid1089) return null;
    const reversed = reverseThreeDigits(numeric);
    const difference = Math.abs(numeric - reversed);
    const differenceReversed = reverseThreeDigits(difference);
    return { reversed, difference, differenceReversed, result: difference + differenceReversed };
  }, [numeric, valid1089]);

  const calculation6174 = useMemo(() => valid6174 ? kaprekarSteps(number) : [], [number, valid6174]);

  const reset = () => {
    setMode("menu");
    setNumber("");
    setStep(1);
    setDirection(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const complete1089 = () => {
    const character = characters[calculation1089.difference % characters.length];
    onComplete(character.id, `我完成了 1089 好汉点将术，结果请${character.name}来为我问福。`);
    close();
  };

  const complete6174 = () => {
    const character = characters[calculation6174.length % characters.length];
    onComplete(character.id, `我完成了 6174 聚义回环术，一共走了${calculation6174.length}步，请${character.name}继续为我点福物。`);
    close();
  };

  const completeDirection = () => {
    const character = characterMap[direction.characterId];
    onComplete(character.id, `我抽到民俗方位娱乐签：${direction.label}${direction.hint}。${direction.line}请${character.name}继续为我问福。`);
    close();
  };

  if (!open) return null;

  return (
    <div className="magic-overlay" role="dialog" aria-modal="true" aria-labelledby="magic-title">
      <section className="magic-panel">
        <button className="close-magic" type="button" onClick={close} title="关闭"><X aria-hidden="true" /></button>
        {mode !== "menu" && (
          <button className="back-magic" type="button" onClick={reset} title="返回玩法选择"><RotateCcw aria-hidden="true" /></button>
        )}

        {mode === "menu" && (
          <>
            <Compass className="magic-icon" aria-hidden="true" />
            <h2 id="magic-title">选一局江湖小术</h2>
            <p className="magic-intro">数学玩法结果来自确定规律，方位签只作民俗娱乐，不预测真实命运。</p>
            <div className="magic-menu">
              <button type="button" onClick={() => setMode("1089")}>
                <Hash aria-hidden="true" />
                <strong>1089 好汉点将术</strong>
                <span>三位数倒序相减，见证一百单八将报到。</span>
              </button>
              <button type="button" onClick={() => setMode("6174")}>
                <Calculator aria-hidden="true" />
                <strong>6174 聚义回环术</strong>
                <span>四位数反复整队，最多七步聚到同一处。</span>
              </button>
              <button type="button" onClick={() => setMode("direction")}>
                <Compass aria-hidden="true" />
                <strong>四方时运娱乐签</strong>
                <span>凭第一感觉选一个方位，接一句民俗好彩头。</span>
              </button>
            </div>
          </>
        )}

        {mode === "1089" && (
          <>
            <Hash className="magic-icon" aria-hidden="true" />
            <h2 id="magic-title">1089 好汉点将术</h2>
            <p className="magic-intro">数字由你选择和计算，规律由数学保证。</p>
            <div className="magic-steps">
              {[1, 2, 3].map((item) => <span key={item} className={step >= item ? "active" : ""}>{item}</span>)}
            </div>

            {step === 1 && (
              <div className="magic-content">
                <h3>选一个三位数</h3>
                <p>第一位和最后一位至少相差 2，例如 532。</p>
                <input inputMode="numeric" maxLength={3} value={number} onChange={(event) => setNumber(event.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="532" autoFocus />
                {!valid1089 && number.length === 3 && <p className="magic-error">首尾数字需要至少相差 2。</p>}
                <button className="primary-command" type="button" disabled={!valid1089} onClick={() => setStep(2)}>倒过来看看</button>
              </div>
            )}

            {step === 2 && calculation1089 && (
              <div className="magic-content calculation">
                <h3>用大数减去小数</h3>
                <div className="number-equation">
                  <strong>{Math.max(numeric, calculation1089.reversed)}</strong><span>－</span>
                  <strong>{Math.min(numeric, calculation1089.reversed).toString().padStart(3, "0")}</strong><span>＝</span>
                  <strong>{calculation1089.difference.toString().padStart(3, "0")}</strong>
                </div>
                <p>再把差倒过来，准备揭晓梁山数字。</p>
                <button className="primary-command" type="button" onClick={() => setStep(3)}>揭晓</button>
              </div>
            )}

            {step === 3 && calculation1089 && (
              <div className="magic-content reveal">
                <span className="reveal-check"><Check aria-hidden="true" /></span>
                <p>{calculation1089.difference.toString().padStart(3, "0")} ＋ {calculation1089.differenceReversed.toString().padStart(3, "0")}</p>
                <strong>{calculation1089.result}</strong>
                <h3>一百单八将，前来点福</h3>
                <button className="primary-command" type="button" onClick={complete1089}>请先生继续</button>
              </div>
            )}
          </>
        )}

        {mode === "6174" && (
          <>
            <Calculator className="magic-icon" aria-hidden="true" />
            <h2 id="magic-title">6174 聚义回环术</h2>
            <p className="magic-intro">选四位不完全相同的数字，按大小重新排队并相减。</p>
            {step === 1 ? (
              <div className="magic-content">
                <input inputMode="numeric" maxLength={4} value={number} onChange={(event) => setNumber(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="3524" autoFocus />
                {!valid6174 && number.length === 4 && <p className="magic-error">四个数字不能完全相同。</p>}
                <button className="primary-command" type="button" disabled={!valid6174} onClick={() => setStep(2)}>开始整队</button>
              </div>
            ) : (
              <div className="magic-content kaprekar-result">
                <div className="kaprekar-list">
                  {calculation6174.map((row, index) => (
                    <p key={`${row.descending}-${index}`}><span>{index + 1}</span>{row.descending}－{row.ascending}＝<strong>{row.next}</strong></p>
                  ))}
                </div>
                <h3>最终聚到 6174</h3>
                <button className="primary-command" type="button" onClick={complete6174}>请先生继续</button>
              </div>
            )}
          </>
        )}

        {mode === "direction" && (
          <>
            <Compass className="magic-icon" aria-hidden="true" />
            <h2 id="magic-title">四方时运娱乐签</h2>
            <p className="magic-intro">不看地图，凭第一感觉选一个方位。结果只是一句民俗好彩头。</p>
            {!direction ? (
              <div className="direction-grid">
                {directionFortunes.map((item) => (
                  <button type="button" key={item.id} onClick={() => setDirection(item)}><strong>{item.label}</strong><span>{item.hint}</span></button>
                ))}
              </div>
            ) : (
              <div className="direction-result">
                <span>{direction.label}</span>
                <h3>{direction.hint}</h3>
                <p>{direction.line}</p>
                <button className="primary-command" type="button" onClick={completeDirection}>接下这句好彩头</button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
