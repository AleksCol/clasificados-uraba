import Link from "next/link";
import { FiltrosAvisos } from "@/components/avisos/FiltrosAvisos";
import { Paginacion } from "@/components/avisos/Paginacion";
import { PestanasTipo } from "@/components/avisos/PestanasTipo";
import { TarjetaAviso } from "@/components/avisos/TarjetaAviso";
import { Contenedor } from "@/components/layout/Contenedor";
import { buscarAvisos } from "@/lib/avisos";
import { hayFiltrosActivos, leerFiltros, urlListado, type ParamsCrudos } from "@/lib/filtros";
import { prisma } from "@/lib/prisma";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<ParamsCrudos>;
}) {
  const filtros = leerFiltros(await searchParams);

  const [{ avisos, total, paginas }, categorias] = await Promise.all([
    buscarAvisos(filtros),
    prisma.categoria.findMany({
      // Con una pestaña de tipo activa solo tienen sentido sus categorías.
      where: filtros.tipo ? { tipo: filtros.tipo } : undefined,
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
  ]);

  return (
    <Contenedor>
      <section className="py-10">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Empleos y artículos usados en Urabá
        </h1>
        <p className="mt-3 max-w-xl text-texto-suave">
          Publicado por gente de la región. El contacto es directo por WhatsApp,
          sin intermediarios.
        </p>
      </section>

      <div className="border-t border-borde pt-6">
        <PestanasTipo filtros={filtros} />
        <FiltrosAvisos filtros={filtros} categorias={categorias} />
      </div>

      <section className="py-8">
        {avisos.length === 0 ? (
          <div className="rounded-xl border border-borde bg-superficie px-4 py-12 text-center">
            <p className="text-texto-suave">
              {hayFiltrosActivos(filtros)
                ? "No hay avisos que coincidan con esta búsqueda."
                : "Todavía no hay avisos publicados."}
            </p>
            {hayFiltrosActivos(filtros) && (
              <Link
                href={urlListado(filtros, {
                  categoriaId: null,
                  municipio: null,
                  texto: "",
                  pagina: 1,
                })}
                className="mt-3 inline-block text-sm font-medium text-marca hover:underline"
              >
                Quitar los filtros
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-texto-suave">
              {total === 1 ? "1 aviso" : `${total} avisos`}
            </p>
            {/* items-start evita que una tarjeta con foto estire a las de al lado
                y les deje un hueco blanco que parece una imagen rota. */}
            <ul className="mt-4 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {avisos.map((aviso) => (
                <TarjetaAviso key={aviso.id} aviso={aviso} />
              ))}
            </ul>
            <Paginacion filtros={filtros} paginas={paginas} />
          </>
        )}
      </section>
    </Contenedor>
  );
}
