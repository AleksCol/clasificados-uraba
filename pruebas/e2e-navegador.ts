import puppeteer from "puppeteer-core";
import {
  BASE,
  DOMINIO_PRUEBA,
  PASSWORD,
  afirmar,
  crearPrisma,
  limpiar,
  quedaLimpio,
  terminar,
} from "./comun";

// Estas pruebas necesitan un navegador de verdad porque cubren lo que no se ve
// por HTTP: errores de consola de React y si un click navega. Usamos el Edge
// que ya viene con Windows en vez de descargar un Chromium aparte.
const NAVEGADOR =
  process.env.RUTA_NAVEGADOR ??
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const EMAIL = `navegador${DOMINIO_PRUEBA}`;
const prisma = crearPrisma();

async function main() {
  await limpiar(prisma);

  const navegador = await puppeteer.launch({ executablePath: NAVEGADOR, headless: true });
  const pagina = await navegador.newPage();

  const mensajes: string[] = [];
  pagina.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warn") mensajes.push(`${m.type()}: ${m.text()}`);
  });
  pagina.on("pageerror", (e: unknown) => {
    mensajes.push(`pageerror: ${e instanceof Error ? e.message : String(e)}`);
  });

  // --- Registro desde el navegador ---
  await pagina.goto(`${BASE}/registro`, { waitUntil: "networkidle0" });
  await pagina.type("#nombre", "Navegador Prueba");
  await pagina.type("#email", EMAIL);
  await pagina.type("#whatsapp", "3009998877");
  await pagina.type("#password", PASSWORD);
  await Promise.all([
    pagina.waitForNavigation({ waitUntil: "networkidle0" }),
    pagina.click('button[type="submit"]'),
  ]);
  afirmar(pagina.url().endsWith("/mis-avisos"), "el registro lleva a /mis-avisos");

  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { email: EMAIL } });
  const categoria = await prisma.categoria.findFirstOrThrow({ where: { tipo: "articulo" } });
  const aviso = await prisma.aviso.create({
    data: {
      usuarioId: usuario.id,
      titulo: "Consola de videojuegos usada",
      descripcion: "Se vende consola en buen estado, con dos controles incluidos.",
      tipo: "articulo",
      municipio: "apartado",
      categoriaId: categoria.id,
      precio: 1500000,
    },
  });

  // --- Cambiar de tipo en el formulario ---
  await pagina.goto(`${BASE}/mis-avisos/nuevo`, { waitUntil: "networkidle0" });
  mensajes.length = 0;

  async function elegirTipo(texto: string) {
    await pagina.evaluate((buscado) => {
      const etiqueta = [...document.querySelectorAll("label")].find((l) =>
        l.textContent?.includes(buscado),
      );
      (etiqueta?.querySelector("input") as HTMLInputElement | null)?.click();
    }, texto);
    await new Promise((r) => setTimeout(r, 700));
  }

  await elegirTipo("Artículo usado");
  if (mensajes.length > 0) {
    console.log("\n  consola tras cambiar de tipo:");
    mensajes.slice(0, 5).forEach((m) => console.log(`    ${m.slice(0, 150)}`));
  }
  afirmar(!mensajes.some((m) => m.includes("same key")), "no aparece el error de keys duplicadas");
  afirmar(mensajes.length === 0, "la consola queda limpia al cambiar de tipo");

  const comoArticulo = await pagina.evaluate(() => ({
    foto: Boolean(document.querySelector("#archivoFoto")),
    precio: Boolean(document.querySelector("#precio")),
    categorias: document.querySelectorAll("#categoriaId option").length,
  }));
  afirmar(comoArticulo.foto, "aparece el campo de foto");
  afirmar(comoArticulo.precio, "aparece el campo de precio");
  afirmar(comoArticulo.categorias === 10, `la categoria muestra las 10 de articulo (${comoArticulo.categorias})`);

  await elegirTipo("Oferta de empleo");
  const comoEmpleo = await pagina.evaluate(() => ({
    foto: Boolean(document.querySelector("#archivoFoto")),
    precio: Boolean(document.querySelector("#precio")),
    categorias: document.querySelectorAll("#categoriaId option").length,
  }));
  afirmar(!comoEmpleo.foto && !comoEmpleo.precio, "al volver a empleo se ocultan foto y precio");
  afirmar(comoEmpleo.categorias === 10, "la categoria cambia a las 10 de empleo");

  // --- El enlace "Mis avisos" del header desde cada pagina ---
  const rutas = [
    "/",
    "/mis-avisos/nuevo",
    `/avisos/${aviso.id}`,
    `/mis-avisos/${aviso.id}/editar`,
    "/mis-avisos",
  ];

  for (const ruta of rutas) {
    await pagina.goto(`${BASE}${ruta}`, { waitUntil: "networkidle0" });
    const resultado = await pagina.evaluate(() => {
      const enlace = [...document.querySelectorAll("header a")].find(
        (a) => a.textContent?.trim() === "Mis avisos",
      ) as HTMLAnchorElement | null;
      if (!enlace) return null;

      // Si algo se monta encima, el click no llega al enlace.
      const caja = enlace.getBoundingClientRect();
      const encima = document.elementFromPoint(caja.x + caja.width / 2, caja.y + caja.height / 2);
      const tapado = !enlace.contains(encima) && encima !== enlace;

      enlace.click();
      return { tapado };
    });
    await new Promise((r) => setTimeout(r, 1200));

    const navego = pagina.url().endsWith("/mis-avisos");
    afirmar(
      resultado !== null && !resultado.tapado && navego,
      `"Mis avisos" navega desde ${ruta}${resultado?.tapado ? " (TAPADO)" : ""}`,
    );
  }

  await pagina.goto(`${BASE}/mis-avisos`, { waitUntil: "networkidle0" });
  const texto = await pagina.evaluate(() => document.body.innerText);
  afirmar(texto.includes("Consola de videojuegos usada"), "el panel lista el aviso del usuario");

  await navegador.close();
  await limpiar(prisma);
  afirmar(await quedaLimpio(prisma), "la base queda limpia");

  await prisma.$disconnect();
  terminar();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
