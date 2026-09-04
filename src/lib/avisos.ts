import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { AVISOS_POR_PAGINA, type Filtros } from "./filtros";

function condiciones(filtros: Filtros): Prisma.AvisoWhereInput {
  return {
    // Los avisos pausados no salen en el listado público.
    activo: true,
    ...(filtros.tipo && { tipo: filtros.tipo }),
    ...(filtros.categoriaId && { categoriaId: filtros.categoriaId }),
    ...(filtros.municipio && { municipio: filtros.municipio }),
    ...(filtros.texto && {
      titulo: { contains: filtros.texto, mode: "insensitive" as const },
    }),
  };
}

export async function buscarAvisos(filtros: Filtros) {
  const where = condiciones(filtros);

  const [avisos, total] = await Promise.all([
    prisma.aviso.findMany({
      where,
      orderBy: { publicadoEn: "desc" },
      skip: (filtros.pagina - 1) * AVISOS_POR_PAGINA,
      take: AVISOS_POR_PAGINA,
      select: {
        id: true,
        titulo: true,
        tipo: true,
        municipio: true,
        precio: true,
        publicadoEn: true,
        categoria: { select: { nombre: true } },
      },
    }),
    prisma.aviso.count({ where }),
  ]);

  return {
    avisos,
    total,
    paginas: Math.max(1, Math.ceil(total / AVISOS_POR_PAGINA)),
  };
}

export type AvisoDeListado = Awaited<
  ReturnType<typeof buscarAvisos>
>["avisos"][number];
