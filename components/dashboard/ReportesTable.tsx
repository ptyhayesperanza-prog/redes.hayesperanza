"use client";
import { formatearFecha } from "@/lib/fecha";

import { dinero } from "@/lib/formato";
import { useState } from "react";
import { RedDetalleModal } from "./RedDetalleModal";

export type FilaReporte = {
  id: string;
  redNombre: string;
  liderLabel: string;
  semanaInicio: string;
  totalMiembros: number;
  asistieron: number;
  visitas: number;
  ofrenda: number;
};

export function ReportesTable({ filas }: { filas: FilaReporte[] }) {
  const [abierto, setAbierto] = useState<FilaReporte | null>(null);

  if (filas.length === 0) {
    return <p className="empty">Todavía no hay reportes de tus redes.</p>;
  }

  return (
    <>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Red / Líder</th>
              <th>Semana</th>
              <th>Miembros</th>
              <th>Asistieron</th>
              <th>Visitas</th>
              <th>Ofrenda</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id}>
                <td>
                  <div className="red-name">{f.redNombre}</div>
                  <div className="red-leader">{f.liderLabel}</div>
                </td>
                <td>{formatearFecha(f.semanaInicio)}</td>
                <td>{f.totalMiembros}</td>
                <td>{f.asistieron}</td>
                <td>{f.visitas}</td>
                <td>{dinero(f.ofrenda)}</td>
                <td>
                  <button className="btn-view" type="button" onClick={() => setAbierto(f)}>
                    Ver informe
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {abierto && (
        <RedDetalleModal
          reporteId={abierto.id}
          liderLabel={abierto.liderLabel}
          onClose={() => setAbierto(null)}
        />
      )}
    </>
  );
}
