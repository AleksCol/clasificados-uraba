import Link from "next/link";
import { hayFiltrosActivos, urlListado, type Filtros } from "@/lib/filtros";
import { MUNICIPIOS, nombreMunicipio } from "@/lib/municipios";

type Props = {
  filtros: Filtros;
  categorias: { id: string; nombre: string }[];
};

const CONTROL =
  "w-full rounded-lg border border-borde bg-fondo px-3 py-2.5 text-base transition-colors focus:border-marca";

// Formulario GET: los filtros quedan en la URL, así que se pueden compartir y
// funcionan sin JavaScript.
export function FiltrosAvisos({ filtros, categorias }: Props) {
  return (
    <form method="get" className="mt-6 flex flex-col gap-3 sm:flex-row">
      {/* La pestaña activa no es un control del formulario, viaja aparte. */}
      {filtros.tipo && (
        <input type="hidden" name="tipo" value={filtros.tipo} />
      )}

      <div className="flex-1">
        <label htmlFor="q" className="sr-only">
          Buscar por título
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={filtros.texto}
          placeholder="Buscar por título"
          maxLength={100}
          className={CONTROL}
        />
      </div>

      <div className="sm:w-48">
        <label htmlFor="municipio" className="sr-only">
          Municipio
        </label>
        <select
          id="municipio"
          name="municipio"
          defaultValue={filtros.municipio ?? ""}
          className={CONTROL}
        >
          <option value="">Todos los municipios</option>
          {MUNICIPIOS.map((municipio) => (
            <option key={municipio} value={municipio}>
              {nombreMunicipio(municipio)}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:w-48">
        <label htmlFor="categoria" className="sr-only">
          Categoría
        </label>
        <select
          id="categoria"
          name="categoria"
          defaultValue={filtros.categoriaId ?? ""}
          className={CONTROL}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-marca px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-marca-oscuro"
        >
          Filtrar
        </button>
        {hayFiltrosActivos(filtros) && (
          <Link
            href={urlListado(filtros, {
              categoriaId: null,
              municipio: null,
              texto: "",
              pagina: 1,
            })}
            className="text-sm font-medium text-texto-suave hover:text-texto"
          >
            Limpiar
          </Link>
        )}
      </div>
    </form>
  );
}
