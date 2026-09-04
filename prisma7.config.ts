import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Esta URL la usa únicamente el CLI de Prisma (migrate, db push, studio),
    // por eso apunta a la conexión directa: las migraciones no deben pasar por
    // el pooler. La app usa la pooled desde src/lib/prisma.ts.
    url: process.env["DIRECT_DATABASE_URL"] ?? process.env["DATABASE_URL"],
  },
});
