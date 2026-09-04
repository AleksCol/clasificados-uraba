"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Municipio, TipoAviso } from "@/generated/prisma/enums";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/formularios";
import { MUNICIPIOS, nombreMunicipio } from "@/lib/municipios";
import { AreaTexto } from "@/components/ui/AreaTexto";
import { AvisoError } from "@/components/ui/AvisoError";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Select } from "@/components/ui/Select";
import { CampoFoto } from "./CampoFoto";

export type CategoriaOpcion = { id: string; nombre: string; tipo: TipoAviso };

export type ValoresAviso = {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoAviso;
  municipio: Municipio;
  categoriaId: string;
  precio: number | null;
  fotoUrl: string | null;
};

type Props = {
  categorias: CategoriaOpcion[];
  accion: (
    estado: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  textoBoton: string;
  valores?: ValoresAviso;
};

const TIPOS: { valor: TipoAviso; texto: string }[] = [
  { valor: "empleo", texto: "Oferta de empleo" },
  { valor: "articulo", texto: "Artículo usado" },
];

export function FormularioAviso({
  categorias,
  accion,
  textoBoton,
  valores,
}: Props) {
  const [estado, enviar, enviando] = useActionState(accion, ESTADO_INICIAL);
  const [tipo, setTipo] = useState<TipoAviso>(valores?.tipo ?? "empleo");

  const categoriasDelTipo = categorias.filter(
    (categoria) => categoria.tipo === tipo,
  );

  return (
    <form action={enviar} className="flex flex-col gap-5">
      {valores && <input type="hidden" name="id" value={valores.id} />}
      {estado.errorGeneral && <AvisoError mensaje={estado.errorGeneral} />}

      <fieldset>
        <legend className="text-sm font-medium">¿Qué vas a publicar?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {TIPOS.map((opcion) => (
            <label
              key={opcion.valor}
              className={`cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-marca ${
                tipo === opcion.valor
                  ? "border-marca bg-marca-suave text-marca-oscuro"
                  : "border-borde hover:bg-superficie"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={opcion.valor}
                checked={tipo === opcion.valor}
                onChange={() => setTipo(opcion.valor)}
                className="sr-only"
              />
              {opcion.texto}
            </label>
          ))}
        </div>
      </fieldset>

      <Campo
        etiqueta="Título"
        nombre="titulo"
        type="text"
        required
        maxLength={120}
        defaultValue={valores?.titulo}
        placeholder={
          tipo === "empleo"
            ? "Auxiliar de bodega en Apartadó"
            : "Nevera Haceb de 300 litros"
        }
        errores={estado.errores?.titulo}
      />

      <AreaTexto
        etiqueta="Descripción"
        nombre="descripcion"
        required
        maxLength={2000}
        defaultValue={valores?.descripcion}
        ayuda={
          tipo === "empleo"
            ? "Cuenta el horario, los requisitos y cómo es el pago."
            : "Cuenta el estado en que está y hace cuánto lo tienes."
        }
        errores={estado.errores?.descripcion}
      />

      <Select
        // Al cambiar el tipo se remonta el select con las categorías nuevas.
        // La key lleva prefijo porque hay otro control que también se remonta.
        key={`categoria-${tipo}`}
        etiqueta="Categoría"
        nombre="categoriaId"
        opciones={categoriasDelTipo.map((categoria) => ({
          valor: categoria.id,
          texto: categoria.nombre,
        }))}
        defaultValue={valores?.categoriaId}
        errores={estado.errores?.categoriaId}
      />

      <Select
        etiqueta="Municipio"
        nombre="municipio"
        opciones={MUNICIPIOS.map((municipio) => ({
          valor: municipio,
          texto: nombreMunicipio(municipio),
        }))}
        defaultValue={valores?.municipio}
        errores={estado.errores?.municipio}
      />

      {tipo === "articulo" && (
        <CampoFoto
          // Al cambiar de tipo se descarta lo que hubiera cargado.
          key={`foto-${tipo}`}
          urlInicial={valores?.fotoUrl}
          errores={estado.errores?.fotoUrl}
        />
      )}

      {tipo === "articulo" && (
        <Campo
          etiqueta="Precio"
          nombre="precio"
          type="text"
          inputMode="numeric"
          defaultValue={valores?.precio ?? ""}
          placeholder="150000"
          ayuda="En pesos. Déjalo vacío si prefieres no mostrar el precio."
          errores={estado.errores?.precio}
        />
      )}

      <div className="mt-2 flex items-center gap-4">
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : textoBoton}
        </Boton>
        <Link
          href="/mis-avisos"
          className="text-sm font-medium text-texto-suave hover:text-texto"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
