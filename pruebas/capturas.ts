import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { del } from "@vercel/blob";
import puppeteer, { type ElementHandle, type Page } from "puppeteer-core";
import { BASE, DOMINIO_PRUEBA, PASSWORD, crearPrisma, limpiar } from "./comun";
import { normalizarTexto } from "../src/lib/texto";

const EDGE =
  process.env.RUTA_NAVEGADOR ??
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const EMAIL = `capturas${DOMINIO_PRUEBA}`;
const prisma = crearPrisma();

// Avisos con los que se ve el panel "Mis avisos": mezclan tipos, estados y
// municipios para que la captura muestre algo parecido a un uso real.
const AVISOS_DEL_PANEL = [
  { titulo: "Moto Yamaha BWS 125 modelo 2021", categoria: "Motos", tipo: "articulo" as const, municipio: "apartado" as const, precio: 5200000, activo: true },
  { titulo: "Nevera Haceb de 300 litros", categoria: "Muebles y hogar", tipo: "articulo" as const, municipio: "apartado" as const, precio: 850000, activo: true },
  { titulo: "Se busca ayudante de bodega", categoria: "Comercio y ventas", tipo: "empleo" as const, municipio: "carepa" as const, precio: null, activo: true },
  { titulo: "Bicicleta todoterreno rin 29", categoria: "Bicicletas", tipo: "articulo" as const, municipio: "turbo" as const, precio: 650000, activo: false },
];

async function capturarElemento(pagina: Page, selector: string, archivo: string, margen = 24) {
  const caja = await pagina.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
  }, selector);
  if (!caja) throw new Error(`No encontre ${selector}`);

  await pagina.screenshot({
    path: `capturas/${archivo}` as `${string}.png`,
    clip: {
      x: Math.max(0, caja.x - margen),
      y: Math.max(0, caja.y - margen),
      width: caja.width + margen * 2,
      height: caja.height + margen * 2,
    },
  });
  console.log(`  ${archivo}  ${Math.round(caja.width)}x${Math.round(caja.height)}`);
}

// Imagen local para subir por el formulario, y de paso ejercitar el reducido
// por canvas del navegador, que las pruebas por HTTP no tocan.
async function crearImagenLocal(pagina: Page): Promise<string> {
  await pagina.setContent(
    `<body style="margin:0;width:1400px;height:1050px;background:#dfe6e0;
       display:flex;align-items:center;justify-content:center;
       font-family:'Segoe UI',sans-serif;color:#2f4038;font-size:64px">
       Foto del artículo</body>`,
    { waitUntil: "load" },
  );
  const buffer = await pagina.screenshot({ type: "jpeg", quality: 90 });
  const ruta = join(tmpdir(), "foto-captura.jpg");
  writeFileSync(ruta, Buffer.from(buffer));
  return ruta;
}

