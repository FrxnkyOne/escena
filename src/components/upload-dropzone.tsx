"use client";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";

export interface UploadedDoc {
  id: string;
  name: string;
  type: string;
  file_url: string;
}

const EXT_TYPE: Record<string, string> = {
  pdf: "pdf", docx: "docx", pptx: "pptx",
  png: "image", jpg: "image", jpeg: "image", webp: "image",
};
const EXT_COLOR: Record<string, string> = {
  pdf: "#DC2626", docx: "#2563EB", pptx: "#D97706", image: "#16A34A",
};

export function UploadDropzone({
  projectId,
  onUploaded,
  compact,
}: {
  /** Si hay projectId los documentos quedan asociados; si no, solo se suben al storage. */
  projectId?: string;
  onUploaded?: (docs: UploadedDoc[]) => void;
  compact?: boolean;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return toast("Sesión expirada"); }

    const uploaded: UploadedDoc[] = [];
    for (const file of list) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const type = EXT_TYPE[ext];
      if (!type) { toast(`Formato no soportado: ${file.name}`); continue; }

      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
      if (upErr) { toast(`Error subiendo ${file.name}: ${upErr.message}`); continue; }

      let id = path;
      if (projectId) {
        const { data, error } = await supabase
          .from("documents")
          .insert({ project_id: projectId, type, name: file.name, file_url: path })
          .select("id").single();
        if (error) { toast(error.message); continue; }
        id = data.id;
      }
      uploaded.push({ id, name: file.name, type, file_url: path });
    }
    setDocs((d) => [...d, ...uploaded]);
    if (uploaded.length) {
      toast(`${uploaded.length} archivo(s) en Supabase Storage`);
      onUploaded?.(uploaded);
    }
    setBusy(false);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handleFiles(e.dataTransfer.files); }}
        className={`cursor-pointer rounded-card border-[1.5px] border-dashed bg-white text-center transition ${
          over ? "border-brand bg-[#FBFBFF]" : "border-[#C8CAD4] hover:border-brand hover:bg-[#FBFBFF]"
        } ${compact ? "px-4 py-6" : "px-6 py-10"}`}
      >
        <div className={`text-brand ${compact ? "text-lg" : "text-[26px]"}`}>⇪</div>
        <b className={`mt-2 block ${compact ? "text-[13px]" : "text-[15.5px]"}`}>
          {busy ? "Subiendo…" : "Arrastrá archivos aquí, o tocá para elegirlos"}
        </b>
        {!compact && (
          <span className="mt-1 block text-[12.5px] text-muted">
            Se almacenan en Supabase Storage, asociados a tu cuenta.
          </span>
        )}
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {["PDF", "DOCX", "PPTX", "PNG / JPG"].map((f) => (
            <i key={f} className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] not-italic tracking-[0.08em] text-muted">
              {f}
            </i>
          ))}
        </div>
        <input
          ref={inputRef} type="file" multiple hidden
          accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {docs.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {docs.map((d) => (
            <div key={d.id} className="rise flex items-center gap-3 rounded-[13px] border border-line bg-white px-3.5 py-2.5">
              <span className="flex-none rounded-[7px] px-2 py-1.5 font-mono text-[9.5px] font-semibold text-white"
                style={{ background: EXT_COLOR[d.type] ?? "#6B7280" }}>
                {d.type.toUpperCase()}
              </span>
              <b className="min-w-0 flex-1 truncate text-[13.5px]">{d.name}</b>
              <span className="font-mono text-[10.5px] text-green-700">guardado ✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
