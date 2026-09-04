import {
  BASE,
  DOMINIO_PRUEBA,
  afirmar,
  crearPrisma,
  limpiar,
  quedaLimpio,
  terminar,
} from "./comun";
import { normalizarTexto } from "../src/lib/texto";

const EMAIL = `vendedor${DOMINIO_PRUEBA}`;
const prisma = crearPrisma();

// Cada tarjeta enlaza al detalle: contando ids distintos sabemos cuantos
// avisos se renderizaron.
function contarTarjetas(html: string): number {
  return new Set([...html.matchAll(/href="\/avisos\/([a-z0-9]+)"/g)].map((m) => m[1])).size;
}

async function traer(ruta: string) {
  const r = await fetch(`${BASE}${ruta}`, { redirect: "manual" });
  return { estado: r.status, html: await r.text() };
}

async function main() {
  await limpiar(prisma);

  const usuario = await prisma.usuario.create({
    data: {
      nombre: "Vendedor Prueba",
      email: EMAIL,
      passwordHash: "$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      whatsapp: "573001234567",
    },
  });

  const motos = await prisma.categoria.findFirstOrThrow({ where: { nombre: "Motos" } });
  const hogar = await prisma.categoria.findFirstOrThrow({ where: { nombre: "Muebles y hogar" } });
  const agro = await prisma.categoria.findFirstOrThrow({ where: { nombre: "Agro y banano" } });
  const construccion = await prisma.categoria.findFirstOrThrow({ where: { nombre: "Construcción" } });

  const semillas = [
    { titulo: "Moto Bajaj Boxer 100 modelo 2019", tipo: "articulo" as const, municipio: "apartado" as const, categoriaId: motos.id, precio: 3500000 },
    { titulo: "Moto Yamaha BWS en buen estado", tipo: "articulo" as const, municipio: "turbo" as const, categoriaId: motos.id, precio: 5200000 },
    { titulo: "Nevera Haceb de 300 litros", tipo: "articulo" as const, municipio: "apartado" as const, categoriaId: hogar.id, precio: 850000 },
    { titulo: "Juego de comedor de madera", tipo: "articulo" as const, municipio: "necocli" as const, categoriaId: hogar.id, precio: 700000 },
    { titulo: "Lavadora de 20 libras", tipo: "articulo" as const, municipio: "carepa" as const, categoriaId: hogar.id, precio: 600000 },
    { titulo: "Juego de sala en cuero", tipo: "articulo" as const, municipio: "turbo" as const, categoriaId: hogar.id, precio: 1200000 },
    { titulo: "Operario de finca bananera", tipo: "empleo" as const, municipio: "apartado" as const, categoriaId: agro.id, precio: null },
    { titulo: "Supervisor de cuadrilla agricola", tipo: "empleo" as const, municipio: "turbo" as const, categoriaId: agro.id, precio: null },
    { titulo: "Ingeniero agronomo para finca", tipo: "empleo" as const, municipio: "carepa" as const, categoriaId: agro.id, precio: null },
    { titulo: "Ayudante de obra en Apartado", tipo: "empleo" as const, municipio: "apartado" as const, categoriaId: construccion.id, precio: null },
    { titulo: "Maestro de construccion", tipo: "empleo" as const, municipio: "turbo" as const, categoriaId: construccion.id, precio: null },
    { titulo: "Oficial de acabados", tipo: "empleo" as const, municipio: "chigorodo" as const, categoriaId: construccion.id, precio: null },
    { titulo: "Soldador con experiencia", tipo: "empleo" as const, municipio: "necocli" as const, categoriaId: construccion.id, precio: null },
    { titulo: "Celador para bodega", tipo: "empleo" as const, municipio: "carepa" as const, categoriaId: construccion.id, precio: null },
    // Con tildes y con ene, para probar la busqueda normalizada.
    { titulo: "Camión Chevrolet NPR con papeles al día", tipo: "articulo" as const, municipio: "apartado" as const, categoriaId: motos.id, precio: 78000000 },
    { titulo: "Cuidador de niños en Necoclí", tipo: "empleo" as const, municipio: "necocli" as const, categoriaId: construccion.id, precio: null },
  ];

  for (const semilla of semillas) {
    await prisma.aviso.create({
      data: {
        usuarioId: usuario.id,
        descripcion: `Descripcion de prueba para ${semilla.titulo}.`,
        tituloNormalizado: normalizarTexto(semilla.titulo),
        ...semilla,
      },
    });
  }

  const pausado = await prisma.aviso.create({
    data: {
      usuarioId: usuario.id,
      titulo: "Bicicleta pausada que nadie debe ver",
      tituloNormalizado: normalizarTexto("Bicicleta pausada que nadie debe ver"),
      descripcion: "Este aviso esta pausado y no deberia salir en el listado.",
      tipo: "articulo",
      municipio: "turbo",
      categoriaId: motos.id,
      precio: 400000,
      activo: false,
    },
  });

  // Los totales se calculan contra la base, no con numeros fijos: asi la
  // prueba convive con los avisos reales que ya existan.
  const totalActivos = await prisma.aviso.count({ where: { activo: true } });

  const pagina1 = await traer("/");
  afirmar(pagina1.estado === 200, "el listado responde 200 sin login");
  afirmar(contarTarjetas(pagina1.html) === Math.min(totalActivos, 12), `la pagina 1 muestra hasta 12 (${Math.min(totalActivos, 12)})`);
  afirmar(pagina1.html.includes(`${totalActivos} avisos`), `informa el total (${totalActivos})`);
  afirmar(!pagina1.html.includes("Bicicleta pausada"), "el aviso pausado no aparece");

  const pagina2 = await traer("/?pagina=2");
  afirmar(contarTarjetas(pagina2.html) === Math.min(Math.max(totalActivos - 12, 0), 12), "la pagina 2 muestra el resto");

  const empleos = await prisma.aviso.count({ where: { activo: true, tipo: "empleo" } });
  const htmlEmpleos = await traer("/?tipo=empleo");
  afirmar(contarTarjetas(htmlEmpleos.html) === Math.min(empleos, 12), `filtra ${empleos} empleos`);
  afirmar(!htmlEmpleos.html.includes("Nevera Haceb"), "el filtro de empleos excluye articulos");

  const enTurbo = await prisma.aviso.count({ where: { activo: true, municipio: "turbo" } });
  const htmlTurbo = await traer("/?municipio=turbo");
  afirmar(contarTarjetas(htmlTurbo.html) === Math.min(enTurbo, 12), `filtra ${enTurbo} avisos de Turbo`);
  afirmar(!htmlTurbo.html.includes("Juego de comedor"), "el filtro de Turbo excluye Necocli");

  // Cuenta esperada segun la base, para convivir con los datos de muestra.
  async function cuantosCoinciden(texto: string): Promise<number> {
    return prisma.aviso.count({
      where: { activo: true, tituloNormalizado: { contains: normalizarTexto(texto) } },
    });
  }

  const conNevera = await cuantosCoinciden("nevera");
  const busqueda = await traer("/?q=nevera");
  afirmar(conNevera > 0, "hay avisos que dicen nevera");
  afirmar(contarTarjetas(busqueda.html) === Math.min(conNevera, 12), `la busqueda 'nevera' devuelve ${conNevera}`);
  afirmar(busqueda.html.includes("Nevera Haceb"), "y trae el aviso esperado");
  afirmar(contarTarjetas((await traer("/?q=NEVERA")).html) === Math.min(conNevera, 12), "la busqueda ignora mayusculas");

  // --- Busqueda sin tildes: el punto de la columna normalizada ---
  // Escribir con tilde o sin ella tiene que dar exactamente lo mismo.
  for (const [sinTilde, conTilde] of [["camion", "camión"], ["necocli", "Necoclí"], ["ninos", "niños"]]) {
    const esperados = await cuantosCoinciden(sinTilde);
    const a = contarTarjetas((await traer(`/?q=${encodeURIComponent(sinTilde)}`)).html);
    const b = contarTarjetas((await traer(`/?q=${encodeURIComponent(conTilde)}`)).html);
    afirmar(esperados > 0, `hay avisos que coinciden con "${sinTilde}"`);
    afirmar(a === Math.min(esperados, 12), `"${sinTilde}" devuelve ${esperados}`);
    afirmar(a === b, `"${sinTilde}" y "${conTilde}" dan lo mismo`);
  }
  afirmar(
    (await traer("/?q=camion")).html.includes("Camión Chevrolet"),
    "'camion' sin tilde trae el aviso con tilde",
  );
  afirmar(
    contarTarjetas((await traer("/?q=CAMION")).html) === contarTarjetas((await traer("/?q=camion")).html),
    "las mayusculas tampoco cambian el resultado",
  );

  const vacia = await traer("/?q=zzzzzzz");
  afirmar(contarTarjetas(vacia.html) === 0, "una busqueda sin resultados no muestra tarjetas");
  afirmar(vacia.html.includes("No hay avisos que coincidan"), "y lo explica");

  const porCategoria = await traer(`/?categoria=${motos.id}`);
  const enMotos = await prisma.aviso.count({ where: { activo: true, categoriaId: motos.id } });
  afirmar(contarTarjetas(porCategoria.html) === Math.min(enMotos, 12), `filtra ${enMotos} de la categoria Motos`);

  const combinados = await prisma.aviso.count({ where: { activo: true, tipo: "empleo", municipio: "turbo" } });
  afirmar(
    contarTarjetas((await traer("/?tipo=empleo&municipio=turbo")).html) === Math.min(combinados, 12),
    `combina tipo y municipio (${combinados})`,
  );

  const basura = await traer("/?tipo=basura&municipio=xyz&pagina=-5&categoria=nada");
  afirmar(basura.estado === 200, "los parametros invalidos no rompen la pagina");
  afirmar(contarTarjetas(basura.html) === 0, "una categoria inexistente no devuelve nada");
  afirmar(
    contarTarjetas((await traer("/?tipo=basura&municipio=xyz&pagina=-5")).html) === Math.min(totalActivos, 12),
    "tipo y municipio invalidos se ignoran",
  );

  // --- Detalle ---
  const activo = await prisma.aviso.findFirstOrThrow({ where: { titulo: "Nevera Haceb de 300 litros" } });
  const detalle = await traer(`/avisos/${activo.id}`);
  afirmar(detalle.estado === 200, "el detalle responde 200 sin login");
  afirmar(detalle.html.includes("Nevera Haceb de 300 litros"), "muestra el titulo");
  afirmar(detalle.html.includes("Vendedor Prueba"), "muestra quien publica");
  afirmar(detalle.html.includes("https://wa.me/573001234567"), "el enlace apunta a wa.me con el numero");
  afirmar(detalle.html.includes("Nevera%20Haceb"), "el mensaje precargado lleva el titulo codificado");
  afirmar(detalle.html.includes("850.000"), "muestra el precio formateado en pesos");

  const PARRAFO_PRECIO = "text-2xl font-semibold text-marca-oscuro";
  const empleo = await prisma.aviso.findFirstOrThrow({ where: { titulo: "Operario de finca bananera" } });
  const htmlEmpleo = (await traer(`/avisos/${empleo.id}`)).html;
  afirmar(detalle.html.includes(PARRAFO_PRECIO), "el articulo si renderiza el parrafo de precio");
  afirmar(!htmlEmpleo.includes(PARRAFO_PRECIO), "un empleo no muestra precio");

  afirmar((await traer(`/avisos/${pausado.id}`)).estado === 404, "el detalle de un aviso pausado responde 404");
  afirmar((await traer("/avisos/noexiste123")).estado === 404, "un id inexistente responde 404");

  await limpiar(prisma);
  afirmar(await quedaLimpio(prisma), "la base queda limpia");

  await prisma.$disconnect();
  terminar();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
