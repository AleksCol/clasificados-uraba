import { z } from "zod";
import { Municipio, TipoAviso } from "@/generated/prisma/enums";
import { esUrlDeFoto } from "./foto";

// Los celulares colombianos son 10 dígitos que empiezan en 3. Guardamos
// siempre el formato internacional sin "+" (57 + los 10 dígitos), que es
// lo que espera el link de wa.me.
export function normalizarWhatsapp(valor: string): string | null {
  const digitos = valor.replace(/\D/g, "");
  if (/^3\d{9}$/.test(digitos)) return `57${digitos}`;
  if (/^573\d{9}$/.test(digitos)) return digitos;
  return null;
}

const campoWhatsapp = z.string().transform((valor, ctx) => {
  const normalizado = normalizarWhatsapp(valor);
  if (!normalizado) {
    ctx.addIssue({
      code: "custom",
      message: "Escribe un celular colombiano, por ejemplo 300 123 4567",
    });
    return z.NEVER;
  }
  return normalizado;
});

const campoEmail = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Escribe un correo válido"));

export const esquemaRegistro = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no puede pasar de 80 caracteres"),
  email: campoEmail,
  // bcrypt ignora todo lo que pase de 72 bytes, así que cortamos antes para
  // que nadie termine con una contraseña truncada en silencio.
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "La contraseña no puede pasar de 72 caracteres"),
  whatsapp: campoWhatsapp,
});

export const esquemaLogin = z.object({
  email: campoEmail,
  password: z.string().min(1, "Escribe tu contraseña"),
});

const campoPrecio = z
  .string()
  .transform((valor) => valor.replace(/\D/g, ""))
  .transform((digitos) => (digitos === "" ? null : Number(digitos)))
  .refine(
    (precio) => precio === null || (precio > 0 && precio <= 2_000_000_000),
    "El precio debe estar entre $1 y $2.000.000.000",
  );

// El formulario manda la URL que devolvió Vercel Blob, no el archivo. Hay que
// comprobar que sea del store propio y no una URL cualquiera.
const campoFotoUrl = z
  .string()
  .trim()
  .transform((valor) => valor || null)
  .refine(
    (url) => url === null || esUrlDeFoto(url),
    "Esa foto no viene de una subida válida",
  );

export const esquemaAviso = z
  .object({
    titulo: z
      .string()
      .trim()
      .min(5, "El título debe tener al menos 5 caracteres")
      .max(120, "El título no puede pasar de 120 caracteres"),
    descripcion: z
      .string()
      .trim()
      .min(20, "La descripción debe tener al menos 20 caracteres")
      .max(2000, "La descripción no puede pasar de 2000 caracteres"),
    tipo: z.enum(TipoAviso, { message: "Elige empleo o artículo" }),
    municipio: z.enum(Municipio, { message: "Elige un municipio" }),
    categoriaId: z.string().min(1, "Elige una categoría"),
    precio: campoPrecio,
    fotoUrl: campoFotoUrl,
  })
  .superRefine((datos, ctx) => {
    if (datos.tipo === "empleo" && datos.precio !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["precio"],
        message: "Las ofertas de empleo no llevan precio",
      });
    }
    if (datos.tipo === "empleo" && datos.fotoUrl !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["fotoUrl"],
        message: "Las ofertas de empleo no llevan foto",
      });
    }
  });
