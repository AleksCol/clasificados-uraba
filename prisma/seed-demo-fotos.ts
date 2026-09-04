import "dotenv/config";
import { del, list, put } from "@vercel/blob";
import puppeteer from "puppeteer-core";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

// Genera una imagen por cada artículo de muestra y la sube al store, para que
// el listado no se vea solo de texto al mostrar el proyecto.
//
// No son fotos: son placeholders tipográficos generados acá. Poner fotos de
// producto sacadas de internet sería a la vez un problema de licencia y una
// mentira sobre avisos que no existen. Van etiquetadas como muestra.
//
// Muestran la categoría y no el título, que ya va debajo de la imagen en la
// tarjeta: repetirlo se veía redundante.
const DOMINIO_DEMO = "@demo.local";
const PREFIJO = "avisos/demo/";

const NAVEGADOR =
  process.env.RUTA_NAVEGADOR ??
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

// Tintes del propio sistema de color, para que el grid no quede monótono.
const FONDOS = [
  { fondo: "#e8f3ee", texto: "#0a5c41" },
  { fondo: "#eef1ea", texto: "#3f4a3d" },
  { fondo: "#e7eef3", texto: "#2b4a5c" },
  { fondo: "#f2eee7", texto: "#5c4a2b" },
];

function paginaHtml(categoria: string, indice: number): string {
  const { fondo, texto } = FONDOS[indice % FONDOS.length];
  const escapado = categoria
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 900px; background: ${fondo}; color: ${texto};
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 72px;
    font-family: "Segoe UI", system-ui, sans-serif;
  }
  h1 { font-size: 92px; line-height: 1.1; font-weight: 600; letter-spacing: -0.02em; }
  .marca { font-size: 26px; opacity: 0.55; }
  .pie { display: flex; justify-content: space-between; font-size: 24px; opacity: 0.5; }
</style></head>
<body>
  <p class="marca">Clasificados Urabá</p>
  <h1>${escapado}</h1>
  <div class="pie"><span>Imagen de muestra</span></div>
</body></html>`;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Falta la variable de entorno DATABASE_URL");
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Falta la variable de entorno BLOB_READ_WRITE_TOKEN");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });

  // Solo los artículos: una oferta de empleo no lleva foto.
  const avisos = await prisma.aviso.findMany({
    where: { tipo: "articulo", usuario: { email: { endsWith: DOMINIO_DEMO } } },
    select: { id: true, titulo: true, categoria: { select: { nombre: true } } },
    orderBy: { publicadoEn: "desc" },
  });

  if (avisos.length === 0) {
    console.log("No hay artículos de muestra. Corre primero: npm run db:seed-demo");
    await prisma.$disconnect();
    return;
  }

  // Se borran las anteriores antes de generar. Reusar la misma ruta con
  // allowOverwrite mantendría la URL, y entonces el optimizador de Next y el
  // CDN seguirían sirviendo la imagen vieja desde caché.
  const { blobs } = await list({ prefix: PREFIJO });
  if (blobs.length > 0) {
    await del(blobs.map((b) => b.url));
    console.log(`Se borraron ${blobs.length} imágenes anteriores.
`);
  }

  const navegador = await puppeteer.launch({ executablePath: NAVEGADOR, headless: true });
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: 1200, height: 900 });

  let listas = 0;
  for (const [indice, aviso] of avisos.entries()) {
    await pagina.setContent(paginaHtml(aviso.categoria.nombre, indice), { waitUntil: "load" });
    const imagen = await pagina.screenshot({ type: "jpeg", quality: 88 });

    // Sufijo aleatorio: cada corrida produce una URL nueva, así que ninguna
    // caché puede devolver la imagen anterior.
    const subida = await put(`${PREFIJO}${aviso.id}.jpg`, Buffer.from(imagen), {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: true,
    });

    await prisma.aviso.update({
      where: { id: aviso.id },
      data: { fotoUrl: subida.url },
    });
    listas++;
    console.log(`  ${aviso.titulo}`);
  }

  await navegador.close();
  console.log(`\nListo: ${listas} imágenes generadas y subidas.`);
  console.log("Se borran junto con el resto: npm run db:seed-demo:limpiar");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
