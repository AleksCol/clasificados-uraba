import { z } from "zod";

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
