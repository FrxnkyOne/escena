export type BlockType =
  | "hero" | "video" | "timeline" | "pricing" | "compare"
  | "gallery" | "quotes" | "form" | "sign" | "cta";

export interface Block {
  id: string;
  type: BlockType;
  title: string;
  /** Contenido generado o editado; cada tipo interpreta sus campos. */
  content?: Record<string, unknown>;
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  client_name: string;
  status: "draft" | "live" | "archived";
  aura: string;
  blocks: Block[];
  created_at: string;
  updated_at: string;
}

export interface Blueprint {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  configuration: { description?: string; blocks: Block[]; aura?: string };
  created_at: string;
}

export interface ClientSpace {
  id: string;
  project_id: string;
  slug: string;
  access_token: string;
}

export interface StrategistRec {
  category: string;
  message: string;
  addBlock?: BlockType;
}
