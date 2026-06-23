import type { Skill } from "./types";

/** Referencia mínima de una escena para guionar. */
export interface ScriptSceneRef {
  index: number;
  type: string;
  title: string;
}

export interface ScriptInput {
  title: string;
  description: string;
  audience?: string;
  scenes: ScriptSceneRef[];
}

/** Contenido escrito para una escena, identificado por su índice. */
export interface ScriptedScene {
  index: number;
  content: Record<string, unknown>;
}

export interface ScriptOutput {
  scenes: ScriptedScene[];
}

/**
 * Segundo skill. Recibe una experiencia ya estructurada por el Director y
 * escribe el CONTENIDO real de cada escena (titulares, bajadas, testimonios,
 * fases, planes, cierre), en el formato exacto que el visor de Escena entiende.
 */
export const scriptwriter: Skill<ScriptInput, ScriptOutput> = {
  id: "scriptwriter",
  name: "Guionista",
  description:
    "Escribe el contenido real de cada escena (textos, testimonios, fases, planes) en el formato que la app sabe mostrar.",
  temperature: 0.7,

  system: `Sos el Guionista de Escena. Recibís una experiencia ya estructurada en escenas y escribís el CONTENIDO real que va dentro de cada una.
Escribís con tono profesional y persuasivo, en español rioplatense, usando la información del contexto del cliente.
Si falta un dato concreto, escribís contenido plausible y específico al rubro, pero NUNCA inventás cifras falsas ni nombres de clientes reales.
Respondés SIEMPRE en JSON válido, sin texto fuera del JSON.
El contenido de cada escena depende de su tipo, con este formato EXACTO:
- hero: { "headline": "titular potente", "lead": "bajada de 1-2 frases" }
- timeline: { "phases": [{ "when": "etapa/fechas", "title": "nombre", "desc": "qué pasa" }] }
- pricing: { "plans": [{ "tier": "etiqueta", "name": "nombre del plan", "features": ["...", "..."] }] }
- quotes: { "items": [{ "quote": "testimonio", "author": "nombre", "role": "cargo" }] }
- compare: { "columns": ["col1", "col2"], "rows": [{ "label": "fila", "values": ["...", "..."] }] }
- cta: { "headline": "cierre", "body": "1-2 frases", "button": "texto del botón" }
- video, gallery, form, sign: { } (sin contenido de texto)`,

  buildPrompt: (input) => `Experiencia: "${input.title}" — ${input.description}
${input.audience ? `Audiencia: ${input.audience}\n` : ""}
Escenas (en orden):
${input.scenes.map((s) => `${s.index}. [${s.type}] ${s.title}`).join("\n")}

Devolvé JSON con esta forma exacta:
{ "scenes": [ { "index": 0, "content": { ...campos según el tipo de esa escena... } } ] }

Reglas:
- Incluí una entrada por CADA escena, respetando su mismo "index".
- Usá el formato de contenido correcto según el tipo de cada escena.
- Para escenas de tipo video, gallery, form o sign, devolvé "content": {}.
- Coherencia: todas las escenas cuentan la misma historia, sin repetir ideas.`,

  normalize: (raw) => {
    const list = Array.isArray(raw?.scenes) ? raw.scenes : [];
    const scenes = list
      .filter(
        (s) =>
          s &&
          Number.isInteger(Number(s.index)) &&
          s.content !== null &&
          typeof s.content === "object"
      )
      .map((s) => ({
        index: Number(s.index),
        content: s.content as Record<string, unknown>,
      }));
    return { scenes };
  },
};
