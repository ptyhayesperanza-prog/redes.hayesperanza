/** Monto de ofrenda. Se registra en $ (ver CLAUDE.md: "ofrenda se queda como monto en $"). */
export function dinero(n: number): string {
  return "$" + n.toFixed(2);
}

/** Porcentaje entero, 0 si no hay base. */
export function porcentaje(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}
