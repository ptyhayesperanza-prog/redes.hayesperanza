export function KpiCard({
  title,
  value,
  note,
  highlight = false,
}: {
  title: string;
  value: string | number;
  note?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`kpi-card${highlight ? " highlight" : ""}`}>
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
      {note && <div className="kpi-note">{note}</div>}
    </div>
  );
}
