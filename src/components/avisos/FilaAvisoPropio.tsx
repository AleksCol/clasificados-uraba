import Link from "next/link";
import { cambiarEstadoAviso } from "@/actions/avisos";
import { formatearFecha, formatearPrecio } from "@/lib/formato";
import { nombreMunicipio } from "@/lib/municipios";
import type { Municipio } from "@/generated/prisma/enums";

type Props = {
  aviso: {
    id: string;
    titulo: string;
    municipio: Municipio;
    precio: number | null;
    activo: boolean;
    publicadoEn: Date;
    categoria: { nombre: string };
  };
};

export function FilaAvisoPropio({ aviso }: Props) {
  return (
    <li className="flex flex-col gap-3 border-b border-borde py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="truncate font-medium">{aviso.titulo}</h2>
          {!aviso.activo && (
            <span className="shrink-0 rounded-full bg-superficie px-2 py-0.5 text-xs text-texto-suave">
              Pausado
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-texto-suave">
          {aviso.categoria.nombre} · {nombreMunicipio(aviso.municipio)}
          {aviso.precio !== null && ` · ${formatearPrecio(aviso.precio)}`} ·{" "}
          {formatearFecha(aviso.publicadoEn)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <Link
          href={`/mis-avisos/${aviso.id}/editar`}
          className="text-sm font-medium text-marca hover:underline"
        >
          Editar
        </Link>
        <form action={cambiarEstadoAviso}>
          <input type="hidden" name="id" value={aviso.id} />
          <input
            type="hidden"
            name="activo"
            value={aviso.activo ? "false" : "true"}
          />
          <button
            type="submit"
            className="text-sm font-medium text-texto-suave hover:text-texto"
          >
            {aviso.activo ? "Pausar" : "Reactivar"}
          </button>
        </form>
      </div>
    </li>
  );
}
