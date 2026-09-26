import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { Sidebar } from "@/components/dashboard/Sidebar";
import "@/app/dashboard/dashboard.css";

const NAV_ITEMS = [
  { href: "/pastor", label: "Vista General" },
  { href: "/pastor/informe", label: "Informe General de Mentorías" },
  { href: "/pastor/reportes", label: "Reportes de Redes" },
  { href: "/pastor/reuniones", label: "Reuniones y Eventos" },
  { href: "/pastor/comentarios", label: "Comentarios de Líderes" },
  { href: "/pastor/visitas", label: "Invitaciones y Visitas" },
];

export default async function PastorLayout({ children }: { children: React.ReactNode }) {
  const sesion = await getUsuarioActual();
  if (!sesion) redirect("/login");

  const { perfil } = sesion;
  if (!perfil || perfil.rol !== "pastor") redirect("/");

  return (
    <div className="panel">
      <Sidebar
        navItems={NAV_ITEMS}
        rolLabel="Pastor"
        nombreCompleto={perfil.nombre_completo}
        scopeLabel="Todas las redes"
      />
      <main className="main-content">{children}</main>
    </div>
  );
}
