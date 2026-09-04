const FORMATO_PRECIO = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const FORMATO_FECHA = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatearPrecio(precio: number): string {
  return FORMATO_PRECIO.format(precio);
}

export function formatearFecha(fecha: Date): string {
  return FORMATO_FECHA.format(fecha);
}
