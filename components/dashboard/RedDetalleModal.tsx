"use client";

import { useEffect, useRef, useState } from "react";
import { obtenerDetalleReporte, type DetalleReporte } from "@/app/dashboard/actions";
import { dinero, porcentaje } from "@/lib/formato";
import { formatearFecha } from "@/lib/fecha";

function DataItem({
  label,
  value,
  color,
  wide = false,
}: {
  label: string;
  value: number | string;
  color?: string;
  wide?: boolean;
}) {
  return (
    <div className={`data-item${wide ? " wide" : ""}`}>
      <div className="data-label" style={color ? { color } : undefined}>
        {label}
      </div>
      <div className="data-value">{value}</div>
    </div>
  );
}

function ListaMiembros({ titulo, nombres }: { titulo: string; nombres: string[] }) {
  return (
    <div className="member-list">
      <div className="member-list-title">
        <span>{titulo}</span>
        <span className="member-count">
          {nombres.length} miembro{nombres.length === 1 ? "" : "s"}
        </span>
      </div>
      <ul>
        {nombres.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

export function RedDetalleModal({
  reporteId,
  liderLabel,
  onClose,
}: {
  reporteId: string;
  liderLabel: string;
  onClose: () => void;
}) {
  const [detalle, setDetalle] = useState<DetalleReporte | null | undefined>(undefined);
  const [verNombres, setVerNombres] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let vigente = true;
    obtenerDetalleReporte(reporteId)
      .then((d) => vigente && setDetalle(d))
      .catch(() => vigente && setDetalle(null));
    return () => {
      vigente = false;
    };
  }, [reporteId]);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function cerrar() {
    dialogRef.current?.close();
    onClose();
  }

  const asistieron = detalle ? detalle.fieles.length + detalle.visitantes.length : 0;
  const participacion = detalle ? porcentaje(detalle.fieles.length, detalle.totalMiembros) : 0;

  return (
    <dialog ref={dialogRef} className="modal-content" onClose={onClose} aria-labelledby="detalle-red-titulo">
      {detalle === undefined && <p className="empty">Cargando...</p>}
      {detalle === null && (
        <div className="modal-header">
          <p className="empty">No se pudo cargar este reporte.</p>
          <button className="close-btn" type="button" onClick={cerrar} aria-label="Cerrar">
            ×
          </button>
        </div>
      )}
      {detalle && (
        <>
          <div className="modal-header">
            <div>
              <h3 className="modal-title" id="detalle-red-titulo">
                {detalle.redNombre}
              </h3>
              <p className="red-leader">Líder: {liderLabel}</p>
            </div>
            <button className="close-btn" type="button" onClick={cerrar} aria-label="Cerrar">
              ×
            </button>
          </div>

          {/* Nivel 1: solo totales. Nivel 2 (al expandir): nombres. */}
          <div className="modal-data-grid">
            <DataItem label="Total miembros" value={detalle.totalMiembros} />
            <DataItem label="Asistieron" value={asistieron} color="var(--status-al-dia, #059669)" />
            <DataItem label="Faltaron" value={detalle.faltaron.length} color="var(--status-falto, #e11d48)" />
            <DataItem label="Participación" value={`${participacion}%`} />
            <DataItem label="Visitas nuevas" value={detalle.visitantes.length} color="var(--status-nuevo, #d97706)" />
            <DataItem label="Celebración (se congregan)" value={detalle.congregan} />
            <DataItem label="Ofrenda" value={dinero(detalle.ofrenda)} />
            <DataItem
              label="Semana"
              value={`${formatearFecha(detalle.semanaInicio)} – ${formatearFecha(detalle.semanaFin)}`}
              wide
            />
            <DataItem label="Reunión" value={detalle.reunion} wide />
            {detalle.materialTitulo && (
              <DataItem
                label="Material / capítulo"
                value={`${detalle.materialTitulo}${detalle.capituloActual ? " — cap. " + detalle.capituloActual : ""}`}
                wide
              />
            )}
            {detalle.discipuladosGeneral && (
              <DataItem label="Discipulados" value={detalle.discipuladosGeneral} wide />
            )}
            {detalle.comentarioGeneral && (
              <DataItem label="Comentario del líder" value={detalle.comentarioGeneral} wide />
            )}
          </div>

          <section className="detail-section">
            <button
              type="button"
              className="btn-view secondary"
              aria-expanded={verNombres}
              onClick={() => setVerNombres((v) => !v)}
            >
              {verNombres ? "Ocultar nombres" : "Ver asistencia por miembro"}
            </button>

            {verNombres && (
              <>
                <h4 style={{ marginTop: "18px" }}>Asistencia por miembro</h4>
                <div className="member-lists">
                  <ListaMiembros titulo="Asistieron" nombres={detalle.fieles} />
                  <ListaMiembros titulo="No asistieron" nombres={detalle.faltaron} />
                </div>

                <h4 style={{ marginTop: "24px" }}>Visitantes nuevos</h4>
                <div className="visitor-list">
                  {detalle.visitantes.length === 0 ? (
                    <p className="red-leader">No se registraron visitantes nuevos en este reporte.</p>
                  ) : (
                    detalle.visitantes.map((v, i) => (
                      <article className="visitor-card" key={i}>
                        <strong>{v.nombre}</strong>
                        <p>Invitado por: {v.invitadoPor ?? "sin registrar"}</p>
                      </article>
                    ))
                  )}
                </div>

                {detalle.notasMiembro.length > 0 && (
                  <>
                    <h4 style={{ marginTop: "24px" }}>Seguimiento por persona</h4>
                    <div className="visitor-list">
                      {detalle.notasMiembro.map((n, i) => (
                        <article className="visitor-card" key={i}>
                          <strong>{n.nombre}</strong>
                          {n.discipulado && <p>Discipulado: {n.discipulado}</p>}
                          {n.comentario && <p>Comentario: {n.comentario}</p>}
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </section>

          {detalle.peticiones.length > 0 && (
            <section className="detail-section">
              <h4>Peticiones de oración</h4>
              <div className="visitor-list">
                {detalle.peticiones.map((p, i) => (
                  <article className="visitor-card" key={i}>
                    <strong>{p.nombre}</strong>
                    <p>{p.descripcion}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {detalle.fotos.length > 0 && (
            <section className="detail-section">
              <h4>Fotos de la reunión</h4>
              <div className="report-photos">
                {detalle.fotos.map((url, i) => (
                  // URLs firmadas temporales del bucket privado: next/image
                  // no aporta aquí y exigiría configurar el dominio remoto.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt={`Foto ${i + 1} de la reunión`} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </dialog>
  );
}
