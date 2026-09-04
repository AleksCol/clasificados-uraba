import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { TAMANO_MAXIMO_BYTES, TIPOS_DE_IMAGEN } from "@/lib/foto";
import { usuarioActual } from "@/lib/sesion";

// El navegador sube el archivo directo a Vercel Blob; esta ruta solo entrega el
// token que lo autoriza. Así las fotos grandes no pasan por la función
// serverless, que tiene un límite de 4.5 MB por petición.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const resultado = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const usuario = await usuarioActual();
        if (!usuario) {
          throw new Error("Necesitas iniciar sesión para subir fotos");
        }

        return {
          allowedContentTypes: TIPOS_DE_IMAGEN,
          maximumSizeInBytes: TAMANO_MAXIMO_BYTES,
          // Evita que dos personas que suban "foto.jpg" se pisen el archivo.
          addRandomSuffix: true,
          tokenPayload: usuario.id,
        };
      },
    });

    return NextResponse.json(resultado);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "No se pudo subir la foto";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
