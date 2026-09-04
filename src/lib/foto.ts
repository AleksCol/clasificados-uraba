// Las URLs de Vercel Blob son https://<store>.public.blob.vercel-storage.com/...
// Validamos el host porque fotoUrl llega como texto en el formulario: sin esto
// alguien podría guardar la URL de un servidor ajeno y hacer que el sitio la
// cargue en cada visita.
const HOST_BLOB = /^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/;

export const TIPOS_DE_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
export const TAMANO_MAXIMO_BYTES = 4 * 1024 * 1024;
export const LADO_MAXIMO_PX = 1600;

export function esUrlDeFoto(url: string): boolean {
  try {
    const parseada = new URL(url);
    return parseada.protocol === "https:" && HOST_BLOB.test(parseada.hostname);
  } catch {
    return false;
  }
}
