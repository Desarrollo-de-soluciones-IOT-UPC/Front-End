/**
 * Nivel de exposición electromagnética — la MISMA regla que el backend
 * (`shared/domain/model/RadiationLevel.java`) y el edge
 * (`monitoring/domain/value_objects.py`).
 *
 * Con esto los tres stacks comparten una sola verdad sobre los umbrales. Antes el
 * front tenía su propia copia enterrada en `map-radiation.ts`, y ya pasó una vez
 * que la web clasificaba con una escala (µSv/h, 0.10/0.30) mientras el edge medía
 * en otra (µT, 100/200): todo salía en rojo.
 *
 * **El edge es la autoridad.** `levelForValue` es sólo el respaldo para lecturas
 * que llegan sin nivel (datos antiguos o de semilla): usa `levelOf`, que respeta lo
 * que venga del backend y sólo clasifica cuando no hay nada.
 */
export type RadiationLevel = 'safe' | 'caution' | 'danger';

/** Umbrales en microteslas (µT). Referencia ICNIRP 50 Hz, público general. */
export const CAUTION_UT = 100;
export const DANGER_UT = 200;

/** Clasifica por valor. Respaldo: normalmente el nivel lo decide el edge. */
export function levelForValue(value: number | null | undefined): RadiationLevel {
  if (value == null || value < CAUTION_UT) return 'safe';
  if (value < DANGER_UT) return 'caution';
  return 'danger';
}

/** Nivel efectivo: respeta el del edge y sólo clasifica si no viene. */
export function levelOf(
  reported: string | null | undefined,
  value: number | null | undefined,
): RadiationLevel {
  const normalized = reported?.trim().toLowerCase();
  if (normalized === 'safe' || normalized === 'caution' || normalized === 'danger') {
    return normalized;
  }
  return levelForValue(value);
}

const SEVERITY: Record<RadiationLevel, number> = { safe: 0, caution: 1, danger: 2 };

/** El peor de dos niveles — para resumir varios sensores en un solo indicador. */
export function worseOf(a: RadiationLevel, b: RadiationLevel): RadiationLevel {
  return SEVERITY[a] >= SEVERITY[b] ? a : b;
}

export function isDangerous(level: RadiationLevel): boolean {
  return level === 'danger';
}
