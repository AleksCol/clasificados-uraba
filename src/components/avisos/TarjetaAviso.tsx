import Link from "next/link";
import type { AvisoDeListado } from "@/lib/avisos";
import { formatearFecha, formatearPrecio } from "@/lib/formato";
import { nombreMunicipio } from "@/lib/municipios";

export function TarjetaAviso({ aviso }: { aviso: AvisoDeListado }) {
  return (
    <li>
      <Link
        href={`/avisos/${aviso.id}`}
        className="flex h-full flex-col rounded-xl border border-borde p-4 transition-colors hover:border-marca hover:bg-superficie"
      >
        <h3 className="font-medium">{aviso.titulo}</h3>

        <p className="mt-1 text-sm text-texto-suave">
          {aviso.categoria.nombre} · {nombreMunicipio(aviso.municipio)}
        </p>

        {aviso.precio !== null && (
          <p className="mt-3 font-semibold text-marca-oscuro">
            {formatearPrecio(aviso.precio)}
          </p>
        )}

        <p className="mt-auto pt-3 text-sm text-texto-suave">
          {formatearFecha(aviso.publicadoEn)}
        </p>
      </Link>
    </li>
  );
}
