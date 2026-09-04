import Link from "next/link";
import { Contenedor } from "./Contenedor";

export function Header() {
  return (
    <header className="border-b border-borde bg-fondo">
      <Contenedor>
        <div className="flex h-16 items-center justify-between gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Clasificados <span className="text-marca">Urabá</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-texto-suave transition-colors hover:text-texto"
            >
              Ingresar
            </Link>
            <Link
              href="/mis-avisos/nuevo"
              className="rounded-md bg-marca px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-marca-oscuro"
            >
              Publicar aviso
            </Link>
          </nav>
        </div>
      </Contenedor>
    </header>
  );
}
