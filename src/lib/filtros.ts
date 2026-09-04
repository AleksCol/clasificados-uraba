import type { Municipio, TipoAviso } from "@/generated/prisma/enums";
import { esMunicipioValido } from "./municipios";

export const AVISOS_POR_PAGINA = 12;

export type Filtros = {
  tipo: TipoAviso | null;
  categoriaId: string | null;
  municipio: Municipio | null;
  texto: string;
  pagina: number;
};

export type ParamsCrudos = Record<string, string | string[] | undefined>;

function unico(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor)?.trim() ?? "";
}

// Todo lo que llega por la URL puede venir manipulado: lo que no reconocemos
// se descarta en vez de llegar a la consulta.
export function leerFiltros(params: ParamsCrudos): Filtros {
  const tipo = unico(params.tipo);
  const municipio = unico(params.municipio);
  const pagina = Number.parseInt(unico(params.pagina), 10);

  return {
    tipo: tipo === "empleo" || tipo === "articulo" ? tipo : null,
    categoriaId: unico(params.categoria) || null,
    municipio: esMunicipioValido(municipio) ? municipio : null,
    texto: unico(params.q).slice(0, 100),
    pagina: Number.isInteger(pagina) && pagina > 1 ? pagina : 1,
  };
}

export function urlListado(
  filtros: Filtros,
  cambios: Partial<Filtros> = {},
): string {
  const combinado = { ...filtros, ...cambios };
  const params = new URLSearchParams();

  if (combinado.tipo) params.set("tipo", combinado.tipo);
  if (combinado.categoriaId) params.set("categoria", combinado.categoriaId);
  if (combinado.municipio) params.set("municipio", combinado.municipio);
  if (combinado.texto) params.set("q", combinado.texto);
  if (combinado.pagina > 1) params.set("pagina", String(combinado.pagina));

  const cadena = params.toString();
  return cadena ? `/?${cadena}` : "/";
}

export function hayFiltrosActivos(filtros: Filtros): boolean {
  return Boolean(filtros.categoriaId || filtros.municipio || filtros.texto);
}
