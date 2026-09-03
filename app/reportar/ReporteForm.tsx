"use client";

import { useState } from "react";
import { crearReporteSemanal } from "./actions";
import { MiembroRow, type Miembro } from "./MiembroRow";
import { MemberProfileModal } from "./MemberProfileModal";

type Material = { id: string; titulo: string };

const inputClass =
  "rounded-lg border bg-transparent px-3 py-2 outline-none focus:ring-2 w-full";
const inputStyle = { borderColor: "var(--surface-border)" };

export function ReporteForm({
  red,
  roster,
  materiales,
  semana,
}: {
  red: { nombre: string; dia_reunion: string | null; horario: string | null; direccion: string | null };
  roster: Miembro[];
  materiales: Material[];
  semana: { inicio: string; fin: string };
}) {
  const [diaHabitual, setDiaHabitual] = useState(true);
  const [huboOfrenda, setHuboOfrenda] = useState(false);
  const [nuevos, setNuevos] = useState<{ nombre: string; invitadoPor: string }[]>([
    { nombre: "", invitadoPor: "" },
  ]);
  const [peticiones, setPeticiones] = useState<
    { miembroId: string; nombreOtro: string; descripcion: string }[]
  >([]);
  const [perfilAbierto, setPerfilAbierto] = useState<Miembro | null>(null);
  const [enviando, setEnviando] = useState(false);

  function agregarNuevo() {
    setNuevos((prev) => [...prev, { nombre: "", invitadoPor: "" }]);
  }
  function quitarNuevo(i: number) {
    setNuevos((prev) => prev.filter((_, idx) => idx !== i));
  }
  function actualizarNuevo(i: number, campo: "nombre" | "invitadoPor", valor: string) {
    setNuevos((prev) => prev.map((n, idx) => (idx === i ? { ...n, [campo]: valor } : n)));
  }

  function agregarPeticion() {
    setPeticiones((prev) => [...prev, { miembroId: "", nombreOtro: "", descripcion: "" }]);
  }
  function quitarPeticion(i: number) {
    setPeticiones((prev) => prev.filter((_, idx) => idx !== i));
  }
  function actualizarPeticion(
    i: number,
    campo: "miembroId" | "nombreOtro" | "descripcion",
    valor: string,
  ) {
    setPeticiones((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  }

  return (
    <>
      <form
        action={crearReporteSemanal}
        onSubmit={() => setEnviando(true)}
        className="flex flex-col gap-8"
      >
        <section
          className="rounded-xl border p-4 text-sm"
          style={{ borderColor: "var(--surface-border)", background: "var(--surface)" }}
        >
          <p className="font-medium">{red.dia_reunion ?? "Día no definido"}</p>
          <p className="opacity-70">
            {red.horario ?? "Hora no definida"}
            {red.direccion ? ` — ${red.direccion}` : ""}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={diaHabitual}
              onChange={(e) => setDiaHabitual(e.target.checked)}
              className="h-4 w-4"
            />
            La red se reunió en su día y hora habitual
          </label>
          <input type="hidden" name="dia_habitual" value={diaHabitual ? "true" : "false"} />

          {!diaHabitual && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="fecha_reunion" className="text-sm opacity-80">
                  Fecha real
                </label>
                <input
                  id="fecha_reunion"
                  name="fecha_reunion"
                  type="date"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="hora_reunion" className="text-sm opacity-80">
                  Hora real
                </label>
                <input
                  id="hora_reunion"
                  name="hora_reunion"
                  type="text"
                  placeholder="7:00 PM"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-fraunces)] text-lg">
            Roster ({roster.length})
          </h2>
          {roster.length === 0 ? (
            <p className="text-sm opacity-70">Esta red todavía no tiene miembros en su roster.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {roster.map((m) => (
                <MiembroRow key={m.id} miembro={m} onVerPerfil={setPerfilAbierto} />
              ))}
            </div>
          )}
          <p className="mt-2 text-xs opacity-60">
            Los que no marques &quot;asistió&quot; quedan como &quot;faltaron&quot; automáticamente.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-fraunces)] text-lg">
            Visitas / nuevos
          </h2>
          <div className="flex flex-col gap-2">
            {nuevos.map((n, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  name="nuevo_nombre"
                  placeholder="Nombre de la visita"
                  value={n.nombre}
                  onChange={(e) => actualizarNuevo(i, "nombre", e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
                <select
                  name="nuevo_invitado_por"
                  value={n.invitadoPor}
                  onChange={(e) => actualizarNuevo(i, "invitadoPor", e.target.value)}
                  className={inputClass}
                  style={{ ...inputStyle, maxWidth: "12rem" }}
                >
                  <option value="">¿Quién la invitó?</option>
                  {roster.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
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
          <button type="button" onClick={agregarNuevo} className="mt-2 text-sm underline opacity-80">
            + agregar otra visita
          </button>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-[family-name:var(--font-fraunces)] text-lg">Ofrenda</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="se_recogio_ofrenda"
              checked={huboOfrenda}
              onChange={(e) => setHuboOfrenda(e.target.checked)}
              className="h-4 w-4"
            />
            Se recogió ofrenda esta semana
          </label>
          {huboOfrenda && (
            <div className="flex flex-col gap-1">
              <label htmlFor="ofrenda" className="text-sm opacity-80">
                Monto total ($)
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
          )}
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
            Discipulados — nota general de la semana (opcional)
          </label>
          <textarea
            id="discipulados"
            name="discipulados"
            rows={2}
            className={inputClass}
            style={inputStyle}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="comentario_lider" className="text-sm opacity-80">
            Comentario del líder — nota general de la semana (opcional)
          </label>
          <textarea
            id="comentario_lider"
            name="comentario_lider"
            rows={2}
            className={inputClass}
            style={inputStyle}
          />
        </div>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-fraunces)] text-lg">
            Peticiones de oración
          </h2>
          <div className="flex flex-col gap-2">
            {peticiones.map((p, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-xl border p-3" style={inputStyle}>
                <div className="flex gap-2">
                  <select
                    value={p.miembroId}
                    onChange={(e) => actualizarPeticion(i, "miembroId", e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value="">Persona fuera del roster</option>
                    {roster.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                  {peticiones.length > 0 && (
                    <button
                      type="button"
                      onClick={() => quitarPeticion(i)}
                      className="px-2 text-sm opacity-60 hover:opacity-100"
                      aria-label="Quitar"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {!p.miembroId && (
                  <input
                    type="text"
                    placeholder="Nombre (si no está en el roster)"
                    value={p.nombreOtro}
                    onChange={(e) => actualizarPeticion(i, "nombreOtro", e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  />
                )}
                <textarea
                  placeholder="¿Por qué pidió oración? (máx. 200 caracteres)"
                  maxLength={200}
                  rows={2}
                  value={p.descripcion}
                  onChange={(e) => actualizarPeticion(i, "descripcion", e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
                <input type="hidden" name="peticion_miembro_id" value={p.miembroId} />
                <input type="hidden" name="peticion_nombre_otro" value={p.nombreOtro} />
                <input type="hidden" name="peticion_descripcion" value={p.descripcion} />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={agregarPeticion}
            className="mt-2 text-sm underline opacity-80"
          >
            + agregar petición de oración
          </button>
        </section>

        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg px-4 py-3 font-medium text-[var(--accent-foreground)] disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {enviando ? "Guardando..." : "Enviar reporte"}
        </button>
      </form>

      {perfilAbierto && (
        <MemberProfileModal miembro={perfilAbierto} onClose={() => setPerfilAbierto(null)} />
      )}
    </>
  );
}
