# Escena — Experiencias, no documentos

Plataforma SaaS para crear experiencias empresariales interactivas impulsadas por IA:
propuestas, pitches, reportes y portales que el cliente navega con un solo enlace,
en lugar de recibir otro PDF estático.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **TailwindCSS** con el sistema de diseño Escena (backstage claro / escenario oscuro)
- **Supabase**: Auth, PostgreSQL con RLS, Storage
- **Capa de IA agnóstica del proveedor** (Qwen / DeepSeek / Llama vía servidor local o propio)
- **Puppeteer** para exportación PDF (dependencia opcional)

## Puesta en marcha

### 1. Crear el proyecto Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Abrí el **SQL Editor** y ejecutá el contenido completo de
   `supabase/migrations/0001_init.sql`. Eso crea:
   - Tablas: `profiles`, `projects`, `blueprints`, `client_spaces`, `documents`,
     `ai_conversations`, `experience_visits` — todas con Row Level Security.
   - Trigger que crea el perfil automáticamente al registrarse.
   - Funciones públicas `get_experience(slug)` y `record_visit(slug, name)` —
     son la **única** vía de acceso anónimo (el cliente final nunca toca las tablas).
   - Bucket de Storage `documents` con políticas por carpeta de usuario.
3. En **Authentication → URL Configuration**, agregá `http://localhost:3000/auth/callback`
   a las Redirect URLs (y tu dominio de producción cuando lo tengas).

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Completá `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(Settings → API en tu proyecto Supabase).

### 3. Conectar el LLM (Qwen, DeepSeek, Llama…)

La app **no está acoplada a ningún proveedor**: habla el protocolo estándar
`POST {LLM_BASE_URL}/chat/completions`, que implementan Ollama, vLLM, LM Studio,
llama.cpp server y la mayoría de los gateways self-hosted.

**Opción A — Ollama (local, lo más simple):**

```bash
ollama pull qwen2.5:14b        # o deepseek-r1:14b, llama3.3
```

```env
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=qwen2.5:14b
```

**Opción B — vLLM (servidor propio / GPU):**

```bash
vllm serve Qwen/Qwen2.5-14B-Instruct --port 8000
```

```env
LLM_BASE_URL=http://localhost:8000/v1
LLM_MODEL=Qwen/Qwen2.5-14B-Instruct
LLM_API_KEY=tu_token_si_lo_exige_el_servidor
```

> Sin LLM configurado la app funciona igual (proyectos, builder, compartir, blueprints
> con metadatos), pero los endpoints de IA responden **503 con un mensaje claro** —
> nunca simulan respuestas.

### 4. Instalar y correr

```bash
npm install
npm run dev          # http://localhost:3000
```

**Exportación PDF:** Puppeteer es dependencia opcional. Si `npm install` no lo trajo
(o lo omitiste con `--omit=optional`), instalalo cuando quieras habilitar el botón:

```bash
npm install puppeteer
```

## Flujo completo

1. **Registro / Login / Recuperación** → Supabase Auth (`/register`, `/login`, `/recover`).
2. **Dashboard** → barra de IA con anillo aurora: describís el objetivo y
   `POST /api/ai/project` genera título, narrativa y bloques, y crea el proyecto.
   También: *Crear desde cero* y *Crear desde archivos existentes*.
3. **Importar** (`/import`) → subís PDF/DOCX/PPTX/imágenes a Supabase Storage;
   `POST /api/ai/analyze` devuelve resumen detectado, mapa de reconstrucción
   (sección estática → bloque interactivo) y recomendaciones; *Transformar en
   Experiencia* crea el proyecto reinterpretado.
4. **Proyecto** (`/projects/[id]`) → constructor modular de 10 tipos de bloque con
   autoguardado, **AI Strategist** real (puntaje + recomendaciones aplicables),
   documentos del proyecto, *Guardar como Blueprint*, *Exportar PDF* y *Compartir*.
5. **Compartir** → `POST /api/experiences` crea el `client_space` con slug único y
   publica el proyecto.
6. **Vista cliente** (`/experience/[slug]`) → sin registro: nombre → entrar →
   experiencia navegable por pasos (la visita queda registrada y aparece en Analytics).
7. **Exportar PDF** → `GET /api/export/pdf?slug=…` renderiza la experiencia con
   Puppeteer (`?print=1` muestra todos los paneles con saltos de página).

## Endpoints de IA

| Endpoint | Función |
|---|---|
| `POST /api/ai/project` | Brief → estructura completa del proyecto (lo inserta en DB) |
| `POST /api/ai/analyze` | `{projectId}` → puntaje + recomendaciones · `{documents}` → reconstrucción de importación |
| `POST /api/ai/generate` | Genera contenido para un bloque y lo persiste en `projects.blocks` |
| `POST /api/ai/blueprint` | La IA nombra/categoriza y guarda el proyecto como Blueprint |

Todas las conversaciones quedan registradas en `ai_conversations`.

## Estructura

```
supabase/migrations/0001_init.sql   esquema completo + RLS + RPCs públicas
middleware.ts                       sesión Supabase + protección de rutas
src/lib/ai/llm.ts                   cliente LLM agnóstico (chat / chatJSON)
src/lib/ai/prompts.ts               prompts del AI Strategist (salida JSON, español)
src/app/api/…                       endpoints de IA, experiencias y PDF
src/app/(auth)/…                    login, registro, recuperación
src/app/(app)/…                     dashboard, proyecto, importar, blueprints, estilos, analytics
src/app/experience/[slug]/          vista cliente pública (gate de nombre)
src/components/…                    builder, strategist, dropzone, renderer de bloques
```
