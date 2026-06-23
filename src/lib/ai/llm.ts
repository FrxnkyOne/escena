/**
 * Cliente LLM agnóstico del proveedor.
 *
 * Habla el protocolo estándar `POST {base}/chat/completions`, que implementan
 * Ollama, vLLM, LM Studio, llama.cpp server y la mayoría de los gateways
 * self-hosted. Eso permite conectar Qwen, DeepSeek o Llama en local o en un
 * servidor propio sin acoplar la app a ningún proveedor comercial.
 *
 * Configuración por variables de entorno:
 *   LLM_BASE_URL  p. ej. http://localhost:11434/v1
 *   LLM_MODEL     p. ej. qwen2.5:14b · deepseek-r1:14b · llama3.3:70b
 *   LLM_API_KEY   opcional (solo si el servidor exige token)
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class LLMNotConfiguredError extends Error {
  constructor() {
    super(
      "LLM no configurado. Definí LLM_BASE_URL y LLM_MODEL en .env.local " +
        "(por ejemplo, Ollama con Qwen: LLM_BASE_URL=http://localhost:11434/v1, LLM_MODEL=qwen2.5:14b)."
    );
    this.name = "LLMNotConfiguredError";
  }
}

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  /** Pide al servidor salida JSON si lo soporta. */
  json?: boolean;
}

export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const base = process.env.LLM_BASE_URL?.replace(/\/$/, "");
  const model = process.env.LLM_MODEL;
  if (!base || !model) throw new LLMNotConfiguredError();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.LLM_API_KEY) headers.Authorization = `Bearer ${process.env.LLM_API_KEY}`;

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2048,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`El servidor LLM respondió ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Respuesta del LLM sin contenido utilizable.");
  }
  return content;
}

/** Llama al modelo y parsea JSON de forma tolerante (quita fences ```json). */
export async function chatJSON<T>(messages: ChatMessage[], opts: ChatOptions = {}): Promise<T> {
  const raw = await chat(messages, { ...opts, json: true, temperature: opts.temperature ?? 0.4 });
  const clean = raw
    .replace(/^[\s\S]*?```(?:json)?/i, (m) => (raw.trim().startsWith("```") ? "" : m))
    .replace(/```[\s\S]*$/, "")
    .trim();
  const candidate = clean.startsWith("{") || clean.startsWith("[") ? clean : extractJSON(raw);
  return JSON.parse(candidate) as T;
}

function extractJSON(text: string): string {
  const start = text.search(/[{[]/);
  if (start === -1) throw new Error("El modelo no devolvió JSON.");
  return text.slice(start).replace(/```[\s\S]*$/, "").trim();
}
