// Quita tildes y pasa a minúsculas. En el celular la gente escribe "camion" y
// "necocli", así que la búsqueda tiene que encontrar "camión" y "Necoclí".
// NFD separa la letra de su acento y el rango ̀-ͯ borra los acentos.
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
