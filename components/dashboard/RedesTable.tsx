"use client";

import { dinero } from "@/lib/formato";
import { Fragment, useMemo, useState } from "react";
import { RedDetalleModal } from "./RedDetalleModal";
import type { RedConMetricas } from "@/lib/dashboard/redesConMetricas";

type MentorInfo = { nombre: string; colorHex: string };

export function RedesTable({
  redes,
  mentorInfoPorId,
}: {
  redes: RedConMetricas[];
  /** Si se pasa, la tabla se agrupa por mentoría con una banda de color por grupo (vista pastor/admin). */
  mentorInfoPorId?: Record<string, MentorInfo>;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [detalleAbierto, setDetalleAbierto] = useState<{ reporteId: string; liderLabel: string } | null>(
    null,
  );

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase("es");
    if (!q) return redes;
    return redes.filter((r) => `${r.nombre} ${r.liderLabel}`.toLocaleLowerCase("es").includes(q));
  }, [redes, busqueda]);

  function abrirDetalle(red: RedConMetricas) {
    if (!red.ultimoReporte) return;
    setDetalleAbierto({ reporteId: red.ultimoReporte.id, liderLabel: red.liderLabel });
  }

  function fila(red: RedConMetricas) {
    const u = red.ultimoReporte;
    return (
      <tr key={red.id}>
        <td>
          <div className="red-name">{red.nombre}</div>
          <div className="red-leader">{red.liderLabel}</div>
        </td>
        <td>{u ? u.totalMiembros : "—"}</td>
        <td>{u ? u.asistieron : "—"}</td>
        <td>{u ? u.visitas : "—"}</td>
        <td>{u ? dinero(u.ofrenda) : "—"}</td>
        <td>
          <button
            className="btn-view"
            type="button"
            disabled={!u}
            onClick={() => abrirDetalle(red)}
          >
            {u ? "Ver detalles" : "Sin informes"}
          </button>
        </td>
      </tr>
    );
  }

  const grupos = useMemo(() => {
    if (!mentorInfoPorId) return null;
    const porMentor = new Map<string, RedConMetricas[]>();
    filtradas.forEach((r) => {
      const key = r.mentorId ?? "sin-mentor";
      const lista = porMentor.get(key) ?? [];
      lista.push(r);
      porMentor.set(key, lista);
    });
    return Array.from(porMentor.entries()).map(([mentorId, redesDelGrupo], i) => ({
      mentorId,
      numero: i + 1,
      info: mentorInfoPorId[mentorId] ?? { nombre: "Sin mentoría asignada", colorHex: "#9CA3AF" },
      redes: redesDelGrupo,
    }));
  }, [filtradas, mentorInfoPorId]);

  return (
    <>
      <div className="toolbar">
        <h3>{mentorInfoPorId ? "Todas las redes" : "Mis redes"}</h3>
        <label htmlFor="buscar-red" className="red-leader">
          Buscar red o líder{" "}
          <input
            id="buscar-red"
            type="search"
            placeholder="Ej. Red 002 o el nombre del líder"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </label>
      </div>

      {filtradas.length === 0 ? (
        <p className="empty">No hay redes que coincidan con tu búsqueda.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Red / Líder</th>
                <th>Miembros</th>
                <th>Asistencia</th>
                <th>Visitas</th>
                <th>Ofrenda</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {grupos
                ? grupos.map((g) => (
                    <Fragment key={g.mentorId}>
                      <tr className="mentor-row">
                        <td colSpan={6} style={{ backgroundColor: g.info.colorHex }}>
                          {g.numero}. MENTORÍA: {g.info.nombre.toUpperCase()}
                        </td>
                      </tr>
                      {g.redes.map(fila)}
                      <tr className="spacer-row">
                        <td colSpan={6} />
                      </tr>
                    </Fragment>
                  ))
                : filtradas.map(fila)}
            </tbody>
          </table>
        </div>
      )}

      {detalleAbierto && (
        <RedDetalleModal
          reporteId={detalleAbierto.reporteId}
          liderLabel={detalleAbierto.liderLabel}
          onClose={() => setDetalleAbierto(null)}
        />
      )}
    </>
  );
}
