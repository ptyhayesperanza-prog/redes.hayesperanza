import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import "@/app/dashboard/dashboard.css";

const NAV_ITEMS = [
  { href: "/lider", label: "Vista General" },
  { href: "/lider/miembros", label: "Miembros de mi Red" },
  { href: "/lider/informes/nuevo", label: "Crear Informe" },
  { href: "/lider/informes", label: "Mis Informes" },
];

export default async function LiderLayout({ children }: { children: React.ReactNode }) {
  const sesion = await getUsuarioActual();
  if (!sesion) redirect("/login");

  const { perfil } = sesion;
  if (!perfil || perfil.rol !== "lider" || !perfil.red_id) redirect("/");

  const supabase = await createClient();
  const { data: red } = await supabase
    .from("redes")
    .select("nombre")
    .eq("id", perfil.red_id)
    .single();

  return (
    <div className="panel">
      <Sidebar
        navItems={NAV_ITEMS}
        rolLabel="Líder"
        nombreCompleto={perfil.nombre_completo}
        scopeLabel={red?.nombre ?? "Tu red"}
      />
      <main className="main-content">{children}</main>
    </div>
  );
}
