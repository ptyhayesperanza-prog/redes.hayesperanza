"use client";

import { useState } from "react";
import { crearReporteSemanal } from "./actions";

type Miembro = { id: string; nombre: string; telefono: string | null };
type Material = { id: string; titulo: string };

const inputClass =
  "rounded-lg border bg-transparent px-3 py-2 outline-none focus:ring-2 w-full";
const inputStyle = { borderColor: "var(--surface-border)" };

export function ReporteForm({
  roster,
  materiales,
  semana,
}: {
  roster: Miembro[];
  materiales: Material[];
  semana: { inicio: string; fin: string };
}) {
  const [nuevos, setNuevos] = useState<string[]>([""]);
  const [enviando, setEnviando] = useState(false);

  function actualizarNuevo(i: number, valor: string) {
    setNuevos((prev) => prev.map((v, idx) => (idx === i ? valor : v)));
  }

  function agregarNuevo() {
    setNuevos((prev) => [...prev, ""]);
  }

  function quitarNuevo(i: number) {
    setNuevos((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <form
      action={crearReporteSemanal}
      onSubmit={() => setEnviando(true)}
      className="flex flex-col gap-8"
    >
      <section className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="semana_inicio" className="text-sm opacity-80">
            Semana — inicio
          </label>
          <input
            id="semana_inicio"
            name="semana_inicio"
            type="date"
            required
            defaultValue={semana.inicio}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="semana_fin" className="text-sm opacity-80">
            Semana — fin
          </label>
          <input
            id="semana_fin"
            name="semana_fin"
            type="date"
            required
            defaultValue={semana.fin}
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-[family-name:var(--font-fraunces)] text-lg">
          Asistencia — roster ({roster.length})
        </h2>
        {roster.length === 0 ? (
          <p className="text-sm opacity-70">
            Esta red todavía no tiene miembros en su roster.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {roster.map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`asistio-${m.id}`}
                  name="asistio"
                  value={m.id}
                  className="h-4 w-4"
                />
                <label htmlFor={`asistio-${m.id}`} className="text-sm">
                  {m.nombre}
                  {m.telefono && (
                    <span className="ml-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs opacity-60">
                      {m.telefono}
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs opacity-60">
          Los que no marques quedan como &quot;faltaron&quot; automáticamente.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-[family-name:var(--font-fraunces)] text-lg">
          Visitas / nuevos
        </h2>
        <div className="flex flex-col gap-2">
          {nuevos.map((valor, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                name="nuevo_nombre"
                placeholder="Nombre de la visita"
                value={valor}
                onChange={(e) => actualizarNuevo(i, e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
              {nuevos.length > 1 && (
                <button
                  type="button"
                  onClick={() => quitarNuevo(i)}
                  className="px-2 text-sm opacity-60 hover:opacity-100"
                  aria-label="Quitar"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={agregarNuevo}
          className="mt-2 text-sm underline opacity-80"
        >
          + agregar otra visita
        </button>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="se_congregan" className="text-sm opacity-80">
            Se congregan (servicio principal)
          </label>
          <input
            id="se_congregan"
            name="se_congregan"
            type="number"
            min={0}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ofrenda" className="text-sm opacity-80">
            Ofrenda ($)
          </label>
          <input
            id="ofrenda"
            name="ofrenda"
            type="number"
            min={0}
            step="0.01"
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="material_id" className="text-sm opacity-80">
            Material de estudio
          </label>
          <select id="material_id" name="material_id" className={inputClass} style={inputStyle}>
            <option value="">— Selecciona —</option>
            {materiales.map((m) => (
              <option key={m.id} value={m.id}>
                {m.titulo}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="capitulo_actual" className="text-sm opacity-80">
            Capítulo actual
          </label>
          <input
            id="capitulo_actual"
            name="capitulo_actual"
            type="number"
            min={1}
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </section>

      <div className="flex flex-col gap-1">
        <label htmlFor="discipulados" className="text-sm opacity-80">
          Discipulados (llamadas, visitas de la semana)
        </label>
        <textarea
          id="discipulados"
          name="discipulados"
          rows={3}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="comentario_lider" className="text-sm opacity-80">
          Comentario del líder
        </label>
        <textarea
          id="comentario_lider"
          name="comentario_lider"
          rows={3}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg px-4 py-3 font-medium text-[var(--accent-foreground)] disabled:opacity-60"
        style={{ background: "var(--accent)" }}
      >
        {enviando ? "Guardando..." : "Enviar reporte"}
      </button>
    </form>
  );
}
