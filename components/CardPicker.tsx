"use client";

export type CardItem = {
  id: string;
  label: string;
  sublabel?: string;
  colorHex?: string;
};

export function CardPicker({
  items,
  selectedId,
  onSelect,
  numbered = false,
}: {
  items: CardItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  numbered?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item, i) => {
        const selected = item.id === selectedId;
        const accent = item.colorHex ?? "var(--accent)";
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition"
            style={{
              borderColor: selected ? accent : "var(--surface-border)",
              background: selected
                ? `color-mix(in srgb, ${accent} 14%, var(--surface))`
                : "var(--surface)",
            }}
          >
            {numbered ? (
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: accent }}
              >
                {i + 1}
              </span>
            ) : (
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: accent }} />
            )}
            <span className="flex flex-col">
              <span className="font-medium">{item.label}</span>
              {item.sublabel && <span className="text-xs opacity-60">{item.sublabel}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
