"use client";

import { saveCategory, deleteCategory } from "@/app/admin/actions";
import { EntityForm, RowEditDelete, useEditor } from "./EntityForm";

type C = { id: string; name: string; slug: string; image: string | null; sortOrder: number; count: number };

export function CategoriesClient({ categories }: { categories: C[] }) {
  const { editing, setEditing, close } = useEditor<C>();
  const fields = [
    { name: "name", label: "Category name", required: true },
    { name: "sortOrder", label: "Sort order", type: "number" as const },
    { name: "image", label: "Image URL (optional)", span: 2 as const, placeholder: "https://..." },
  ];
  return (
    <div className="mt-4 grid gap-5 lg:grid-cols-3">
      <div className="card lg:col-span-2">
        <div className="flex items-center justify-between border-b px-4 py-3"><span className="font-bold">{categories.length} categories</span><button className="btn-primary py-1.5" onClick={() => setEditing("new")}>+ Add</button></div>
        <table className="table-base"><thead><tr><th>Name</th><th>Slug</th><th className="text-center">Products</th><th className="text-center">Order</th><th></th></tr></thead>
          <tbody>
            {categories.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-500">No categories yet — e.g. Cheese, Ghee, Paneer, Butter, Milk</td></tr>}
            {categories.map((c) => <tr key={c.id}><td className="font-semibold">{c.name}</td><td className="text-gray-500">{c.slug}</td><td className="text-center">{c.count}</td><td className="text-center">{c.sortOrder}</td><td><RowEditDelete onEdit={() => setEditing(c)} onDelete={() => deleteCategory(c.id)} /></td></tr>)}
          </tbody>
        </table>
      </div>
      {editing && <EntityForm title={editing === "new" ? "New category" : "Edit category"} fields={fields} initial={editing === "new" ? undefined : editing} action={saveCategory} onDone={close} />}
    </div>
  );
}
