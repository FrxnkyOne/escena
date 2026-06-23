import { chatJSON } from "@/lib/ai/llm";
import type { Skill } from "./types";

/**
 * El "cocinero": agarra cualquier ficha de skill y un input, le pasa las
 * instrucciones a la IA (usando el cliente agnóstico ya existente) y devuelve
 * el resultado ya validado. No sabe ni le importa qué skill es: funciona con
 * todos por igual.
 */
export async function runSkill<TInput, TOutput>(
  skill: Skill<TInput, TOutput>,
  input: TInput
): Promise<TOutput> {
  const raw = await chatJSON<TOutput>(
    [
      { role: "system", content: skill.system },
      { role: "user", content: skill.buildPrompt(input) },
    ],
    { temperature: skill.temperature }
  );
  return skill.normalize ? skill.normalize(raw) : raw;
}
