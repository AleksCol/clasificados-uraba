import Link from "next/link";
import { salir } from "@/actions/auth";
import { usuarioActual } from "@/lib/sesion";
import { Contenedor } from "./Contenedor";

const ENLACE = "rounded-md px-3 py-2 text-sm font-medium transition-colors";

export async function Header() {
  const usuario = await usuarioActual();

  return (
    <header className="border-b border-borde bg-fondo">
      <Contenedor>
        <div className="flex h-16 items-center justify-between gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Clasificados <span className="text-marca">Urabá</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {usuario ? (
              <>
                <Link
                  href="/mis-avisos"
                  className={`${ENLACE} text-texto-suave hover:text-texto`}
                >
                  Mis avisos
                </Link>
                <form action={salir}>
                  <button
                    type="submit"
                    className={`${ENLACE} text-texto-suave hover:text-texto`}
                  >
                    Salir
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className={`${ENLACE} text-texto-suave hover:text-texto`}
              >
                Ingresar
              </Link>
            )}

            <Link
              href="/mis-avisos/nuevo"
              className={`${ENLACE} bg-marca text-white hover:bg-marca-oscuro`}
            >
              Publicar aviso
            </Link>
          </nav>
        </div>
      </Contenedor>
    </header>
  );
}
