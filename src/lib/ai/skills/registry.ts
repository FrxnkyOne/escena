import { narrativeDirector } from "./narrative-director";
import { scriptwriter } from "./scriptwriter";

/**
 * La "caja de recetas": todos los skills disponibles, indexados por su id.
 * Para sumar un skill nuevo: lo importás arriba y agregás una línea acá.
 */
export const SKILLS = {
  "narrative-director": narrativeDirector,
  scriptwriter: scriptwriter,
} as const;

/** Catálogo liviano (id, nombre, descripción) para listar skills en la UI. */
export const SKILL_CATALOG = Object.values(SKILLS).map((s) => ({
  id: s.id,
  name: s.name,
  description: s.description,
}));
