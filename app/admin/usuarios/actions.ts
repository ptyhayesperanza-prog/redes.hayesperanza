"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";

export type AsignarState = { error: string | null };

export async function asignarPerfil(_prev: AsignarState, formData: FormData): Promise<AsignarState> {
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
    return { error: "Rol inválido." };
  }
  if (!nombreCompleto) {
    return { error: "El nombre completo es obligatorio." };
  }
  // Sin esto quedaría un perfil de líder sin red (o mentor sin mentoría)
  // que no tiene ningún panel al que entrar.
  if (rol === "lider" && !redId) return { error: "Elige la red del líder." };
  if (rol === "mentor" && !mentorId) return { error: "Elige la mentoría." };

  const supabase = await createClient();
  const { error } = await supabase.from("perfiles").insert({
    id,
    nombre_completo: nombreCompleto,
    rol: rol as "pastor" | "admin" | "mentor" | "lider",
    red_id: rol === "lider" ? redId : null,
    mentor_id: rol === "mentor" ? mentorId : null,
  });

  if (error) return { error: "No se pudo asignar el perfil: " + error.message };

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  return { error: null };
}
