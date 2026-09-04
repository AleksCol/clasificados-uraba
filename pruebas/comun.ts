import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

export const BASE = process.env.BASE_URL ?? "http://localhost:3000";
export const PASSWORD = "contrasena-segura-123";

// Todas las cuentas de prueba usan este dominio. La limpieza borra solo esas,
// así que las pruebas nunca tocan datos reales de la base.
export const DOMINIO_PRUEBA = "@prueba.local";

export const MARCA_REGISTRO = 'name="nombre"';
export const MARCA_LOGIN = 'name="password"';
export const MARCA_AVISO = 'name="titulo"';
export const MARCA_ESTADO = 'name="activo"';

export function crearPrisma(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });
}

let fallas = 0;

export function afirmar(condicion: boolean, descripcion: string): void {
  console.log(`${condicion ? "✓" : "✗"} ${descripcion}`);
  if (!condicion) fallas++;
}

export function terminar(): never {
  console.log(fallas === 0 ? "\nTodo paso." : `\n${fallas} fallas.`);
  process.exit(fallas === 0 ? 0 : 1);
}

// Next identifica la server action con campos ocultos que empiezan con "$".
// Elegimos el formulario por un campo propio porque el header agrega el de
// "Salir" cuando hay sesion.
export function camposDeAccion(html: string, marcador: string): [string, string][] {
  const formularios = [...html.matchAll(/<form[\s\S]*?<\/form>/g)].map((m) => m[0]);
  const objetivo = formularios.find((f) => f.includes(marcador));
  if (!objetivo) throw new Error(`No encontre el formulario con ${marcador}`);

  const campos: [string, string][] = [];
  const re = /<input type="hidden" name="(\$[^"]+)"(?: value="([^"]*)")?\/>/g;
  for (const m of objetivo.matchAll(re)) {
    campos.push([m[1], (m[2] ?? "").replace(/&quot;/g, '"').replace(/&amp;/g, "&")]);
  }
  return campos;
}

// Envia el formulario como lo haria un navegador sin JavaScript. Los campos
// que no son de la accion los ponemos nosotros, que es justo lo que haria
// alguien manipulando el formulario a mano.
export async function postear(
  ruta: string,
  datos: Record<string, string>,
  cookie: string | undefined,
  marcador: string,
): Promise<Response> {
  const cabeceras: Record<string, string> = cookie ? { Cookie: cookie } : {};
  const html = await fetch(`${BASE}${ruta}`, { headers: cabeceras }).then((r) => r.text());

  const cuerpo = new FormData();
  for (const [n, v] of camposDeAccion(html, marcador)) cuerpo.append(n, v);
  for (const [n, v] of Object.entries(datos)) cuerpo.append(n, v);

  return fetch(`${BASE}${ruta}`, {
    method: "POST",
    body: cuerpo,
    headers: cabeceras,
    redirect: "manual",
  });
}

export async function registrar(
  nombre: string,
  email: string,
  whatsapp: string,
): Promise<string> {
  const r = await postear(
    "/registro",
    { nombre, email, whatsapp, password: PASSWORD },
    undefined,
    MARCA_REGISTRO,
  );
  const cookie = (r.headers.getSetCookie?.() ?? []).find((c) => c.startsWith("sesion="));
  if (!cookie) throw new Error(`No se pudo registrar a ${nombre} (HTTP ${r.status})`);
  return cookie.split(";")[0];
}

// Los avisos caen por la cascada de la llave foranea al borrar el usuario.
export async function limpiar(prisma: PrismaClient): Promise<void> {
  await prisma.usuario.deleteMany({
    where: { email: { endsWith: DOMINIO_PRUEBA } },
  });
}

export async function quedaLimpio(prisma: PrismaClient): Promise<boolean> {
  const [usuarios, avisos] = await Promise.all([
    prisma.usuario.count({ where: { email: { endsWith: DOMINIO_PRUEBA } } }),
    prisma.aviso.count({ where: { usuario: { email: { endsWith: DOMINIO_PRUEBA } } } }),
  ]);
  return usuarios === 0 && avisos === 0;
}
