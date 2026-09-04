import { Contenedor } from "./Contenedor";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-borde bg-superficie">
      <Contenedor>
        <div className="flex flex-col gap-2 py-8 text-sm text-texto-suave sm:flex-row sm:items-center sm:justify-between">
          <p>Clasificados Urabá — empleos y artículos usados de la región.</p>
          <p>{new Date().getFullYear()}</p>
        </div>
      </Contenedor>
    </footer>
  );
}
