import type { Metadata } from "next";
import { Contenedor } from "@/components/layout/Contenedor";
import { Boton } from "@/components/ui/Boton";
import { requerirUsuario } from "@/lib/sesion";
import { salir } from "@/actions/auth";

export const metadata: Metadata = {
  title: "Mis avisos — Clasificados Urabá",
};

// Provisional: por ahora solo confirma la sesión. El listado de avisos del
// usuario y el CRUD van acá en el siguiente paso.
export default async function PaginaMisAvisos() {
  const usuario = await requerirUsuario();

  return (
    <Contenedor>
      <div className="py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Mis avisos</h1>
        <p className="mt-2 text-texto-suave">
          Hola, {usuario.nombre}. Tu WhatsApp de contacto es {usuario.whatsapp}.
        </p>

        <p className="mt-8 rounded-lg border border-borde bg-superficie px-4 py-3 text-sm text-texto-suave">
          Todavía no puedes publicar avisos: el formulario llega en el siguiente
          paso.
        </p>

        <form action={salir} className="mt-8">
          <Boton type="submit" variante="secundario">
            Cerrar sesión
          </Boton>
        </form>
      </div>
    </Contenedor>
  );
}
