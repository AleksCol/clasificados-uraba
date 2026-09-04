import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormularioRegistro } from "@/components/auth/FormularioRegistro";
import { usuarioActual } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Crear cuenta — Clasificados Urabá",
};

export default async function PaginaRegistro() {
  if (await usuarioActual()) redirect("/mis-avisos");

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
      <p className="mt-2 mb-8 text-texto-suave">
        Necesitas una cuenta para publicar avisos. Ver los avisos no requiere
        registrarse.
      </p>

      <FormularioRegistro />

      <p className="mt-6 text-sm text-texto-suave">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-marca hover:underline">
          Entra aquí
        </Link>
      </p>
    </>
  );
}
