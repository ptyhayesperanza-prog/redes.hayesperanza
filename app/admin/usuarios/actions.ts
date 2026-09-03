"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";

export async function asignarPerfil(formData: FormData) {
  const sesion = await getUsuarioActual();
  if (!sesion || !sesion.perfil || sesion.perfil.rol !== "admin") {
    redirect("/login");
  }

  const id = String(formData.get("id"));
  const nombreCompleto = String(formData.get("nombre_completo") ?? "").trim();
  const rol = String(formData.get("rol"));
  const redId = formData.get("red_id") ? String(formData.get("red_id")) : null;
  const mentorId = formData.get("mentor_id") ? String(formData.get("mentor_id")) : null;

  if (!["pastor", "admin", "mentor", "lider"].includes(rol)) {
    throw new Error("Rol inválido.");
  }
  if (!nombreCompleto) {
    throw new Error("El nombre completo es obligatorio.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("perfiles").insert({
    id,
    nombre_completo: nombreCompleto,
    rol: rol as "pastor" | "admin" | "mentor" | "lider",
    red_id: rol === "lider" ? redId : null,
    mentor_id: rol === "mentor" ? mentorId : null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/usuarios");
}
