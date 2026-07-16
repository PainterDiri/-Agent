import { Check, Gift, Hand, ShoppingBag } from "lucide-react";
import { characterMap } from "../data/characters";

const typeIcons = {
  finished_sachet: ShoppingBag,
  diy_sachet: Hand,
  lucky_bag: Gift,
};

export default function RecommendationPanel({ recommendation, activeCharacter }) {
  const character = recommendation ? characterMap[recommendation.characterId] : activeCharacter;
  const Icon = recommendation ? typeIcons[recommendation.productType] || ShoppingBag : ShoppingBag;

  return (
    <aside className={`recommendation-panel ${recommendation ? "has-result" : ""}`} aria-live="polite">
      <div className="wetland-sketch" aria-hidden="true">
        <span className="water-line" />
        <span className="reed-line one" />
        <span className="reed-line two" />
        <span className="reed-line three" />
      </div>

      {character && <img className="recommendation-character" src={character.image} alt="" />}

      {!recommendation ? (
        <div className="recommendation-waiting">
          <Icon aria-hidden="true" />
          <h2>今日福物尚未点定</h2>
          <p>聊完几句，先生只为你指向一件具体商品。</p>
        </div>
      ) : (
        <div className="recommendation-result">
          <span className="result-check"><Check aria-hidden="true" /></span>
          <p className="result-label">先生为你点定</p>
          <h2>{recommendation.productName}</h2>
          <p className="result-blessing">{recommendation.blessingLine}</p>
          <div className="result-reason">
            <Icon aria-hidden="true" />
            <p>{recommendation.reason}</p>
          </div>
          <p className="staff-line">把这一页给摊位工作人员看，即可找到对应福物。</p>
        </div>
      )}
    </aside>
  );
}
