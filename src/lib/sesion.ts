import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const NOMBRE_COOKIE = "sesion";
const DURACION_DIAS = 30;
const RONDAS_BCRYPT = 12;

function claveSecreta(): Uint8Array {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto) {
    throw new Error("Falta la variable de entorno AUTH_SECRET");
  }
  return new TextEncoder().encode(secreto);
}

export async function hashearPassword(password: string): Promise<string> {
  return bcrypt.hash(password, RONDAS_BCRYPT);
}

export async function verificarPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function crearSesion(usuarioId: string): Promise<void> {
  const expiracion = new Date(Date.now() + DURACION_DIAS * 24 * 60 * 60 * 1000);

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(usuarioId)
    .setIssuedAt()
    .setExpirationTime(expiracion)
    .sign(claveSecreta());

  const almacen = await cookies();
  almacen.set(NOMBRE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiracion,
    path: "/",
  });
}

export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.delete(NOMBRE_COOKIE);
}

export type UsuarioSesion = {
  id: string;
  nombre: string;
  email: string;
  whatsapp: string;
};

// cache() de React evita repetir la consulta cuando varios componentes
// del mismo render preguntan quién está logueado.
export const usuarioActual = cache(async (): Promise<UsuarioSesion | null> => {
  const almacen = await cookies();
  const token = almacen.get(NOMBRE_COOKIE)?.value;
  if (!token) return null;

  let usuarioId: string;
  try {
    const { payload } = await jwtVerify(token, claveSecreta());
    if (!payload.sub) return null;
    usuarioId = payload.sub;
  } catch {
    // Token vencido, alterado o firmado con otro secreto.
    return null;
  }

  // Consultamos la base en cada request: si la cuenta se borró, la cookie
  // deja de servir de inmediato.
  return prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nombre: true, email: true, whatsapp: true },
  });
});

export async function requerirUsuario(): Promise<UsuarioSesion> {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
}
