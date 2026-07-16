import { Check, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

export default function RecommendationPanel({ recommendation }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (recommendation && window.matchMedia("(max-width: 820px)").matches) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [recommendation]);

  return (
    <aside ref={panelRef} className={`recommendation-panel ${recommendation ? "has-result" : ""}`} aria-live="polite">
      {!recommendation ? (
        <div className="fortune-teller-stage">
          <div className="character-halo" aria-hidden="true" />
          <img src="/assets/fortune-teller-stage.png" alt="手持折扇、坐在签桌后的四福先生动画形象" />
          <div className="waiting-copy">
            <Sparkles aria-hidden="true" />
            <p>先生会在对话里自然穿插一种小术，也可能只听你说几句。</p>
            <strong>好运只往吉处解，福物最终只点一件。</strong>
          </div>
        </div>
      ) : (
        <div className="recommendation-result">
          <div className="fortune-title-row">
            <span className="result-check"><Check aria-hidden="true" /></span>
            <div>
              <p className="result-label">先生点出的今日好运</p>
              <h2>{recommendation.fortuneTitle}</h2>
            </div>
          </div>
          <p className="fortune-reading">{recommendation.fortuneReading}</p>

          <div className="product-display">
            <img src={recommendation.productImage} alt={recommendation.productTypeLabel} />
            <div className="product-copy">
              <p className="product-kicker">为你点定一件福物</p>
              <h3>{recommendation.productName}</h3>
              <p>{recommendation.reason}</p>
            </div>
          </div>

          <p className="sales-line">{recommendation.salesLine}</p>
          <p className="staff-line">把这一页给摊位工作人员看，即可找到对应福物。</p>
        </div>
      )}
    </aside>
  );
}
