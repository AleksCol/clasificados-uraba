import Image from "next/image";
import Link from "next/link";
import type { AvisoDeListado } from "@/lib/avisos";
import { formatearFecha, formatearPrecio } from "@/lib/formato";
import { nombreMunicipio } from "@/lib/municipios";

export function TarjetaAviso({ aviso }: { aviso: AvisoDeListado }) {
  return (
    <li>
      <Link
        href={`/avisos/${aviso.id}`}
        className="flex h-full flex-col overflow-hidden rounded-xl border border-borde transition-colors hover:border-marca hover:bg-superficie"
      >
        {aviso.fotoUrl && (
          <div className="relative aspect-4/3 w-full bg-superficie">
            <Image
              src={aviso.fotoUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="flex flex-1 flex-col p-4">
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
        </div>
      </Link>
    </li>
  );
}
