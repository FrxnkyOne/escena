import { BLOCK_TYPES, newBlockId } from "@/lib/blocks";
import type { Scene, SceneTransition, Skill } from "./types";

/** Lo que recibe el Director: contenido crudo (brief o texto de un PDF). */
export interface NarrativeInput {
  source: string; // brief del usuario o texto extraído de un documento
  audience?: string; // audiencia objetivo, opcional (afina tono y arco)
}

/** Lo que devuelve: una experiencia completa como secuencia de escenas. */
export interface NarrativeOutput {
  title: string;
  description: string;
  scenes: Scene[];
}

const TRANSITIONS: SceneTransition[] = ["cut", "fade", "push", "parallax", "zoom"];
const MIN_MS = 2500;
const MAX_MS = 12000;
const DEFAULT_MS = 5000;
const MAX_SCENES = 12;

/**
 * Skill estrella. Toma contenido crudo y lo REINTERPRETA como una historia:
 * gancho → problema → solución → prueba → cierre. No respeta el orden del
 * documento original; reordena para contar la mejor versión, y le pone tipo,
 * duración y transición a cada escena (la sensación de "casi un video").
 */
export const narrativeDirector: Skill<NarrativeInput, NarrativeOutput> = {
  id: "narrative-director",
  name: "Director de narrativa",
  description:
    "Convierte contenido crudo en una secuencia de escenas con arco narrativo, tipo, duración y transición.",
  temperature: 0.6,

  system: `Sos el Director de Narrativa de Escena, una plataforma que transforma documentos estáticos en experiencias interactivas que se sienten como un video que se reproduce solo.
Tomás contenido crudo y lo REINTERPRETÁS como una secuencia de escenas con un arco narrativo claro: gancho → problema → solución → prueba → cierre.
NO respetás el orden original del documento: reordenás para contar la mejor historia y sacar a la luz lo importante (lo bueno suele estar enterrado).
Cada escena es un paso con un tipo, un título (lo que se ve/dice en pantalla), una duración (cuánto se sostiene antes de avanzar) y una transición de entrada.
Respondés SIEMPRE en español rioplatense profesional y SIEMPRE en JSON válido, sin texto fuera del JSON.
Los únicos tipos de escena válidos son: ${BLOCK_TYPES.join(", ")}.
Las únicas transiciones válidas son: ${TRANSITIONS.join(", ")}.`,

  buildPrompt: (input) => `Contenido crudo a reinterpretar:
"""${input.source}"""${input.audience ? `\n\nAudiencia objetivo: ${input.audience}` : ""}

Devolvé JSON con esta forma exacta:
{
  "title": "título corto y comercial de la experiencia",
  "description": "1-2 frases sobre el objetivo de la experiencia",
  "scenes": [
    { "type": "uno de los tipos válidos", "title": "título de la escena", "durationMs": 5000, "transition": "una de las transiciones válidas" }
  ]
}
Reglas:
- Entre 5 y 9 escenas.
- Empezá con un gancho fuerte (típicamente "hero") y cerrá con un llamado a la acción.
- Duración orientativa: 3000-6000 ms para ideas simples; 8000-10000 ms para escenas densas o con datos.
- Elegí la transición según el tono: "fade" elegante, "push"/"parallax" dinámico, "zoom" para énfasis, "cut" para ritmo rápido.
- Usá SOLO tipos y transiciones válidos. No copies el documento: contá una historia.`,

  normalize: (raw) => {
    const list: Scene[] = Array.isArray(raw?.scenes) ? raw.scenes : [];
    const validTypes = BLOCK_TYPES as readonly string[];

    const scenes = list
      .filter((s) => s && validTypes.includes(String(s.type)))
      .slice(0, MAX_SCENES)
      .map((s) => {
        const ms = Number(s.durationMs);
        const transition = TRANSITIONS.includes(s.transition) ? s.transition : "fade";
        return {
          id: newBlockId(),
          type: String(s.type),
          title: String(s.title ?? "").trim() || "Escena",
          durationMs: Number.isFinite(ms)
            ? Math.min(MAX_MS, Math.max(MIN_MS, Math.round(ms)))
            : DEFAULT_MS,
          transition,
        } satisfies Scene;
      });

    return {
      title: String(raw?.title ?? "").trim() || "Experiencia sin título",
      description: String(raw?.description ?? "").trim(),
      scenes,
    };
  },
};
