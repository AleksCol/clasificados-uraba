import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Contenedor } from "@/components/layout/Contenedor";
import { formatearFecha, formatearPrecio } from "@/lib/formato";
import { nombreMunicipio } from "@/lib/municipios";
import { prisma } from "@/lib/prisma";
import { enlaceWhatsapp } from "@/lib/whatsapp";

// Solo los avisos activos son públicos. Uno pausado responde 404 igual que uno
// inexistente, para no confirmar qué ids existen.
async function obtenerAviso(id: string) {
  return prisma.aviso.findFirst({
    where: { id, activo: true },
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      municipio: true,
      precio: true,
      publicadoEn: true,
      categoria: { select: { nombre: true } },
      usuario: { select: { nombre: true, whatsapp: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const aviso = await obtenerAviso(id);
  if (!aviso) return { title: "Aviso no encontrado — Clasificados Urabá" };

  return {
    title: `${aviso.titulo} — Clasificados Urabá`,
    description: aviso.descripcion.slice(0, 160),
  };
}

export default async function PaginaAviso({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const aviso = await obtenerAviso(id);

  if (!aviso) notFound();

  return (
    <Contenedor>
      <article className="mx-auto max-w-2xl py-10">
        <Link
          href="/"
          className="text-sm font-medium text-texto-suave hover:text-texto"
        >
          ← Volver al listado
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          {aviso.titulo}
        </h1>

        <p className="mt-2 text-texto-suave">
          {aviso.categoria.nombre} · {nombreMunicipio(aviso.municipio)} ·{" "}
          {formatearFecha(aviso.publicadoEn)}
        </p>

        {aviso.precio !== null && (
          <p className="mt-4 text-2xl font-semibold text-marca-oscuro">
            {formatearPrecio(aviso.precio)}
          </p>
        )}

        <p className="mt-6 whitespace-pre-line leading-relaxed">
          {aviso.descripcion}
        </p>

        <div className="mt-10 rounded-xl border border-borde bg-superficie p-5">
          <p className="text-sm text-texto-suave">
            Publicado por {aviso.usuario.nombre}
          </p>
          <a
            href={enlaceWhatsapp(aviso.usuario.whatsapp, aviso.titulo)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-lg bg-marca px-5 py-3 font-medium text-white transition-colors hover:bg-marca-oscuro"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </article>
    </Contenedor>
  );
}
