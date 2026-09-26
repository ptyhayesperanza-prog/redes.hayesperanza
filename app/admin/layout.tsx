import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { Sidebar } from "@/components/dashboard/Sidebar";
import "@/app/dashboard/dashboard.css";

const NAV_ITEMS = [
  { href: "/admin", label: "Vista General" },
  { href: "/admin/informe", label: "Informe General de Mentorías" },
  { href: "/admin/usuarios", label: "Usuarios pendientes" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sesion = await getUsuarioActual();
  if (!sesion) redirect("/login");

  const { perfil } = sesion;
  if (!perfil || perfil.rol !== "admin") redirect("/");

  return (
    <div className="panel">
      <Sidebar
        navItems={NAV_ITEMS}
        rolLabel="Admin"
        nombreCompleto={perfil.nombre_completo}
        scopeLabel="Todas las redes"
      />
      <main className="main-content">{children}</main>
    </div>
  );
}
