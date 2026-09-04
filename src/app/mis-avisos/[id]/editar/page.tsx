import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { actualizarAviso } from "@/actions/avisos";
import { FormularioAviso } from "@/components/avisos/FormularioAviso";
import { Contenedor } from "@/components/layout/Contenedor";
import { prisma } from "@/lib/prisma";
import { requerirUsuario } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Editar aviso — Clasificados Urabá",
};

export default async function PaginaEditarAviso({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await requerirUsuario();
  const { id } = await params;

  // El filtro por usuarioId es lo que impide abrir el aviso de otro: si no es
  // suyo responde 404, sin decir si el aviso existe.
  const [aviso, categorias] = await Promise.all([
    prisma.aviso.findFirst({
      where: { id, usuarioId: usuario.id },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        tipo: true,
        municipio: true,
        categoriaId: true,
        precio: true,
      },
    }),
    prisma.categoria.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, tipo: true },
    }),
  ]);

  if (!aviso) notFound();

  return (
    <Contenedor>
      <div className="mx-auto max-w-xl py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Editar aviso</h1>
        <p className="mt-2 mb-8 text-texto-suave">
          Los cambios se ven de inmediato en el listado público.
        </p>

        <FormularioAviso
          categorias={categorias}
          accion={actualizarAviso}
          textoBoton="Guardar cambios"
          valores={aviso}
        />
      </div>
    </Contenedor>
  );
}
