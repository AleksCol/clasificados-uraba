"use client";

import { useActionState } from "react";
import { registrar } from "@/actions/auth";
import { ESTADO_INICIAL } from "@/lib/formularios";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { AvisoError } from "@/components/ui/AvisoError";

export function FormularioRegistro() {
  const [estado, accion, enviando] = useActionState(registrar, ESTADO_INICIAL);

  return (
    <form action={accion} className="flex flex-col gap-4">
      {estado.errorGeneral && <AvisoError mensaje={estado.errorGeneral} />}

      <Campo
        etiqueta="Nombre"
        nombre="nombre"
        type="text"
        autoComplete="name"
        required
        errores={estado.errores?.nombre}
      />
      <Campo
        etiqueta="Correo"
        nombre="email"
        type="email"
        autoComplete="email"
        required
        errores={estado.errores?.email}
      />
      <Campo
        etiqueta="WhatsApp"
        nombre="whatsapp"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        placeholder="300 123 4567"
        ayuda="Es el número con el que te van a contactar por tus avisos."
        errores={estado.errores?.whatsapp}
      />
      <Campo
        etiqueta="Contraseña"
        nombre="password"
        type="password"
        autoComplete="new-password"
        required
        ayuda="Mínimo 8 caracteres."
        errores={estado.errores?.password}
      />

      <Boton type="submit" disabled={enviando} className="mt-2">
        {enviando ? "Creando cuenta..." : "Crear cuenta"}
      </Boton>
    </form>
  );
}
