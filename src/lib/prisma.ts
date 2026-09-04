import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

// En desarrollo Next recarga los módulos en cada cambio; sin este singleton
// cada recarga abriría un pool nuevo contra Neon hasta agotar las conexiones.
const globalParaPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function crearCliente() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta la variable de entorno DATABASE_URL");
  }
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}

export const prisma = globalParaPrisma.prisma ?? crearCliente();

if (process.env.NODE_ENV !== "production") {
  globalParaPrisma.prisma = prisma;
}
