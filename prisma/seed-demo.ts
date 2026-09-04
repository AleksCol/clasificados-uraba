import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Municipio, TipoAviso } from "../src/generated/prisma/enums";
import { normalizarTexto } from "../src/lib/texto";

// Datos de muestra para que el listado no se vea vacío al mostrar el proyecto.
// Van aparte del seed principal a propósito: ese solo crea las categorías, que
// la aplicación necesita de verdad.
//
// Todas las cuentas usan este dominio y la limpieza borra solo esas, así que
// correrlo de nuevo no toca ningún dato real.
const DOMINIO_DEMO = "@demo.local";

// Los avisos de muestra apuntan todos al mismo número. Por defecto es un
// placeholder: en Colombia no hay un rango de celulares reservado para
// pruebas, así que si esto se publica conviene poner un número propio.
//   WHATSAPP_DEMO=3001234567 npm run db:seed-demo
const WHATSAPP_DEMO = process.env.WHATSAPP_DEMO ?? "3000000000";

type SemillaAviso = {
  titulo: string;
  descripcion: string;
  tipo: TipoAviso;
  categoria: string;
  municipio: Municipio;
  precio: number | null;
};

const PUBLICADORES = [
  { nombre: "Marta Córdoba", email: `marta${DOMINIO_DEMO}` },
  { nombre: "Jhon Palacios", email: `jhon${DOMINIO_DEMO}` },
  { nombre: "Yuliana Mosquera", email: `yuliana${DOMINIO_DEMO}` },
  { nombre: "Comercializadora del Golfo", email: `golfo${DOMINIO_DEMO}` },
  { nombre: "Deiber Rentería", email: `deiber${DOMINIO_DEMO}` },
];

