import {
  BASE,
  DOMINIO_PRUEBA,
  MARCA_AVISO,
  MARCA_ESTADO,
  afirmar,
  crearPrisma,
  limpiar,
  postear,
  quedaLimpio,
  registrar,
  terminar,
} from "./comun";

const EMAIL_A = `duena${DOMINIO_PRUEBA}`;
const EMAIL_B = `intrusa${DOMINIO_PRUEBA}`;
const prisma = crearPrisma();

async function main() {
  await limpiar(prisma);

  const cookieA = await registrar("Duena A", EMAIL_A, "300 111 1111");
  const cookieB = await registrar("Intrusa B", EMAIL_B, "300 222 2222");
  afirmar(Boolean(cookieA && cookieB), "se crearon las dos cuentas");

  const catArticulo = await prisma.categoria.findFirstOrThrow({ where: { tipo: "articulo" } });
  const catEmpleo = await prisma.categoria.findFirstOrThrow({ where: { tipo: "empleo" } });

  // A publica
  await postear("/mis-avisos/nuevo", {
    titulo: "Nevera Haceb de 300 litros",
    descripcion: "Funciona perfecto, la vendo porque me mudo de Apartado.",
    tipo: "articulo",
    municipio: "apartado",
    categoriaId: catArticulo.id,
    precio: "850000",
    fotoUrl: "",
  }, cookieA, MARCA_AVISO);

  const avisoA = await prisma.aviso.findFirst({ where: { usuario: { email: EMAIL_A } } });
  afirmar(avisoA?.titulo === "Nevera Haceb de 300 litros", "A publico su aviso");
  afirmar(avisoA?.precio === 850000, "guarda el precio como entero");
  afirmar(avisoA?.activo === true, "el aviso nace activo");

  // B publica, para tener formularios propios de donde sacar los ids de accion
  await postear("/mis-avisos/nuevo", {
    titulo: "Bicicleta todoterreno rin 29",
    descripcion: "Poco uso, con frenos hidraulicos y llantas nuevas.",
    tipo: "articulo",
    municipio: "turbo",
    categoriaId: catArticulo.id,
    precio: "600000",
    fotoUrl: "",
  }, cookieB, MARCA_AVISO);
  const avisoB = await prisma.aviso.findFirst({ where: { usuario: { email: EMAIL_B } } });
  afirmar(Boolean(avisoB), "B publico su aviso");

  // --- B intenta sobre lo de A ---
  const verAjeno = await fetch(`${BASE}/mis-avisos/${avisoA!.id}/editar`, {
    headers: { Cookie: cookieB },
  });
  afirmar(verAjeno.status === 404, "B recibe 404 al abrir la edicion del aviso de A");

  const editarAjeno = await postear(`/mis-avisos/${avisoB!.id}/editar`, {
    id: avisoA!.id,
    titulo: "Secuestrado por B",
    descripcion: "Este texto no deberia quedar guardado en ningun lado.",
    tipo: "articulo",
    municipio: "turbo",
    categoriaId: catArticulo.id,
    precio: "1",
    fotoUrl: "",
  }, cookieB, MARCA_AVISO);

  const trasEdicion = await prisma.aviso.findUniqueOrThrow({ where: { id: avisoA!.id } });
  afirmar(trasEdicion.titulo === "Nevera Haceb de 300 litros", "el aviso de A NO cambio de titulo");
  afirmar(trasEdicion.precio === 850000, "el aviso de A NO cambio de precio");
  afirmar((await editarAjeno.text()).includes("no es tuyo"), "responde que el aviso no es suyo");

  await postear("/mis-avisos", { id: avisoA!.id, activo: "false" }, cookieB, MARCA_ESTADO);
  afirmar(
    (await prisma.aviso.findUniqueOrThrow({ where: { id: avisoA!.id } })).activo,
    "el aviso de A sigue activo",
  );

  // --- A si puede sobre lo suyo ---
  await postear(`/mis-avisos/${avisoA!.id}/editar`, {
    id: avisoA!.id,
    titulo: "Nevera Haceb 300L en buen estado",
    descripcion: "Funciona perfecto, la vendo porque me mudo de Apartado.",
    tipo: "articulo",
    municipio: "apartado",
    categoriaId: catArticulo.id,
    precio: "800000",
    fotoUrl: "",
  }, cookieA, MARCA_AVISO);

  const editado = await prisma.aviso.findUniqueOrThrow({ where: { id: avisoA!.id } });
  afirmar(editado.titulo === "Nevera Haceb 300L en buen estado", "A si puede editar lo suyo");
  afirmar(editado.precio === 800000, "el precio quedo actualizado");

  await postear("/mis-avisos", { id: avisoA!.id, activo: "false" }, cookieA, MARCA_ESTADO);
  afirmar(
    !(await prisma.aviso.findUniqueOrThrow({ where: { id: avisoA!.id } })).activo,
    "A si puede pausar lo suyo",
  );

  // --- Validaciones ---
  const conPrecio = await postear("/mis-avisos/nuevo", {
    titulo: "Auxiliar de bodega en Carepa",
    descripcion: "Turnos de ocho horas, pago quincenal y todas las prestaciones.",
    tipo: "empleo",
    municipio: "carepa",
    categoriaId: catEmpleo.id,
    precio: "500000",
    fotoUrl: "",
  }, cookieA, MARCA_AVISO);
  afirmar((await conPrecio.text()).includes("no llevan precio"), "rechaza empleo con precio");

  const cruzada = await postear("/mis-avisos/nuevo", {
    titulo: "Mecanico para taller en Turbo",
    descripcion: "Se necesita mecanico con experiencia en motos de bajo cilindraje.",
    tipo: "empleo",
    municipio: "turbo",
    categoriaId: catArticulo.id,
    precio: "",
    fotoUrl: "",
  }, cookieA, MARCA_AVISO);
  afirmar((await cruzada.text()).includes("de este tipo"), "rechaza categoria de otro tipo");

  const corto = await postear("/mis-avisos/nuevo", {
    titulo: "Ok",
    descripcion: "Muy corto.",
    tipo: "empleo",
    municipio: "turbo",
    categoriaId: catEmpleo.id,
    precio: "",
    fotoUrl: "",
  }, cookieA, MARCA_AVISO);
  const htmlCorto = await corto.text();
  afirmar(
    htmlCorto.includes("al menos 5 caracteres") && htmlCorto.includes("al menos 20 caracteres"),
    "rechaza titulo y descripcion cortos",
  );

  const dePrueba = await prisma.aviso.count({
    where: { usuario: { email: { endsWith: DOMINIO_PRUEBA } } },
  });
  afirmar(dePrueba === 2, `ningun aviso invalido llego a la base (${dePrueba})`);

  const sinSesion = await fetch(`${BASE}/mis-avisos/nuevo`, { redirect: "manual" });
  afirmar(sinSesion.status === 307, "sin sesion, publicar redirige al login");

  await limpiar(prisma);
  afirmar(await quedaLimpio(prisma), "la base queda limpia");

  await prisma.$disconnect();
  terminar();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
