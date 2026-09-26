"use client";
import { formatearFecha } from "@/lib/fecha";

import { dinero } from "@/lib/formato";
import { useState } from "react";
import { RedDetalleModal } from "@/components/dashboard/RedDetalleModal";

export type InformeResumen = {
  id: string;
  semanaInicio: string;
  totalMiembros: number;
  asistieron: number;
  visitas: number;
  ofrenda: number;
};

export function InformesClient({
  informes,
  liderLabel,
}: {
  informes: InformeResumen[];
  liderLabel: string;
}) {
  const [abierto, setAbierto] = useState<string | null>(null);

  if (informes.length === 0) {
    return <p className="empty">Todavía no hay informes. Crea el primero después de tu reunión.</p>;
  }

  return (
    <>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Semana</th>
              <th>Miembros</th>
              <th>Asistieron</th>
              <th>Visitas</th>
              <th>Ofrenda</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {informes.map((i) => (
              <tr key={i.id}>
                <td>{formatearFecha(i.semanaInicio)}</td>
                <td>{i.totalMiembros}</td>
                <td>{i.asistieron}</td>
                <td>{i.visitas}</td>
                <td>{dinero(i.ofrenda)}</td>
                <td>
                  <button className="btn-view" type="button" onClick={() => setAbierto(i.id)}>
                    Ver informe
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {abierto && (
        <RedDetalleModal reporteId={abierto} liderLabel={liderLabel} onClose={() => setAbierto(null)} />
      )}
    </>
  );
}
