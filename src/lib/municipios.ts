import { Municipio } from "@/generated/prisma/enums";

// El enum de Prisma no admite tildes ni espacios, así que acá va el nombre
// que ve el usuario. El orden es el que se muestra en los filtros.
export const NOMBRES_MUNICIPIO: Record<Municipio, string> = {
  apartado: "Apartadó",
  turbo: "Turbo",
  chigorodo: "Chigorodó",
  carepa: "Carepa",
  necocli: "Necoclí",
  arboletes: "Arboletes",
  san_juan_de_uraba: "San Juan de Urabá",
  san_pedro_de_uraba: "San Pedro de Urabá",
  mutata: "Mutatá",
  murindo: "Murindó",
  vigia_del_fuerte: "Vigía del Fuerte",
};

export const MUNICIPIOS = Object.keys(NOMBRES_MUNICIPIO) as Municipio[];

export function nombreMunicipio(municipio: Municipio): string {
  return NOMBRES_MUNICIPIO[municipio];
}

export function esMunicipioValido(valor: string): valor is Municipio {
  return valor in NOMBRES_MUNICIPIO;
}
