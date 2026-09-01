export function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-8 shadow-sm backdrop-blur-md ${className}`}
      style={{
        background: "var(--surface)",
        borderColor: "var(--surface-border)",
      }}
    >
      {children}
    </div>
  );
}
