// La iglesia opera en hora de Panamá (UTC-5, sin horario de verano), pero
// el servidor (Vercel) corre en UTC. `new Date().toISOString()` da la fecha
// UTC: un domingo después de las 7 p. m. en Panamá ya es lunes en UTC, y el
// formulario proponía la semana siguiente. Todas las fechas "de hoy" se
// calculan aquí, en la zona horaria de la iglesia.
const ZONA_IGLESIA = "America/Panama";

/** Fecha de hoy en Panamá, como "YYYY-MM-DD". */
export function hoyISO(): string {
  // en-CA formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_IGLESIA }).format(new Date());
}

function sumarDias(fechaISO: string, dias: number): string {
  const [a, m, d] = fechaISO.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
}

/** Lunes a domingo de la semana en curso (hora de Panamá). */
export function semanaActual(): { inicio: string; fin: string } {
  const hoy = hoyISO();
  const [a, m, d] = hoy.split("-").map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay(); // 0 = domingo
  const inicio = sumarDias(hoy, dia === 0 ? -6 : 1 - dia);
  return { inicio, fin: sumarDias(inicio, 6) };
}

/** "2026-09-14" → "14 sep 2026", sin pasar por la zona horaria del navegador. */
export function formatearFecha(fechaISO: string): string {
  const [a, m, d] = fechaISO.split("-").map(Number);
  return new Intl.DateTimeFormat("es-PA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(a, m - 1, d)));
}
