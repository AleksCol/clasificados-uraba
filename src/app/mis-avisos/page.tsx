import type { Metadata } from "next";
import Link from "next/link";
import { Contenedor } from "@/components/layout/Contenedor";
import { FilaAvisoPropio } from "@/components/avisos/FilaAvisoPropio";
import { prisma } from "@/lib/prisma";
import { requerirUsuario } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Mis avisos — Clasificados Urabá",
};

export default async function PaginaMisAvisos() {
  const usuario = await requerirUsuario();

  const avisos = await prisma.aviso.findMany({
    where: { usuarioId: usuario.id },
    orderBy: { publicadoEn: "desc" },
    select: {
      id: true,
      titulo: true,
      municipio: true,
      precio: true,
      activo: true,
      publicadoEn: true,
      categoria: { select: { nombre: true } },
    },
  });

  return (
    <Contenedor>
      <div className="py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Mis avisos</h1>
          <Link
            href="/mis-avisos/nuevo"
            className="rounded-lg bg-marca px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-marca-oscuro"
          >
            Publicar aviso
          </Link>
        </div>

        {avisos.length === 0 ? (
          <p className="mt-8 rounded-lg border border-borde bg-superficie px-4 py-8 text-center text-texto-suave">
            Todavía no has publicado nada. Empieza con tu primer aviso.
          </p>
        ) : (
          <ul className="mt-6 border-t border-borde">
            {avisos.map((aviso) => (
              <FilaAvisoPropio key={aviso.id} aviso={aviso} />
            ))}
          </ul>
        )}
      </div>
    </Contenedor>
  );
}
