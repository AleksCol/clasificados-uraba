import Link from "next/link";
import { Contenedor } from "@/components/layout/Contenedor";
import { MUNICIPIOS, nombreMunicipio } from "@/lib/municipios";

// Home provisional: el listado con filtros y búsqueda va acá en el siguiente paso.
export default function Home() {
  return (
    <Contenedor>
      <section className="py-14 sm:py-20">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Lo que se busca y se vende en Urabá, en un solo lugar.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-texto-suave">
          Ofertas de empleo y artículos usados publicados por gente de la
          región. El contacto es directo por WhatsApp.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/?tipo=empleo"
            className="rounded-lg bg-marca px-5 py-3 font-medium text-white transition-colors hover:bg-marca-oscuro"
          >
            Ver empleos
          </Link>
          <Link
            href="/?tipo=articulo"
            className="rounded-lg border border-borde px-5 py-3 font-medium transition-colors hover:bg-superficie"
          >
            Ver artículos
          </Link>
        </div>
      </section>

      <section className="border-t border-borde py-10">
        <h2 className="text-sm font-medium text-texto-suave">
          Municipios cubiertos
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {MUNICIPIOS.map((municipio) => (
            <li
              key={municipio}
              className="rounded-full bg-superficie px-3 py-1.5 text-sm text-texto-suave"
            >
              {nombreMunicipio(municipio)}
            </li>
          ))}
        </ul>
      </section>
    </Contenedor>
  );
}
