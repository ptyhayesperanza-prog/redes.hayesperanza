"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { hoyISO } from "@/lib/fecha";

export type MiembroResultado = { error: string | null };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

async function requireLiderRedId() {
  const sesion = await getUsuarioActual();
  if (!sesion?.perfil || sesion.perfil.rol !== "lider" || !sesion.perfil.red_id) return null;
  return sesion.perfil.red_id;
}

function campo(formData: FormData, nombre: string, max: number) {
  return String(formData.get(nombre) ?? "").trim().slice(0, max) || null;
}

type CamposMiembro =
  | { error: string }
  | {
      datos: {
        nombre: string;
        apellido: string | null;
        telefono: string | null;
        correo: string | null;
        direccion: string | null;
        fecha_nacimiento: string | null;
        activo: boolean;
      };
    };

function camposMiembro(formData: FormData): CamposMiembro {
  const nombre = campo(formData, "nombre", 100);
  if (!nombre) return { error: "El nombre es obligatorio." };

  const fecha = campo(formData, "fecha_nacimiento", 10);
  if (fecha && (!FECHA.test(fecha) || fecha > hoyISO())) {
    return { error: "La fecha de nacimiento no es válida." };
  }

  return {
    datos: {
      nombre,
      apellido: campo(formData, "apellido", 100),
      telefono: campo(formData, "telefono", 30),
      correo: campo(formData, "correo", 160),
      direccion: campo(formData, "direccion", 250),
      fecha_nacimiento: fecha,
      activo: String(formData.get("estado") ?? "activo") === "activo",
    },
  };
}

export async function guardarMiembro(formData: FormData): Promise<MiembroResultado> {
  const redId = await requireLiderRedId();
  if (!redId) return { error: "No autorizado." };

  const campos = camposMiembro(formData);
  if ("error" in campos) return { error: campos.error };

  const supabase = await createClient();
  const id = formData.get("id") ? String(formData.get("id")) : null;

  const { error } = id
    ? await supabase.from("miembros_red").update(campos.datos).eq("id", id).eq("red_id", redId)
    : await supabase.from("miembros_red").insert({ red_id: redId, ...campos.datos });

  if (error) return { error: "No se pudo guardar el miembro. Intenta de nuevo." };
  revalidatePath("/lider/miembros");
  revalidatePath("/lider/informes/nuevo");
  return { error: null };
}

export async function cambiarEstadoMiembro(id: string, activo: boolean): Promise<MiembroResultado> {
  const redId = await requireLiderRedId();
  if (!redId) return { error: "No autorizado." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("miembros_red")
    .update({ activo })
    .eq("id", id)
    .eq("red_id", redId);

  if (error) return { error: "No se pudo cambiar el estado del miembro." };
  revalidatePath("/lider/miembros");
  revalidatePath("/lider/informes/nuevo");
  return { error: null };
}