const AVISOS: SemillaAviso[] = [
  {
    titulo: "Operario de finca bananera en Carepa",
    descripcion:
      "Se necesitan operarios para labores de campo: deshoje, embolse y amarre. Turnos de lunes a sábado, entrada 6 a.m. Pago quincenal con todas las prestaciones de ley y transporte desde el casco urbano. No se requiere experiencia, se capacita.",
    tipo: "empleo",
    categoria: "Agro y banano",
    municipio: "carepa",
    precio: null,
  },
  {
    titulo: "Supervisor de empaque para planta bananera",
    descripcion:
      "Empresa exportadora busca supervisor con mínimo dos años de experiencia en planta de empaque. Manejo de personal, control de calidad de la fruta y reporte diario de producción. Contrato a término fijo con posibilidad de renovación.",
    tipo: "empleo",
    categoria: "Agro y banano",
    municipio: "apartado",
    precio: null,
  },
  {
    titulo: "Ingeniero agrónomo para finca en Chigorodó",
    descripcion:
      "Se requiere ingeniero agrónomo titulado y con tarjeta profesional para manejo integral de 60 hectáreas. Seguimiento fitosanitario, plan de fertilización e informes mensuales. Se ofrece alojamiento en la finca.",
    tipo: "empleo",
    categoria: "Agro y banano",
    municipio: "chigorodo",
    precio: null,
  },
  {
    titulo: "Ayudante de construcción en Turbo",
    descripcion:
      "Obra residencial de tres pisos necesita ayudantes. Trabajo de lunes a viernes y sábado hasta mediodía. Se paga semanal. Indispensable ser cumplido y tener herramienta básica.",
    tipo: "empleo",
    categoria: "Construcción",
    municipio: "turbo",
    precio: null,
  },
  {
    titulo: "Maestro de obra con experiencia comprobada",
    descripcion:
      "Buscamos maestro para dirigir construcción de local comercial. Debe saber interpretar planos, calcular materiales y coordinar cuadrilla de seis personas. Se pide referencias de obras anteriores en la zona.",
    tipo: "empleo",
    categoria: "Construcción",
    municipio: "apartado",
    precio: null,
  },
  {
    titulo: "Conductor de camión con licencia C2",
    descripcion:
      "Se necesita conductor para ruta Apartadó - Medellín transportando fruta. Licencia C2 vigente y experiencia mínima de tres años en carretera. Se paga por viaje más viáticos.",
    tipo: "empleo",
    categoria: "Transporte",
    municipio: "apartado",
    precio: null,
  },
  {
    titulo: "Mototaxistas con moto propia en Necoclí",
    descripcion:
      "Se vinculan mototaxistas con moto en buen estado, papeles al día y casco. Trabajo por turnos, se reparte el recaudo diario. Preferible que conozca bien las veredas.",
    tipo: "empleo",
    categoria: "Transporte",
    municipio: "necocli",
    precio: null,
  },
  {
    titulo: "Cajera para supermercado en Chigorodó",
    descripcion:
      "Supermercado de barrio busca cajera para turno de tarde, de 1 p.m. a 9 p.m. Manejo de caja registradora y datáfono. Se valora experiencia previa en almacén o tienda.",
    tipo: "empleo",
    categoria: "Comercio y ventas",
    municipio: "chigorodo",
    precio: null,
  },
  {
    titulo: "Auxiliar de enfermería para clínica",
    descripcion:
      "Clínica en Apartadó requiere auxiliar de enfermería con rethus vigente para turnos rotativos. Experiencia en atención de urgencias. Contrato directo con la institución.",
    tipo: "empleo",
    categoria: "Salud",
    municipio: "apartado",
    precio: null,
  },
  {
    titulo: "Docente de primaria para colegio privado",
    descripcion:
      "Colegio en Turbo busca docente de básica primaria, licenciado, para el próximo año lectivo. Jornada única de 7 a.m. a 2 p.m. Se pide manejo de grupo y disposición para actividades extracurriculares.",
    tipo: "empleo",
    categoria: "Educación",
    municipio: "turbo",
    precio: null,
  },
  {
    titulo: "Mesero para restaurante frente al mar",
    descripcion:
      "Restaurante en la playa de Necoclí necesita mesero para temporada alta. Buena presentación y actitud de servicio. Alimentación incluida y propinas se reparten entre el equipo.",
    tipo: "empleo",
    categoria: "Turismo y gastronomía",
    municipio: "necocli",
    precio: null,
  },
  {
    titulo: "Recepcionista bilingüe para hotel",
    descripcion:
      "Hotel en Arboletes busca recepcionista con inglés conversacional para atender turistas. Turnos rotativos incluyendo fines de semana. Se ofrece capacitación en el sistema de reservas.",
    tipo: "empleo",
    categoria: "Turismo y gastronomía",
    municipio: "arboletes",
    precio: null,
  },
  {
    titulo: "Técnico de soporte y redes",
    descripcion:
      "Empresa de internet en Apartadó necesita técnico para instalación y mantenimiento de redes de fibra. Se requiere moto propia y disposición para trabajo en altura. Se paga por instalación más básico.",
    tipo: "empleo",
    categoria: "Tecnología",
    municipio: "apartado",
    precio: null,
  },
  {
    titulo: "Moto Bajaj Boxer CT 100 modelo 2020",
    descripcion:
      "Moto en buen estado, papeles al día, soat hasta diciembre. Tiene 32.000 kilómetros, llantas nuevas y cadena recién cambiada. Se recibe permuta por moto de menor cilindraje.",
    tipo: "articulo",
    categoria: "Motos",
    municipio: "apartado",
    precio: 3800000,
  },
  {
    titulo: "Moto AKT NKD 125 con papeles al día",
    descripcion:
      "Vendo moto por viaje. Modelo 2021, único dueño, siempre guardada bajo techo. Mantenimientos hechos en el concesionario, tengo los recibos. Se entrega con casco y forro.",
    tipo: "articulo",
    categoria: "Motos",
    municipio: "turbo",
    precio: 4200000,
  },
  {
    titulo: "Nevera Haceb de 250 litros",
    descripcion:
      "Nevera de dos puertas en excelente estado, enfría perfecto y no hace ruido. La vendo porque compré una más grande. Se puede ver funcionando antes de comprar. No hago envíos.",
    tipo: "articulo",
    categoria: "Electrodomésticos",
    municipio: "apartado",
    precio: 780000,
  },
  {
    titulo: "Lavadora LG de 24 libras",
    descripcion:
      "Lavadora digital con seis años de uso, funciona bien en todos los ciclos. Tiene un rayón en la tapa que no afecta el funcionamiento. Precio negociable si se lleva hoy.",
    tipo: "articulo",
    categoria: "Electrodomésticos",
    municipio: "carepa",
    precio: 620000,
  },
  {
    titulo: "Juego de sala en madera y cuero",
    descripcion:
      "Sofá de tres puestos más dos poltronas y mesa de centro. Madera maciza, tapizado en cuero sintético color café. Tiene desgaste normal en los apoyabrazos. Se entrega en Chigorodó.",
    tipo: "articulo",
    categoria: "Muebles y hogar",
    municipio: "chigorodo",
    precio: 1150000,
  },
  {
    titulo: "Comedor de seis puestos en cedro",
    descripcion:
      "Mesa de comedor con seis sillas, hecha por ebanista de la región. Madera de cedro, muy resistente. La vendo porque me mudo a un apartamento más pequeño.",
    tipo: "articulo",
    categoria: "Muebles y hogar",
    municipio: "necocli",
    precio: 900000,
  },
  {
    titulo: "iPhone 12 de 128 GB",
    descripcion:
      "Teléfono liberado, batería al 87%, sin golpes ni rayones en la pantalla. Se entrega con cargador original y forro. Tengo la caja y la factura de compra.",
    tipo: "articulo",
    categoria: "Celulares y computadores",
    municipio: "apartado",
    precio: 1550000,
  },
  {
    titulo: "Portátil Lenovo ideal para estudio",
    descripcion:
      "Portátil con 8 GB de RAM y disco sólido de 256 GB. Windows recién instalado, batería dura unas cuatro horas. Sirve para clases, trabajos y navegar sin problema.",
    tipo: "articulo",
    categoria: "Celulares y computadores",
    municipio: "turbo",
    precio: 1300000,
  },
  {
    titulo: "Bicicleta todoterreno rin 29",
    descripcion:
      "Bicicleta con marco en aluminio, frenos hidráulicos y 21 cambios. Poco uso, siempre guardada. Le acabo de poner llantas nuevas. Se entrega con candado.",
    tipo: "articulo",
    categoria: "Bicicletas",
    municipio: "chigorodo",
    precio: 650000,
  },
  {
    titulo: "Guadañadora Stihl FS 280",
    descripcion:
      "Guadañadora en buen estado, prende de una. Se le hizo mantenimiento hace dos meses. Incluye arnés, cuchilla y dos carretes de nylon. Ideal para finca o lote grande.",
    tipo: "articulo",
    categoria: "Herramientas",
    municipio: "mutata",
    precio: 950000,
  },
  {
    titulo: "Cachorros criollos en adopción",
    descripcion:
      "Se entregan cachorros de dos meses, ya desparasitados y con la primera vacuna. Son juguetones y sanos. Solo entrego a quien tenga patio y se comprometa a cuidarlos bien.",
    tipo: "articulo",
    categoria: "Animales",
    municipio: "san_pedro_de_uraba",
    precio: null,
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta la variable de entorno DATABASE_URL");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });

  // Los avisos caen por la cascada de la llave foránea.
  const borrados = await prisma.usuario.deleteMany({
    where: { email: { endsWith: DOMINIO_DEMO } },
  });
  if (borrados.count > 0) {
    console.log(`Se limpiaron ${borrados.count} cuentas de muestra anteriores.`);
  }

  // Con --limpiar solo se borra y no se vuelve a sembrar.
  if (process.argv.includes("--limpiar")) {
    console.log("Datos de muestra eliminados.");
    await prisma.$disconnect();
    return;
  }

  const categorias = await prisma.categoria.findMany({
    select: { id: true, nombre: true, tipo: true },
  });
  if (categorias.length === 0) {
    throw new Error("No hay categorías. Corre primero: npm run db:seed");
  }

  // Contraseña aleatoria que nadie conoce: son cuentas para mirar, no para
  // entrar. Quien quiera publicar que cree la suya.
  const passwordHash = await bcrypt.hash(randomBytes(24).toString("hex"), 12);

  const publicadores = [];
  for (const persona of PUBLICADORES) {
    publicadores.push(
      await prisma.usuario.create({
        data: { ...persona, passwordHash, whatsapp: `57${WHATSAPP_DEMO}` },
        select: { id: true },
      }),
    );
  }

  let creados = 0;
  for (const [indice, aviso] of AVISOS.entries()) {
    const categoria = categorias.find(
      (c) => c.nombre === aviso.categoria && c.tipo === aviso.tipo,
    );
    if (!categoria) {
      throw new Error(`No existe la categoría "${aviso.categoria}" de tipo ${aviso.tipo}`);
    }

    // Se reparten entre los publicadores y se escalonan las fechas para que el
    // listado no muestre todo con la misma fecha.
    const dueno = publicadores[indice % publicadores.length];
    const publicadoEn = new Date(Date.now() - indice * 8 * 60 * 60 * 1000);

    await prisma.aviso.create({
      data: {
        titulo: aviso.titulo,
        tituloNormalizado: normalizarTexto(aviso.titulo),
        descripcion: aviso.descripcion,
        tipo: aviso.tipo,
        municipio: aviso.municipio,
        categoriaId: categoria.id,
        precio: aviso.precio,
        usuarioId: dueno.id,
        publicadoEn,
      },
    });
    creados++;
  }

  console.log(`Listo: ${publicadores.length} publicadores y ${creados} avisos de muestra.`);
  console.log(`WhatsApp usado: +57 ${WHATSAPP_DEMO}`);
  console.log("Para borrarlos: npm run db:seed-demo:limpiar");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
