import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { TipoAviso } from "../src/generated/prisma/enums";

// Categorías base. El listado público depende de que existan, así que el seed
// es idempotente: se puede correr de nuevo sin duplicar nada.
const CATEGORIAS: { nombre: string; tipo: TipoAviso }[] = [
  { nombre: "Agro y banano", tipo: "empleo" },
  { nombre: "Construcción", tipo: "empleo" },
  { nombre: "Comercio y ventas", tipo: "empleo" },
  { nombre: "Transporte", tipo: "empleo" },
  { nombre: "Servicios generales", tipo: "empleo" },
  { nombre: "Salud", tipo: "empleo" },
  { nombre: "Educación", tipo: "empleo" },
  { nombre: "Administrativo", tipo: "empleo" },
  { nombre: "Turismo y gastronomía", tipo: "empleo" },
  { nombre: "Tecnología", tipo: "empleo" },

  { nombre: "Vehículos", tipo: "articulo" },
  { nombre: "Motos", tipo: "articulo" },
  { nombre: "Celulares y computadores", tipo: "articulo" },
  { nombre: "Muebles y hogar", tipo: "articulo" },
  { nombre: "Electrodomésticos", tipo: "articulo" },
  { nombre: "Ropa y accesorios", tipo: "articulo" },
  { nombre: "Herramientas", tipo: "articulo" },
  { nombre: "Bicicletas", tipo: "articulo" },
  { nombre: "Animales", tipo: "articulo" },
  { nombre: "Otros", tipo: "articulo" },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta la variable de entorno DATABASE_URL");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });

  for (const categoria of CATEGORIAS) {
    await prisma.categoria.upsert({
      where: { nombre_tipo: { nombre: categoria.nombre, tipo: categoria.tipo } },
      update: {},
      create: categoria,
    });
  }

  console.log(`Categorías listas: ${CATEGORIAS.length}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
