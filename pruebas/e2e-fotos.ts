import { del, head, put } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import {
  BASE,
  DOMINIO_PRUEBA,
  MARCA_AVISO,
  afirmar,
  crearPrisma,
  limpiar,
  postear,
  quedaLimpio,
  registrar,
  terminar,
} from "./comun";
import { esUrlDeFoto } from "../src/lib/foto";

const EMAIL = `fotografo${DOMINIO_PRUEBA}`;
const prisma = crearPrisma();
const blobsCreados: string[] = [];

// PNG minimo de 1x1 px, suficiente para ejercitar el store de verdad.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function subirAlStore(nombre: string): Promise<string> {
  const r = await put(`avisos/${nombre}`, PNG, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: true,
  });
  blobsCreados.push(r.url);
  return r.url;
}

async function existeEnStore(url: string): Promise<boolean> {
  try {
    await head(url);
    return true;
  } catch {
    return false;
  }
}

async function pedirToken(cookie?: string) {
  return fetch(`${BASE}/api/avisos/foto`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: {
        pathname: "avisos/prueba.jpg",
        callbackUrl: `${BASE}/api/avisos/foto`,
        clientPayload: null,
        multipart: false,
      },
    }),
  });
}

async function main() {
  await limpiar(prisma);

  // --- La ruta del token exige sesion ---
  const sinSesion = await pedirToken();
  afirmar(sinSesion.status === 400, "sin sesion, la ruta de subida responde 400");
  afirmar((await sinSesion.text()).includes("iniciar sesión"), "y explica que hay que entrar");

  const cookie = await registrar("Fotografo", EMAIL, "300 555 4433");

  const conSesion = await pedirToken(cookie);
  const cuerpo = await conSesion.json();
  afirmar(conSesion.status === 200, "con sesion, la ruta responde 200");
  afirmar(cuerpo?.type === "blob.generate-client-token", "devuelve un token de subida");
  afirmar(typeof cuerpo?.clientToken === "string" && cuerpo.clientToken.length > 0, "el token no viene vacio");

  // --- Camino real del navegador: upload() pide el token y sube directo ---
  const subidaCliente = await upload(
    "avisos/foto-de-prueba.jpg",
    new Blob([PNG as unknown as BlobPart], { type: "image/png" }),
    {
      access: "public",
      handleUploadUrl: `${BASE}/api/avisos/foto`,
      contentType: "image/png",
      headers: { Cookie: cookie },
    },
  );
  blobsCreados.push(subidaCliente.url);
  afirmar(esUrlDeFoto(subidaCliente.url), "upload() del cliente devuelve una URL valida");
  afirmar((await fetch(subidaCliente.url)).status === 200, "un visitante sin sesion puede ver la foto");
  afirmar(subidaCliente.pathname !== "avisos/foto-de-prueba.jpg", "el sufijo aleatorio evita pisar archivos ajenos");

  let rechazado = false;
  try {
    await upload("avisos/intruso.jpg", new Blob([PNG as unknown as BlobPart], { type: "image/png" }), {
      access: "public",
      handleUploadUrl: `${BASE}/api/avisos/foto`,
      contentType: "image/png",
    });
  } catch {
    rechazado = true;
  }
  afirmar(rechazado, "sin sesion, upload() del cliente falla");

  // --- Validacion del host ---
  afirmar(!esUrlDeFoto("https://evil.example.com/foto.jpg"), "rechaza una URL de otro dominio");
  afirmar(!esUrlDeFoto("http://abc.public.blob.vercel-storage.com/x.jpg"), "rechaza http sin cifrar");
  afirmar(!esUrlDeFoto("no-es-una-url"), "rechaza texto que no es URL");

  const catArticulo = await prisma.categoria.findFirstOrThrow({ where: { nombre: "Muebles y hogar" } });
  const catEmpleo = await prisma.categoria.findFirstOrThrow({ where: { nombre: "Agro y banano" } });

  // --- Crear un aviso con foto ---
  const urlFoto = await subirAlStore("nevera.png");
  await postear("/mis-avisos/nuevo", {
    titulo: "Nevera Haceb de 300 litros",
    descripcion: "Funciona perfecto, la vendo porque me mudo de Apartado.",
    tipo: "articulo",
    municipio: "apartado",
    categoriaId: catArticulo.id,
    precio: "850000",
    fotoUrl: urlFoto,
  }, cookie, MARCA_AVISO);

  const aviso = await prisma.aviso.findFirstOrThrow({ where: { usuario: { email: EMAIL } } });
  afirmar(aviso.fotoUrl === urlFoto, "guarda la URL de la foto en el aviso");

  const detalle = await fetch(`${BASE}/avisos/${aviso.id}`).then((r) => r.text());
  afirmar(detalle.includes("_next/image"), "el detalle sirve la foto por el optimizador de Next");
  afirmar(detalle.includes(encodeURIComponent(urlFoto).slice(0, 40)), "y apunta a la foto correcta");
  afirmar((await fetch(`${BASE}/`).then((r) => r.text())).includes("_next/image"), "la tarjeta del listado tambien la muestra");

  // --- Una URL ajena no se guarda ---
  const ajena = await postear("/mis-avisos/nuevo", {
    titulo: "Aviso con foto de otro dominio",
    descripcion: "Este aviso intenta guardar una URL que no viene del store propio.",
    tipo: "articulo",
    municipio: "turbo",
    categoriaId: catArticulo.id,
    precio: "100000",
    fotoUrl: "https://evil.example.com/rastreador.jpg",
  }, cookie, MARCA_AVISO);
  afirmar((await ajena.text()).includes("subida válida"), "rechaza guardar una URL de otro dominio");

  const empleoConFoto = await postear("/mis-avisos/nuevo", {
    titulo: "Operario de finca bananera",
    descripcion: "Se busca operario con experiencia en labores de campo.",
    tipo: "empleo",
    municipio: "carepa",
    categoriaId: catEmpleo.id,
    precio: "",
    fotoUrl: urlFoto,
  }, cookie, MARCA_AVISO);
  afirmar((await empleoConFoto.text()).includes("no llevan foto"), "rechaza foto en una oferta de empleo");

  const cuantos = await prisma.aviso.count({ where: { usuario: { email: EMAIL } } });
  afirmar(cuantos === 1, `ningun aviso invalido llego a la base (${cuantos})`);

  // --- Reemplazar la foto borra la anterior ---
  const urlNueva = await subirAlStore("nevera-nueva.png");
  const datosEdicion = {
    id: aviso.id,
    titulo: "Nevera Haceb de 300 litros",
    descripcion: "Funciona perfecto, la vendo porque me mudo de Apartado.",
    tipo: "articulo",
    municipio: "apartado",
    categoriaId: catArticulo.id,
    precio: "850000",
  };
  await postear(`/mis-avisos/${aviso.id}/editar`, { ...datosEdicion, fotoUrl: urlNueva }, cookie, MARCA_AVISO);

  afirmar(
    (await prisma.aviso.findUniqueOrThrow({ where: { id: aviso.id } })).fotoUrl === urlNueva,
    "el aviso quedo con la foto nueva",
  );
  afirmar(!(await existeEnStore(urlFoto)), "la foto anterior se borro del store");
  afirmar(await existeEnStore(urlNueva), "la foto nueva sigue en el store");

  // --- Quitarla tambien la borra ---
  await postear(`/mis-avisos/${aviso.id}/editar`, { ...datosEdicion, fotoUrl: "" }, cookie, MARCA_AVISO);
  afirmar(
    (await prisma.aviso.findUniqueOrThrow({ where: { id: aviso.id } })).fotoUrl === null,
    "quitar la foto la deja en null",
  );
  afirmar(!(await existeEnStore(urlNueva)), "y tambien la borro del store");

  for (const url of blobsCreados) await del(url).catch(() => {});
  await limpiar(prisma);
  afirmar(await quedaLimpio(prisma), "la base queda limpia");

  await prisma.$disconnect();
  terminar();
}

main().catch(async (e) => {
  console.error(e);
  for (const url of blobsCreados) await del(url).catch(() => {});
  process.exit(1);
});
