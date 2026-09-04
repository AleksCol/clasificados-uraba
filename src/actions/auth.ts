"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { esquemaLogin, esquemaRegistro } from "@/lib/validaciones";
import type { EstadoFormulario } from "@/lib/formularios";
import {
  cerrarSesion,
  crearSesion,
  hashearPassword,
  verificarPassword,
} from "@/lib/sesion";

// Hash de una contraseña aleatoria que nadie conoce. Se compara contra este
// cuando el correo no existe, para que la respuesta tarde lo mismo y el
// tiempo no delate qué correos están registrados.
const HASH_DE_RELLENO =
  "$2b$12$bjapYY68RawGZk35sWGbneVE0lcS4UCGjIqEJ5.IEGHvnrolB9cQ.";

function esEmailDuplicado(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function registrar(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const resultado = esquemaRegistro.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    password: formData.get("password"),
    whatsapp: formData.get("whatsapp"),
  });

  if (!resultado.success) {
    return { errores: z.flattenError(resultado.error).fieldErrors };
  }

  const { nombre, email, password, whatsapp } = resultado.data;
  const passwordHash = await hashearPassword(password);

  let usuarioId: string;
  try {
    const usuario = await prisma.usuario.create({
      data: { nombre, email, passwordHash, whatsapp },
      select: { id: true },
    });
    usuarioId = usuario.id;
  } catch (error) {
    if (esEmailDuplicado(error)) {
      return { errores: { email: ["Ya existe una cuenta con este correo"] } };
    }
    throw error;
  }

  await crearSesion(usuarioId);
  // redirect() lanza una excepción interna de Next, por eso va fuera del try.
  redirect("/mis-avisos");
}

export async function ingresar(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const resultado = esquemaLogin.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!resultado.success) {
    return { errores: z.flattenError(resultado.error).fieldErrors };
  }

  const { email, password } = resultado.data;
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  const passwordCorrecta = await verificarPassword(
    password,
    usuario?.passwordHash ?? HASH_DE_RELLENO,
  );

  // Un solo mensaje para los dos casos: no revelamos si el correo existe.
  if (!usuario || !passwordCorrecta) {
    return { errorGeneral: "Correo o contraseña incorrectos" };
  }

  await crearSesion(usuario.id);
  redirect("/mis-avisos");
}

export async function salir(): Promise<void> {
  await cerrarSesion();
  redirect("/");
}
