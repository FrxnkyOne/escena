import type { BlockType } from "./types";

export const BLOCK_DEFS: Record<BlockType, { name: string; desc: string; icon: string }> = {
  hero:     { name: "Hero Section",  desc: "Apertura con mensaje principal",      icon: "◆" },
  video:    { name: "Video",         desc: "Pieza audiovisual destacada",         icon: "▶" },
  timeline: { name: "Timeline",      desc: "Plan en el tiempo, navegable",        icon: "┃" },
  pricing:  { name: "Pricing Plans", desc: "Selección interactiva de planes",     icon: "❖" },
  compare:  { name: "Comparativa",   desc: "Diferencias entre opciones",          icon: "⊞" },
  gallery:  { name: "Galería",       desc: "Casos, piezas y resultados",          icon: "▦" },
  quotes:   { name: "Testimonios",   desc: "Prueba social de clientes",           icon: "❝" },
  form:     { name: "Formulario",    desc: "Captura de datos del cliente",        icon: "✎" },
  sign:     { name: "Firma",         desc: "Firma digital del acuerdo",           icon: "✒" },
  cta:      { name: "CTA",           desc: "Llamado a la acción final",           icon: "→" },
};

export const BLOCK_TYPES = Object.keys(BLOCK_DEFS) as BlockType[];

export const AURAS = [
  "linear-gradient(135deg,#FF6A5B,#FF9D6C,#FFD3A1)",
  "linear-gradient(135deg,#0E6B5C,#1FA98C,#9BE8C9)",
  "linear-gradient(135deg,#2A2ACB,#5E5BFF,#9FD0FF)",
  "linear-gradient(135deg,#8A4B00,#E08A1E,#FFD98A)",
  "linear-gradient(135deg,#5B2A86,#A14DD8,#F0B6FF)",
  "linear-gradient(135deg,#10131F,#27355E,#5E7AC0)",
];

export const randomAura = () => AURAS[Math.floor(Math.random() * AURAS.length)];
export const newBlockId = () =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
