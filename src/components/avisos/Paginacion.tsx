import Link from "next/link";
import { urlListado, type Filtros } from "@/lib/filtros";

type Props = { filtros: Filtros; paginas: number };

const ENLACE =
  "rounded-lg border border-borde px-4 py-2 text-sm font-medium transition-colors hover:bg-superficie";

export function Paginacion({ filtros, paginas }: Props) {
  if (paginas <= 1) return null;

  return (
    <nav className="mt-10 flex items-center justify-between gap-4">
      {filtros.pagina > 1 ? (
        <Link href={urlListado(filtros, { pagina: filtros.pagina - 1 })} className={ENLACE}>
          Anterior
        </Link>
      ) : (
        <span />
      )}

      <p className="text-sm text-texto-suave">
        Página {filtros.pagina} de {paginas}
      </p>

      {filtros.pagina < paginas ? (
        <Link href={urlListado(filtros, { pagina: filtros.pagina + 1 })} className={ENLACE}>
          Siguiente
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
