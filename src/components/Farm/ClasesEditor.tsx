"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSPASassClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/Common/ConfirmProvider";
import {
  type ClaseCultivo,
  createClase,
  deleteClase,
  updateClase,
} from "@/lib/farm/clases";

interface ClasesEditorProps {
  initialClases: ClaseCultivo[];
}

type Banner = { kind: "success" | "error"; text: string } | null;

export default function ClasesEditor({ initialClases }: ClasesEditorProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [clases, setClases] = useState<ClaseCultivo[]>(initialClases);
  const [banner, setBanner] = useState<Banner>(null);
  const [isPending, startTransition] = useTransition();

  // Add form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  function showBanner(banner: Banner) {
    setBanner(banner);
    if (banner) setTimeout(() => setBanner(null), 3500);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const nombre = newName.trim();
    if (!nombre) {
      showBanner({ kind: "error", text: "Ingresa un nombre para la clase." });
      return;
    }

    const client = createSPASassClient().getSupabaseClient();
    try {
      const created = await createClase(client, { nombre, descripcion: newDesc });
      setClases((prev) =>
        [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      setNewName("");
      setNewDesc("");
      showBanner({ kind: "success", text: `Clase "${created.nombre}" agregada.` });
      startTransition(() => router.refresh());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al agregar la clase";
      showBanner({ kind: "error", text: msg });
    }
  }

  function startEdit(c: ClaseCultivo) {
    setEditingId(c.id);
    setEditName(c.nombre);
    setEditDesc(c.descripcion ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDesc("");
  }

  async function handleSaveEdit(id: string) {
    const nombre = editName.trim();
    if (!nombre) {
      showBanner({ kind: "error", text: "El nombre no puede estar vacío." });
      return;
    }
    const client = createSPASassClient().getSupabaseClient();
    try {
      const updated = await updateClase(client, id, { nombre, descripcion: editDesc });
      setClases((prev) =>
        prev
          .map((c) => (c.id === id ? updated : c))
          .sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      cancelEdit();
      showBanner({ kind: "success", text: "Cambios guardados." });
      startTransition(() => router.refresh());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      showBanner({ kind: "error", text: msg });
    }
  }

  async function handleDelete(c: ClaseCultivo) {
    await confirm({
      title: `Eliminar "${c.nombre}"`,
      description:
        "Esto también eliminará las actividades asociadas a esta clase. Las variedades con este tipo de cultivo conservarán la etiqueta. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      tone: "danger",
      onConfirm: async () => {
        const client = createSPASassClient().getSupabaseClient();
        try {
          await deleteClase(client, c.id);
          setClases((prev) => prev.filter((x) => x.id !== c.id));
          showBanner({ kind: "success", text: `"${c.nombre}" eliminada.` });
          startTransition(() => router.refresh());
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error al eliminar";
          showBanner({ kind: "error", text: msg });
          // Re-throw so the dialog keeps the user on the confirm screen and
          // they can retry. The banner makes the failure visible behind it.
          throw err;
        }
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      {banner && (
        <div
          role="status"
          className={[
            "rounded-lg border px-4 py-3 text-sm",
            banner.kind === "success"
              ? "border-primary-100 bg-primary-100/50 text-primary-600 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
          ].join(" ")}
        >
          {banner.text}
        </div>
      )}

      {/* Add form */}
      <section className="rounded-xl border border-stroke bg-white p-5 dark:border-strokedark dark:bg-dark">
        <h2 className="mb-3 text-base font-semibold text-black dark:text-white">
          Agregar nueva clase
        </h2>
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="newName"
              className="mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark"
            >
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="newName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="HORTENSIA"
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white"
              autoComplete="off"
            />
          </div>
          <div className="flex-[1.5]">
            <label
              htmlFor="newDesc"
              className="mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark"
            >
              Descripción
            </label>
            <input
              id="newDesc"
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Hortensia — Hydrangea"
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            + Agregar
          </button>
        </form>
        <p className="mt-2 text-xs text-body-color/70 dark:text-body-color-dark/60">
          El nombre se guarda en mayúsculas.
        </p>
      </section>

      {/* List */}
      <section className="rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-dark">
        <div className="flex items-center justify-between border-b border-stroke px-5 py-4 dark:border-strokedark">
          <h2 className="text-base font-semibold text-black dark:text-white">
            Clases existentes
          </h2>
          <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary dark:bg-primary-500/15 dark:text-primary-300">
            {clases.length}
          </span>
        </div>

        {clases.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-body-color dark:text-body-color-dark">
              Aún no tienes clases de cultivo. Agrega la primera arriba.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stroke dark:divide-strokedark">
            {clases.map((c) => {
              const isEditing = editingId === c.id;
              return (
                <li key={c.id} className="px-5 py-4">
                  {isEditing ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white"
                        />
                      </div>
                      <div className="flex-[1.5]">
                        <label className="mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark">
                          Descripción
                        </label>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-dark dark:text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(c.id)}
                          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-600"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-body-color hover:bg-gray-100 dark:border-strokedark dark:text-body-color-dark dark:hover:bg-white/5"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-black dark:text-white">
                          {c.nombre}
                        </p>
                        {c.descripcion && (
                          <p className="mt-0.5 truncate text-sm text-body-color dark:text-body-color-dark">
                            {c.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-body-color hover:border-primary/40 hover:text-primary dark:border-strokedark dark:text-body-color-dark dark:hover:border-primary/30 dark:hover:text-primary-300"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
