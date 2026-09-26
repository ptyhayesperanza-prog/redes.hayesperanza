"use client";

import { startTransition, useActionState, useState } from "react";
import { crearReporteSemanal } from "./actions";
import { MiembroRow, type Miembro } from "./MiembroRow";
import { MemberProfileModal } from "./MemberProfileModal";

type Material = { id: string; titulo: string };

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
  const [estado, formAction, enviando] = useActionState(crearReporteSemanal, { error: null });

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
        // No se usa action={formAction}: React 19 resetea el formulario al
        // terminar la acción, y si el guardado falla el líder perdería
        // todas las marcas del roster. Así el formulario queda intacto.
        onSubmit={(e) => {
          e.preventDefault();
          const datos = new FormData(e.currentTarget);
          startTransition(() => formAction(datos));
        }}
        className="kpi-card"
      >
        <div className="scope">
          <strong>{red.dia_reunion ?? "Día no definido"}</strong>
          <br />
          {red.horario ?? "Hora no definida"}
          {red.direccion ? ` — ${red.direccion}` : ""}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={diaHabitual}
            onChange={(e) => setDiaHabitual(e.target.checked)}
            style={{ width: "16px", height: "16px" }}
          />
          La red se reunió en su día y hora habitual
        </label>
        <input type="hidden" name="dia_habitual" value={diaHabitual ? "true" : "false"} />

        {!diaHabitual && (
          <div className="form-grid">
            <label>
              Fecha real
              <input id="fecha_reunion" name="fecha_reunion" type="date" />
            </label>
            <label>
              Hora real
              <input id="hora_reunion" name="hora_reunion" type="text" placeholder="7:00 PM" />
            </label>
          </div>
        )}

        <div className="form-grid">
          <label>
            Semana — inicio
            <input name="semana_inicio" type="date" required defaultValue={semana.inicio} />
          </label>
          <label>
            Semana — fin
            <input name="semana_fin" type="date" required defaultValue={semana.fin} />
          </label>
        </div>

        <div className="toolbar attendance-title">
          <h3>Roster ({roster.length})</h3>
        </div>
        {roster.length === 0 ? (
          <p className="intro">Esta red todavía no tiene miembros en su roster.</p>
        ) : (
          <div className="attendance-list">
            {roster.map((m) => (
              <MiembroRow key={m.id} miembro={m} onVerPerfil={setPerfilAbierto} />
            ))}
          </div>
        )}
        <p className="intro">
          Los que no marques &quot;asistió&quot; quedan como &quot;faltaron&quot; automáticamente.
        </p>

        <h3>Visitas / nuevos</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
          {nuevos.map((n, i) => (
            <div key={i} style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                name="nuevo_nombre"
                placeholder="Nombre de la visita"
                value={n.nombre}
                onChange={(e) => actualizarNuevo(i, "nombre", e.target.value)}
              />
              <select
                name="nuevo_invitado_por"
                value={n.invitadoPor}
                onChange={(e) => actualizarNuevo(i, "invitadoPor", e.target.value)}
                style={{ maxWidth: "12rem" }}
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
                  className="btn-view secondary"
                  onClick={() => quitarNuevo(i)}
                  aria-label="Quitar"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={agregarNuevo} className="btn-view secondary" style={{ marginTop: "12px" }}>
          + agregar otra visita
        </button>

        <h3 style={{ marginTop: "28px" }}>Ofrenda</h3>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 400 }}>
          <input
            type="checkbox"
            name="se_recogio_ofrenda"
            checked={huboOfrenda}
            onChange={(e) => setHuboOfrenda(e.target.checked)}
            style={{ width: "16px", height: "16px" }}
          />
          Se recogió ofrenda esta semana
        </label>
        {huboOfrenda && (
          <label>
            Monto total ($)
            <input name="ofrenda" type="number" min={0} step="0.01" />
          </label>
        )}

        <div className="form-grid" style={{ marginTop: "20px" }}>
          <label>
            Material de estudio
            <select name="material_id" defaultValue="">
              <option value="">— Selecciona —</option>
              {materiales.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.titulo}
                </option>
              ))}
            </select>
          </label>
          <label>
            Capítulo actual
            <input name="capitulo_actual" type="number" min={1} />
          </label>
        </div>

        <label>
          Discipulados — nota general de la semana (opcional)
          <textarea name="discipulados" rows={2} />
        </label>

        <label>
          Comentario del líder — nota general de la semana (opcional)
          <textarea name="comentario_lider" rows={2} />
        </label>

        <h3 style={{ marginTop: "8px" }}>Peticiones de oración</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
          {peticiones.map((p, i) => (
            <div key={i} className="attendance-card">
              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  value={p.miembroId}
                  onChange={(e) => actualizarPeticion(i, "miembroId", e.target.value)}
                >
                  <option value="">Persona fuera del roster</option>
                  {roster.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-view secondary"
                  onClick={() => quitarPeticion(i)}
                  aria-label="Quitar"
                >
                  ✕
                </button>
              </div>
              {!p.miembroId && (
                <input
                  type="text"
                  placeholder="Nombre (si no está en el roster)"
                  value={p.nombreOtro}
                  onChange={(e) => actualizarPeticion(i, "nombreOtro", e.target.value)}
                />
              )}
              <textarea
                placeholder="¿Por qué pidió oración? (máx. 200 caracteres)"
                maxLength={200}
                rows={2}
                value={p.descripcion}
                onChange={(e) => actualizarPeticion(i, "descripcion", e.target.value)}
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
          className="btn-view secondary"
          style={{ marginTop: "12px" }}
        >
          + agregar petición de oración
        </button>

        {estado.error && (
          <p className="mensaje error" role="alert" style={{ marginTop: "20px" }}>
            {estado.error}
          </p>
        )}

        <button type="submit" disabled={enviando} className="btn-view" style={{ marginTop: "28px" }}>
          {enviando ? "Guardando..." : "Enviar reporte"}
        </button>
      </form>

      {perfilAbierto && (
        <MemberProfileModal miembro={perfilAbierto} onClose={() => setPerfilAbierto(null)} />
      )}
    </>
  );
}
