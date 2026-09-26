import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import "@/app/dashboard/dashboard.css";

const NAV_ITEMS = [
  { href: "/mentor", label: "Vista General" },
  { href: "/mentor/informe", label: "Informe General de Mentoría" },
  { href: "/mentor/reportes", label: "Reportes de mis Redes" },
  { href: "/mentor/reuniones", label: "Reuniones y Eventos" },
  { href: "/mentor/comentarios", label: "Comentarios de Líderes" },
  { href: "/mentor/visitas", label: "Invitaciones y Visitas" },
];

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const sesion = await getUsuarioActual();
  if (!sesion) redirect("/login");

  const { perfil } = sesion;
  if (!perfil || perfil.rol !== "mentor" || !perfil.mentor_id) redirect("/");

  const supabase = await createClient();
  const { data: mentor } = await supabase
    .from("mentores")
    .select("nombre")
    .eq("id", perfil.mentor_id)
    .single();

  return (
    <div className="panel">
      <Sidebar
        navItems={NAV_ITEMS}
        rolLabel="Mentor"
        nombreCompleto={perfil.nombre_completo}
        scopeLabel={mentor ? `Mentoría de ${mentor.nombre}` : "Mi mentoría"}
      />
      <main className="main-content">{children}</main>
    </div>
  );
}
