import type { Metadata } from "next";
import { crearAviso } from "@/actions/avisos";
import { FormularioAviso } from "@/components/avisos/FormularioAviso";
import { Contenedor } from "@/components/layout/Contenedor";
import { prisma } from "@/lib/prisma";
import { requerirUsuario } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Publicar aviso — Clasificados Urabá",
};

export default async function PaginaNuevoAviso() {
  await requerirUsuario();

  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, tipo: true },
  });

  return (
    <Contenedor>
      <div className="mx-auto max-w-xl py-12">
        <h1 className="text-2xl font-semibold tracking-tight">
          Publicar aviso
        </h1>
        <p className="mt-2 mb-8 text-texto-suave">
          Quien lo vea te va a escribir por WhatsApp al número de tu cuenta.
        </p>

        <FormularioAviso
          categorias={categorias}
          accion={crearAviso}
          textoBoton="Publicar aviso"
        />
      </div>
    </Contenedor>
  );
}
