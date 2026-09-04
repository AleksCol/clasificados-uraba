"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { LADO_MAXIMO_PX, TAMANO_MAXIMO_BYTES, TIPOS_DE_IMAGEN } from "@/lib/foto";

type Props = {
  urlInicial?: string | null;
  errores?: string[];
};

type Estado = "vacio" | "procesando" | "subiendo" | "listo";

// Reduce la foto antes de subirla: las cámaras de celular sacan imágenes de
// varios megas y en el listado nunca se ven a más de 1600 px. Le ahorra datos
// móviles a quien publica y hace la subida mucho más rápida.
async function reducirImagen(archivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo, {
    // Respeta la rotación que traen las fotos de celular en el EXIF.
    imageOrientation: "from-image",
  });

  const escala = Math.min(
    1,
    LADO_MAXIMO_PX / Math.max(bitmap.width, bitmap.height),
  );
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;

  const contexto = lienzo.getContext("2d");
  if (!contexto) throw new Error("El navegador no pudo procesar la imagen");

  contexto.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  return new Promise((resolver, rechazar) => {
    lienzo.toBlob(
      (blob) =>
        blob ? resolver(blob) : rechazar(new Error("No se pudo procesar la imagen")),
      "image/jpeg",
      0.82,
    );
  });
}

export function CampoFoto({ urlInicial, errores }: Props) {
  const [url, setUrl] = useState<string | null>(urlInicial ?? null);
  const [estado, setEstado] = useState<Estado>(urlInicial ? "listo" : "vacio");
  const [error, setError] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const trabajando = estado === "procesando" || estado === "subiendo";

  async function alElegirArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    setError(null);

    if (!TIPOS_DE_IMAGEN.includes(archivo.type)) {
      setError("Solo se aceptan imágenes JPG, PNG o WEBP");
      return;
    }

    try {
      setEstado("procesando");
      const reducida = await reducirImagen(archivo);

      if (reducida.size > TAMANO_MAXIMO_BYTES) {
        setError("La foto sigue siendo muy pesada. Prueba con otra.");
        setEstado(url ? "listo" : "vacio");
        return;
      }

      setEstado("subiendo");
      const subida = await upload(`avisos/${archivo.name}.jpg`, reducida, {
        access: "public",
        handleUploadUrl: "/api/avisos/foto",
        contentType: "image/jpeg",
      });

      setUrl(subida.url);
      setEstado("listo");
    } catch (fallo) {
      setError(
        fallo instanceof Error ? fallo.message : "No se pudo subir la foto",
      );
      setEstado(url ? "listo" : "vacio");
    } finally {
      // Permite volver a elegir el mismo archivo si algo falló.
      if (entrada.current) entrada.current.value = "";
    }
  }

  function quitarFoto() {
    setUrl(null);
    setError(null);
    setEstado("vacio");
    if (entrada.current) entrada.current.value = "";
  }

  const mensajeError = error ?? errores?.[0];

  return (
    <div>
      <span className="block text-sm font-medium">Foto (opcional)</span>

      {/* Lo que viaja con el formulario es la URL, no el archivo. */}
      <input type="hidden" name="fotoUrl" value={url ?? ""} />

      {url && (
        <div className="relative mt-2 aspect-4/3 w-full max-w-xs overflow-hidden rounded-lg border border-borde">
          <Image
            src={url}
            alt="Foto del aviso"
            fill
            sizes="320px"
            className="object-cover"
          />
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-3">
        {/* El input va oculto y el botón es esta etiqueta. El botón nativo lo
            dibuja el navegador en su propio idioma, y además seguía diciendo
            "ningún archivo" después de subir, porque limpiamos el input para
            poder reintentar con el mismo archivo. */}
        <label
          className={`rounded-lg border border-borde px-3 py-2 text-sm font-medium transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-marca ${
            trabajando
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:bg-superficie"
          }`}
        >
          <input
            ref={entrada}
            id="archivoFoto"
            type="file"
            accept={TIPOS_DE_IMAGEN.join(",")}
            onChange={alElegirArchivo}
            disabled={trabajando}
            aria-describedby="foto-ayuda"
            className="sr-only"
          />
          {url ? "Cambiar foto" : "Elegir foto"}
        </label>

        {url && !trabajando && (
          <button
            type="button"
            onClick={quitarFoto}
            className="text-sm font-medium text-texto-suave hover:text-texto"
          >
            Quitar foto
          </button>
        )}
      </div>

      <p id="foto-ayuda" aria-live="polite" className="mt-1.5 text-sm text-texto-suave">
        {estado === "procesando" && "Preparando la imagen..."}
        {estado === "subiendo" && "Subiendo la foto..."}
        {estado === "listo" && "Foto lista."}
        {estado === "vacio" && "Se reduce automáticamente antes de subirla."}
      </p>

      {mensajeError && (
        <p role="alert" className="mt-1.5 text-sm text-red-600">
          {mensajeError}
        </p>
      )}
    </div>
  );
}
