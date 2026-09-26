"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cerrarSesion } from "@/app/actions";

export type NavItem = { href: string; label: string };

export function Sidebar({
  navItems,
  rolLabel,
  nombreCompleto,
  scopeLabel,
}: {
  navItems: NavItem[];
  rolLabel: string;
  nombreCompleto: string;
  scopeLabel: string;
}) {
  const pathname = usePathname();

  // El item activo es el de href más específico que hace match — evita que
  // "Vista General" (/lider) quede marcado activo en /lider/miembros.
  const hrefActivo = [...navItems]
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="sidebar" aria-label={`Menú de ${rolLabel.toLowerCase()}`}>
      <div className="logo-container">
        <Image
          src="/logo-hayesperanza-azul.png"
          alt="Hay Esperanza"
          width={600}
          height={320}
          priority
        />
      </div>
      <ul className="nav-menu">
        {navItems.map((item) => {
          const activo = item.href === hrefActivo;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`nav-link${activo ? " active" : ""}`}
                aria-current={activo ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="profile">
        {rolLabel.toUpperCase()}
        <strong>{nombreCompleto}</strong>
        {scopeLabel}
        <form action={cerrarSesion} className="mt-2">
          <button
            type="submit"
            className="nav-link"
            style={{ padding: "8px 0", opacity: 0.85 }}
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </nav>
  );
}
