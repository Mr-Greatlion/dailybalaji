"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { toast } from "@/components/ui/Toaster";

type Result = { ok: true; id?: string } | { ok: false; error: string };
type Field = { name: string; label: string; type?: "text" | "number" | "email" | "textarea" | "select"; options?: string[] | { value: string; label: string }[]; required?: boolean; span?: 2; placeholder?: string; upper?: boolean };

export function EntityForm({ fields, initial, action, title, onDone, submitLabel = "Save" }: {
  fields: Field[]; initial?: Record<string, any>; action: (fd: FormData) => Promise<Result>; title: string; onDone?: () => void; submitLabel?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <form
      className="card p-5"
      action={(fd) => start(async () => {
        const r = await action(fd);
        if (r.ok) { toast("Saved"); router.refresh(); onDone?.(); } else toast(r.error, "error");
      })}
    >
      <div className="flex items-center justify-between"><h2 className="font-bold">{title}</h2>{onDone && <button type="button" onClick={onDone} className="btn-ghost px-2"><X className="h-4 w-4" /></button>}</div>
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className={f.span === 2 ? "sm:col-span-2" : ""}>
            <label className="label">{f.label}{f.required ? " *" : ""}</label>
            {f.type === "textarea" ? (
              <textarea name={f.name} rows={2} defaultValue={initial?.[f.name] ?? ""} className="input" placeholder={f.placeholder} />
            ) : f.type === "select" ? (
              <select name={f.name} defaultValue={initial?.[f.name] ?? ""} className="input">
                {(f.options || []).map((o) => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input name={f.name} type={f.type || "text"} required={f.required} defaultValue={initial?.[f.name] ?? ""} className={`input ${f.upper ? "uppercase" : ""}`} placeholder={f.placeholder} step={f.type === "number" ? "any" : undefined} />
            )}
          </div>
        ))}
      </div>
      <button disabled={pending} className="btn-primary mt-4">{pending ? "Saving…" : submitLabel}</button>
    </form>
  );
}

export function RowEditDelete({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => Promise<Result> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex justify-end gap-1">
      <button className="btn-ghost px-2" onClick={onEdit}><Pencil className="h-4 w-4" /></button>
      <button disabled={pending} className="btn-ghost px-2 text-red-600" onClick={() => { if (!confirm("Delete?")) return; start(async () => { const r = await onDelete(); toast(r.ok ? "Deleted" : r.error, r.ok ? "success" : "error"); router.refresh(); }); }}><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

export function useEditor<T extends { id: string }>() {
  const [editing, setEditing] = useState<T | null | "new">(null);
  return { editing, setEditing, close: () => setEditing(null) };
}
