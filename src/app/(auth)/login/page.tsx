import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormularioLogin } from "@/components/auth/FormularioLogin";
import { usuarioActual } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Entrar — Clasificados Urabá",
};

export default async function PaginaLogin() {
  if (await usuarioActual()) redirect("/mis-avisos");

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
      <p className="mt-2 mb-8 text-texto-suave">
        Entra para publicar y administrar tus avisos.
      </p>

      <FormularioLogin />

      <p className="mt-6 text-sm text-texto-suave">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-marca hover:underline">
          Créala aquí
        </Link>
      </p>
    </>
  );
}
