const COLORES: Record<string, string> = {
  Morado: "#6E4FA3",
  Turquesa: "#0D9488",
  Blanco: "#9CA3AF",
  Rojo: "#DC2626",
  Verde: "#16A34A",
  Azul: "#2563EB",
  "Naranja peach": "#EA580C",
};

export function colorMentorHex(color: string | null | undefined): string {
  return (color && COLORES[color]) || "var(--accent)";
}
