import { characters } from "../data/characters";

export default function CharacterRail({ activeId, onSelect }) {
  return (
    <nav className="character-rail" aria-label="四福人物">
      {characters.map((character) => (
        <button
          className={`character-tile ${activeId === character.id ? "is-active" : ""}`}
          type="button"
          key={character.id}
          onClick={() => onSelect(character)}
          aria-label={`选择${character.name}，${character.blessing}`}
        >
          <img src={character.image} alt={`${character.name}，${character.blessing}`} />
          <span className="character-caption">
            <strong>{character.name}</strong>
            <small>{character.blessing}</small>
          </span>
        </button>
      ))}
    </nav>
  );
}
