-- CreateEnum
CREATE TYPE "TipoAviso" AS ENUM ('empleo', 'articulo');

-- CreateEnum
CREATE TYPE "Municipio" AS ENUM ('apartado', 'turbo', 'chigorodo', 'carepa', 'necocli', 'arboletes', 'san_juan_de_uraba', 'san_pedro_de_uraba', 'mutata', 'murindo', 'vigia_del_fuerte');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoAviso" NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avisos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoAviso" NOT NULL,
    "municipio" "Municipio" NOT NULL,
    "precio" INTEGER,
    "fotoUrl" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "publicadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,

    CONSTRAINT "avisos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_tipo_key" ON "categorias"("nombre", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_id_tipo_key" ON "categorias"("id", "tipo");

-- CreateIndex
CREATE INDEX "avisos_activo_tipo_municipio_idx" ON "avisos"("activo", "tipo", "municipio");

-- CreateIndex
CREATE INDEX "avisos_usuarioId_idx" ON "avisos"("usuarioId");

-- CreateIndex
CREATE INDEX "avisos_categoriaId_idx" ON "avisos"("categoriaId");

-- AddForeignKey
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_categoriaId_tipo_fkey" FOREIGN KEY ("categoriaId", "tipo") REFERENCES "categorias"("id", "tipo") ON DELETE RESTRICT ON UPDATE CASCADE;
