import Image from "next/image";

export function AuthBrandPanel() {
  return (
    <div
      className="relative hidden flex-col justify-between overflow-hidden p-14 text-white lg:flex"
      style={{
        background:
          "linear-gradient(165deg, var(--accent-deep) 0%, var(--accent) 62%, var(--accent) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,.35) 0, transparent 60%), radial-gradient(1px 1px at 70% 65%, rgba(255,255,255,.25) 0, transparent 60%), radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,.3) 0, transparent 60%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        <Image
          src="/logo-hay-esperanza.png"
          alt="Hay Esperanza"
          width={72}
          height={72}
          className="h-16 w-16"
          priority
        />
        <p className="font-[family-name:var(--font-fraunces)] text-2xl font-medium">
          Redes <span style={{ color: "var(--gold)" }}>Hay Esperanza</span>
        </p>
        <p className="max-w-xs text-sm text-white/80">
          Conecta con tu red y acompaña el crecimiento de cada miembro.
        </p>
      </div>

      <div className="relative z-10 flex justify-center py-8">
        <svg width="220" height="180" viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="60" y1="60" x2="140" y2="110" stroke="var(--gold)" strokeOpacity="0.5" />
          <line x1="140" y1="110" x2="220" y2="70" stroke="var(--gold)" strokeOpacity="0.4" />
          <line x1="140" y1="110" x2="100" y2="170" stroke="var(--gold)" strokeOpacity="0.35" />
          <line x1="140" y1="110" x2="210" y2="160" stroke="var(--gold)" strokeOpacity="0.3" />
          <line x1="60" y1="60" x2="210" y2="160" stroke="var(--gold)" strokeOpacity="0.2" />
          <line x1="220" y1="70" x2="100" y2="170" stroke="var(--gold)" strokeOpacity="0.2" />
          <circle cx="60" cy="60" r="5" fill="#F3F1E6" />
          <circle cx="140" cy="110" r="7" fill="var(--gold)" />
          <circle cx="220" cy="70" r="4" fill="#F3F1E6" />
          <circle cx="100" cy="170" r="4" fill="var(--gold)" />
          <circle cx="210" cy="160" r="5" fill="#F3F1E6" />
        </svg>
      </div>

      <p className="relative z-10 max-w-sm font-[family-name:var(--font-fraunces)] text-lg text-white/90">
        &ldquo;El crecimiento real ocurre cuando compartimos lo que sabemos.&rdquo;
        <br />
        <span className="mt-1 block font-[family-name:var(--font-work-sans)] text-xs text-white/60">
          Comunidad Redes Hay Esperanza
        </span>
      </p>
    </div>
  );
}

export function AuthMobileHeader() {
  return (
    <div className="flex flex-col items-center gap-2 pb-6 lg:hidden">
      <Image
        src="/logo-hay-esperanza.png"
        alt="Hay Esperanza"
        width={48}
        height={48}
        className="h-12 w-12"
        priority
      />
      <p className="font-[family-name:var(--font-fraunces)] text-lg font-medium text-[var(--accent)]">
        Redes Hay Esperanza
      </p>
    </div>
  );
}