async function main() {
  await limpiar(prisma);

  const navegador = await puppeteer.launch({ executablePath: EDGE, headless: true });
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

  const rutaImagen = await crearImagenLocal(pagina);

  // --- Cuenta de la captura ---
  await pagina.goto(`${BASE}/registro`, { waitUntil: "networkidle0" });
  await pagina.type("#nombre", "Marta Córdoba");
  await pagina.type("#email", EMAIL);
  await pagina.type("#whatsapp", "3001234567");
  await pagina.type("#password", PASSWORD);
  await Promise.all([
    pagina.waitForNavigation({ waitUntil: "networkidle0" }),
    pagina.click('button[type="submit"]'),
  ]);

  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { email: EMAIL } });
  for (const [i, aviso] of AVISOS_DEL_PANEL.entries()) {
    const categoria = await prisma.categoria.findFirstOrThrow({
      where: { nombre: aviso.categoria, tipo: aviso.tipo },
    });
    await prisma.aviso.create({
      data: {
        usuarioId: usuario.id,
        titulo: aviso.titulo,
        tituloNormalizado: normalizarTexto(aviso.titulo),
        descripcion: "Descripción del aviso publicado desde la cuenta de ejemplo.",
        tipo: aviso.tipo,
        municipio: aviso.municipio,
        categoriaId: categoria.id,
        precio: aviso.precio,
        activo: aviso.activo,
        publicadoEn: new Date(Date.now() - i * 26 * 60 * 60 * 1000),
      },
    });
  }

  console.log("capturas generadas:");

  // --- 1. Listado con filtros ---
  await pagina.goto(`${BASE}/`, { waitUntil: "networkidle0" });
  await pagina.screenshot({ path: "capturas/listado.png", clip: { x: 0, y: 0, width: 1280, height: 880 } });
  console.log("  listado.png  1280x880");

  // --- 2. Formulario de publicar con foto ---
  await pagina.goto(`${BASE}/mis-avisos/nuevo`, { waitUntil: "networkidle0" });
  await pagina.evaluate(() => {
    const etiqueta = [...document.querySelectorAll("label")].find((l) =>
      l.textContent?.includes("Artículo usado"),
    );
    (etiqueta?.querySelector("input") as HTMLInputElement | null)?.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  await pagina.type("#titulo", "Nevera Haceb de 300 litros");
  await pagina.type(
    "#descripcion",
    "Funciona perfecto, enfría bien y no hace ruido. La vendo porque compré una más grande. Se puede ver funcionando antes de comprar.",
  );
  await pagina.select("#categoriaId", await pagina.evaluate(() => {
    const opcion = [...document.querySelectorAll("#categoriaId option")].find(
      (o) => o.textContent === "Electrodomésticos",
    ) as HTMLOptionElement;
    return opcion.value;
  }));
  await pagina.type("#precio", "850000");

  const entrada = (await pagina.$("#archivoFoto")) as ElementHandle<HTMLInputElement> | null;
  await entrada!.uploadFile(rutaImagen);
  // Espera a que termine el reducido por canvas y la subida al store.
  await pagina.waitForFunction(
    () => document.querySelector("#foto-ayuda")?.textContent?.includes("Foto lista"),
    { timeout: 30000 },
  );
  // La vista previa pasa por el optimizador de Next: sin esperarla, la
  // captura sale con el recuadro vacío.
  await pagina.waitForFunction(() => {
    const img = document.querySelector("img") as HTMLImageElement | null;
    return Boolean(img && img.complete && img.naturalWidth > 0);
  }, { timeout: 30000 });
  console.log("  (la subida desde el navegador funcionó: 'Foto lista')");
  // El primer <form> del DOM es el de "Salir" del header, no este.
  await pagina.evaluate(() => {
    document.querySelector("#titulo")?.closest("form")?.setAttribute("data-captura", "1");
  });
  await capturarElemento(pagina, "[data-captura='1']", "publicar.png");

  // --- 3. Detalle con el botón de WhatsApp ---
  const conFoto = await prisma.aviso.findFirstOrThrow({
    where: { fotoUrl: { not: null }, usuario: { email: { endsWith: "@demo.local" } } },
    select: { id: true },
  });
  await pagina.goto(`${BASE}/avisos/${conFoto.id}`, { waitUntil: "networkidle0" });
  await capturarElemento(pagina, "article", "detalle.png");

  // --- 4. Panel Mis avisos ---
  await pagina.goto(`${BASE}/mis-avisos`, { waitUntil: "networkidle0" });
  await pagina.screenshot({ path: "capturas/mis-avisos.png", clip: { x: 0, y: 0, width: 1280, height: 560 } });
  console.log("  mis-avisos.png  1280x560");

  await navegador.close();

  // La foto que subió el formulario queda huérfana al borrar la cuenta.
  const subida = await prisma.aviso.findFirst({
    where: { usuario: { email: EMAIL }, fotoUrl: { not: null } },
    select: { fotoUrl: true },
  });
  await limpiar(prisma);
  if (subida?.fotoUrl) await del(subida.fotoUrl).catch(() => {});

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
