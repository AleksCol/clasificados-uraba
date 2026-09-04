// El número ya viene normalizado (57 + 10 dígitos) desde el registro, que es
// el formato que espera wa.me.
export function enlaceWhatsapp(whatsapp: string, titulo: string): string {
  const mensaje = `Hola, vi tu aviso "${titulo}" en Clasificados Urabá y me interesa.`;
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`;
}
