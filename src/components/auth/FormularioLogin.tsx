"use client";

import { useActionState } from "react";
import { ingresar } from "@/actions/auth";
import { ESTADO_INICIAL } from "@/lib/formularios";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { AvisoError } from "@/components/ui/AvisoError";

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(ingresar, ESTADO_INICIAL);

  return (
    <form action={accion} className="flex flex-col gap-4">
      {estado.errorGeneral && <AvisoError mensaje={estado.errorGeneral} />}

      <Campo
        etiqueta="Correo"
        nombre="email"
        type="email"
        autoComplete="email"
        required
        errores={estado.errores?.email}
      />
      <Campo
        etiqueta="Contraseña"
        nombre="password"
        type="password"
        autoComplete="current-password"
        required
        errores={estado.errores?.password}
      />

      <Boton type="submit" disabled={enviando} className="mt-2">
        {enviando ? "Entrando..." : "Entrar"}
      </Boton>
    </form>
  );
}
