/**
 * Marco de Skills de Escena — definiciones base.
 *
 * Una "escena" es la columna vertebral de una experiencia: un paso que se
 * reproduce con un tipo, una duración y una transición (se siente como video).
 *
 * Un "skill" es una receta independiente: nombre, instrucciones para la IA y
 * cómo validar lo que devuelve. Sumar capacidades = sumar fichas, sin tocar
 * lo demás.
 */

/** Transiciones de entrada de una escena (el "movimiento de cámara" web). */
export type SceneTransition = "cut" | "fade" | "push" | "parallax" | "zoom";

/** Un paso de la experiencia. Es compatible con los bloques actuales
 *  (id, type, title) y agrega la capa cinematográfica (duración, transición). */
export interface Scene {
  id: string;
  type: string; // un tipo de bloque válido (hero, cta, timeline, ...)
  title: string;
  durationMs: number; // cuánto se sostiene antes de avanzar
  transition: SceneTransition;
  content?: Record<string, unknown>; // lo llenan otros skills (ej. "conversor de impacto")
  narration?: string; // guión de voz en off (lo llena el skill "guionista")
}

/** Una ficha de skill (la receta). TInput = qué recibe · TOutput = qué devuelve. */
export interface Skill<TInput, TOutput> {
  id: string; // identificador único, ej. "narrative-director"
  name: string; // nombre legible
  description: string; // qué hace, en una frase
  temperature?: number; // creatividad (0 = preciso, 1 = libre). Opcional.
  system: string; // instrucciones de sistema para la IA
  buildPrompt: (input: TInput) => string; // arma el pedido concreto
  normalize?: (raw: TOutput) => TOutput; // valida/limpia lo que devuelve la IA
}
