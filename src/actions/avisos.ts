"use server";

import { z } from "zod";
import { del } from "@vercel/blob";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requerirUsuario } from "@/lib/sesion";
import { esquemaAviso } from "@/lib/validaciones";
import { normalizarTexto } from "@/lib/texto";
import type { EstadoFormulario } from "@/lib/formularios";
import type { TipoAviso } from "@/generated/prisma/enums";

function leerFormulario(formData: FormData) {
  return {
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    tipo: formData.get("tipo"),
    municipio: formData.get("municipio"),
    categoriaId: formData.get("categoriaId"),
    // Precio y foto no se renderizan cuando el tipo es empleo.
    precio: formData.get("precio") ?? "",
    fotoUrl: formData.get("fotoUrl") ?? "",
  };
}

// La llave foránea compuesta ya impide guardar una categoría de otro tipo,
// pero preferimos avisarlo con un mensaje entendible antes de llegar a la base.
async function categoriaInvalida(
  categoriaId: string,
  tipo: TipoAviso,
): Promise<boolean> {
  const categoria = await prisma.categoria.findUnique({
    where: { id: categoriaId },
    select: { tipo: true },
  });
  return !categoria || categoria.tipo !== tipo;
}

export async function crearAviso(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requerirUsuario();

  const resultado = esquemaAviso.safeParse(leerFormulario(formData));
  if (!resultado.success) {
    return { errores: z.flattenError(resultado.error).fieldErrors };
  }

  const datos = resultado.data;
  if (await categoriaInvalida(datos.categoriaId, datos.tipo)) {
    return { errores: { categoriaId: ["Elige una categoría de este tipo"] } };
  }

  await prisma.aviso.create({
    data: {
      ...datos,
      tituloNormalizado: normalizarTexto(datos.titulo),
      usuarioId: usuario.id,
    },
  });

  revalidatePath("/mis-avisos");
  redirect("/mis-avisos");
}

export async function actualizarAviso(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requerirUsuario();

  const id = String(formData.get("id") ?? "");
  if (!id) return { errorGeneral: "Falta el aviso que se quiere editar" };

  const resultado = esquemaAviso.safeParse(leerFormulario(formData));
  if (!resultado.success) {
    return { errores: z.flattenError(resultado.error).fieldErrors };
  }

  const datos = resultado.data;
  if (await categoriaInvalida(datos.categoriaId, datos.tipo)) {
    return { errores: { categoriaId: ["Elige una categoría de este tipo"] } };
  }

  // Se lee la foto anterior (filtrando por dueño) para poder borrarla del store
  // si el usuario la reemplaza o la quita.
  const anterior = await prisma.aviso.findFirst({
    where: { id, usuarioId: usuario.id },
    select: { fotoUrl: true },
  });

  // updateMany filtra por id Y por dueño en la misma consulta: si el aviso es
  // de otro usuario no actualiza nada, sin ventana entre leer y escribir.
  const { count } = await prisma.aviso.updateMany({
    where: { id, usuarioId: usuario.id },
    data: { ...datos, tituloNormalizado: normalizarTexto(datos.titulo) },
  });

  if (count === 0) {
    return { errorGeneral: "Ese aviso no existe o no es tuyo" };
  }

  if (anterior?.fotoUrl && anterior.fotoUrl !== datos.fotoUrl) {
    // Si el borrado falla no tiene sentido revertir la edición: queda un
    // archivo huérfano, no un aviso roto.
    await del(anterior.fotoUrl).catch(() => {});
  }

  revalidatePath("/mis-avisos");
  revalidatePath(`/avisos/${id}`);
  redirect("/mis-avisos");
}

export async function cambiarEstadoAviso(formData: FormData): Promise<void> {
  const usuario = await requerirUsuario();

  const id = String(formData.get("id") ?? "");
  const activo = formData.get("activo") === "true";
  if (!id) return;

  await prisma.aviso.updateMany({
    where: { id, usuarioId: usuario.id },
    data: { activo },
  });

  revalidatePath("/mis-avisos");
  revalidatePath(`/avisos/${id}`);
}
