import Link from "next/link";
import type { TipoAviso } from "@/generated/prisma/enums";
import { urlListado, type Filtros } from "@/lib/filtros";

const PESTANAS: { tipo: TipoAviso | null; texto: string }[] = [
  { tipo: null, texto: "Todo" },
  { tipo: "empleo", texto: "Empleos" },
  { tipo: "articulo", texto: "Artículos" },
];

export function PestanasTipo({ filtros }: { filtros: Filtros }) {
  return (
    <nav className="flex gap-1">
      {PESTANAS.map((pestana) => {
        const activa = filtros.tipo === pestana.tipo;
        return (
          <Link
            key={pestana.texto}
            // Al cambiar de tipo la categoría deja de aplicar, así que se limpia.
            href={urlListado(filtros, {
              tipo: pestana.tipo,
              categoriaId: null,
              pagina: 1,
            })}
            aria-current={activa ? "page" : undefined}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activa
                ? "bg-marca-suave text-marca-oscuro"
                : "text-texto-suave hover:bg-superficie hover:text-texto"
            }`}
          >
            {pestana.texto}
          </Link>
        );
      })}
    </nav>
  );
}
