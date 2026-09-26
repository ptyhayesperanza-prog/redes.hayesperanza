"use client";

import { Fragment, useState } from "react";
import { RedDetalleModal } from "./RedDetalleModal";
import { KpiCard } from "./KpiCard";
import type { RedConMetricas } from "@/lib/dashboard/redesConMetricas";
import { dinero, porcentaje } from "@/lib/formato";

type MentorInfo = { nombre: string; colorHex: string };

function Progreso({ valor }: { valor: number }) {
  return (
    <>
      <div className="attendance-label">
        <span>{valor}%</span>
      </div>
      <div className="progress" role="img" aria-label={`${valor}% de participación`}>
        <span style={{ width: `${Math.min(valor, 100)}%` }} />
      </div>
    </>
  );
}

/**
 * Informe consolidado (diseño del commit 019c886): una fila por red con los
 * datos de su último reporte. Con `mentorInfoPorId` se agrupa por mentoría
 * (vista pastor/admin); sin él es la vista de una sola mentoría.
 */
export function InformeGeneral({
  redes,
  mentorInfoPorId,
}: {
  redes: RedConMetricas[];
  mentorInfoPorId?: Record<string, MentorInfo>;
}) {
  const [abierto, setAbierto] = useState<{ reporteId: string; liderLabel: string } | null>(null);

  const conReporte = redes.filter((r) => r.ultimoReporte);
  const suma = (f: (u: NonNullable<RedConMetricas["ultimoReporte"]>) => number) =>
    conReporte.reduce((s, r) => s + f(r.ultimoReporte!), 0);
  const totalMiembros = suma((u) => u.totalMiembros);
  const totalFieles = suma((u) => u.asistieron - u.visitas);
  const participacionGeneral = porcentaje(totalFieles, totalMiembros);

  const grupos = mentorInfoPorId
    ? Array.from(
        redes.reduce((mapa, r) => {
          const clave = r.mentorId ?? "sin-mentor";
          mapa.set(clave, [...(mapa.get(clave) ?? []), r]);
          return mapa;
        }, new Map<string, RedConMetricas[]>()),
      ).map(([mentorId, lista], i) => ({
        mentorId,
        numero: i + 1,
        info: mentorInfoPorId[mentorId] ?? { nombre: "Sin mentoría asignada", colorHex: "#9CA3AF" },
        redes: lista,
      }))
    : null;

  function fila(red: RedConMetricas) {
    const u = red.ultimoReporte;
    return (
      <tr key={red.id}>
        <td>
          <button
            type="button"
            className="btn-red-detail"
            disabled={!u}
            onClick={() => u && setAbierto({ reporteId: u.id, liderLabel: red.liderLabel })}
            aria-label={u ? `Abrir informe detallado de ${red.nombre}` : undefined}
          >
            <div className="red-name">{red.nombre}</div>
            <div className="red-leader">{red.liderLabel}</div>
          </button>
        </td>
        {u ? (
          <>
            <td>{u.totalMiembros}</td>
            <td>{u.asistieron}</td>
            <td>
              <Progreso valor={porcentaje(u.asistieron - u.visitas, u.totalMiembros)} />
            </td>
            <td>{u.visitas}</td>
            <td>{u.congregan}</td>
            <td>{dinero(u.ofrenda)}</td>
          </>
        ) : (
          <td colSpan={6} className="red-leader">
            Sin informes todavía
          </td>
        )}
      </tr>
    );
  }

  return (
    <>
      <div className="kpi-grid">
        <KpiCard
          title="Redes reportadas"
          value={`${conReporte.length} / ${redes.length}`}
          note="Con al menos un informe"
        />
        <KpiCard title="Miembros" value={totalMiembros} note="Según el último informe" />
        <KpiCard
          title="Asistencia total"
          value={suma((u) => u.asistieron)}
          note={`${participacionGeneral}% de participación`}
        />
        <KpiCard title="Nuevos visitantes" value={suma((u) => u.visitas)} highlight />
      </div>

      <div className="informe-summary">
        <div className="informe-summary-header">
          <div>
            <h3>Estado general</h3>
            <p className="report-period">Datos del último reporte registrado por cada red</p>
          </div>
          <div className="attendance">
            <div className="attendance-label">
              <span>Participación general</span>
              <strong>{participacionGeneral}%</strong>
            </div>
            <div className="progress">
              <span style={{ width: `${participacionGeneral}%` }} />
            </div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Red / Líder</th>
                <th>Miembros</th>
                <th>Asistencia</th>
                <th>Participación</th>
                <th>Visitas</th>
                <th>Celebración</th>
                <th>Ofrenda</th>
              </tr>
            </thead>
            <tbody>
              {grupos
                ? grupos.map((g) => (
                    <Fragment key={g.mentorId}>
                      <tr className="mentor-row">
                        <td colSpan={7} style={{ backgroundColor: g.info.colorHex }}>
                          {g.numero}. MENTORÍA: {g.info.nombre.toUpperCase()}
                        </td>
                      </tr>
                      {g.redes.map(fila)}
                    </Fragment>
                  ))
                : redes.map(fila)}
            </tbody>
          </table>
        </div>
      </div>

      {abierto && (
        <RedDetalleModal
          reporteId={abierto.reporteId}
          liderLabel={abierto.liderLabel}
          onClose={() => setAbierto(null)}
        />
      )}
    </>
  );
}

export function BotonExportarPdf() {
  return (
    <button type="button" className="btn-view" onClick={() => window.print()}>
      Exportar como PDF
    </button>
  );
}
