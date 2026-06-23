import { BLOCK_TYPES } from "@/lib/blocks";

const BLOCK_LIST = BLOCK_TYPES.join(", ");

export const SYSTEM_STRATEGIST = `Sos el AI Strategist de Escena, una plataforma para crear experiencias empresariales interactivas (no documentos estáticos).
Actuás como consultor senior: storytelling, conversión, diseño, navegación y experiencia del cliente.
Respondés SIEMPRE en español rioplatense profesional y SIEMPRE en JSON válido, sin texto fuera del JSON.
Los únicos tipos de bloque válidos son: ${BLOCK_LIST}.`;

export function projectFromBriefPrompt(brief: string) {
  return `Brief del usuario: """${brief}"""

Generá la estructura de una experiencia interactiva. Devolvé JSON con esta forma exacta:
{
  "title": "título corto y comercial",
  "description": "1-2 frases sobre el objetivo de la experiencia",
  "blocks": [{ "type": "hero", "title": "Hero Section" }, ...]
}
Reglas: entre 4 y 7 bloques, empezar con "hero", terminar con "cta" o "sign", usar solo tipos válidos.`;
}

export function analyzeProjectPrompt(project: {
  title: string;
  description: string;
  blocks: { type: string; title: string }[];
}) {
  return `Proyecto actual:
Título: ${project.title}
Descripción: ${project.description}
Bloques en orden: ${project.blocks.map((b) => b.type).join(" → ") || "(vacío)"}

Analizá la experiencia como consultor y devolvé JSON:
{
  "score": 0-100,
  "recommendations": [
    { "category": "Conversión|Storytelling|Diseño|Navegación|Experiencia",
      "message": "recomendación concreta y accionable (máx. 200 caracteres)",
      "addBlock": "tipo de bloque a agregar, solo si aplica, de los tipos válidos" }
  ]
}
Entre 2 y 4 recomendaciones. Si la estructura ya es sólida, score alto y menos recomendaciones.`;
}

export function analyzeDocumentsPrompt(docs: { name: string; type: string }[]) {
  return `El usuario subió ${docs.length} documento(s): ${docs
    .map((d) => `${d.name} (${d.type})`)
    .join(", ")}.

A partir de los nombres y tipos, inferí y devolvé JSON:
{
  "summary": { "docType": "...", "objective": "...", "industry": "...", "audience": "..." },
  "blocks": [{ "type": "hero", "title": "..." }, ...],
  "mapping": [{ "from": "sección original inferida", "to": "tipo de bloque", "why": "breve razón" }],
  "recommendations": [{ "category": "...", "message": "...", "addBlock": "tipo opcional" }]
}
Reinterpretá, no copies: convertí secciones estáticas en bloques interactivos (tabla de precios → pricing, portada → hero, etc.).
Si hay varios documentos, combiná su información en UNA sola experiencia sin duplicar bloques.`;
}

export function blueprintFromProjectPrompt(project: {
  title: string;
  description: string;
  blocks: { type: string }[];
}) {
  return `Proyecto: "${project.title}" — ${project.description}
Estructura: ${project.blocks.map((b) => b.type).join(" → ")}

Convertilo en un Blueprint reutilizable. Devolvé JSON:
{ "name": "nombre corto del blueprint", "category": "Conversión|Narrativa|Retención|Relación|Estrategia", "description": "para qué sirve esta estructura (1 frase)" }`;
}

export function generateBlockContentPrompt(blockType: string, context: string) {
  return `Contexto del proyecto: ${context}
Generá el contenido para un bloque de tipo "${blockType}" de una experiencia interactiva.
Devolvé JSON con los campos de texto apropiados para ese bloque (por ejemplo, para "hero": {"headline": "...", "lead": "..."}; para "timeline": {"phases": [{"when": "...", "title": "...", "desc": "..."}]}; para "pricing": {"plans": [{"tier": "...", "name": "...", "features": ["..."]}]}).
Tono: profesional, directo, en español.`;
}
