-- Se agrega en tres pasos para no romper con las filas que ya existen:
-- primero la columna acepta nulos, después se rellena, y al final se exige.
ALTER TABLE "avisos" ADD COLUMN "tituloNormalizado" TEXT;

-- Mismo criterio que normalizarTexto() en la aplicación: minúsculas y sin
-- tildes. Aquí va explícito porque SQL no tiene NFD.
UPDATE "avisos"
SET "tituloNormalizado" = translate(
  lower("titulo"),
  'áàäâãéèëêíìïîóòöôõúùüûñç',
  'aaaaaeeeeiiiiooooouuuunc'
);

ALTER TABLE "avisos" ALTER COLUMN "tituloNormalizado" SET NOT NULL;
