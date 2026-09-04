import {
  BASE,
  DOMINIO_PRUEBA,
  MARCA_LOGIN,
  MARCA_REGISTRO,
  PASSWORD,
  afirmar,
  crearPrisma,
  limpiar,
  postear,
  quedaLimpio,
  terminar,
} from "./comun";

const EMAIL = `ana${DOMINIO_PRUEBA}`;
const prisma = crearPrisma();

async function main() {
  await limpiar(prisma);

  // --- Registro ---
  const registro = await postear(
    "/registro",
    { nombre: "Ana Prueba", email: EMAIL, whatsapp: "300 123 4567", password: PASSWORD },
    undefined,
    MARCA_REGISTRO,
  );
  const cookies = registro.headers.getSetCookie?.() ?? [];
  const cookie = cookies.find((c) => c.startsWith("sesion="))?.split(";")[0];

  afirmar(registro.status === 303, `el registro responde 303 (${registro.status})`);
  afirmar(Boolean(cookie), "devuelve la cookie de sesion");
  afirmar(cookies.join(" ").includes("HttpOnly"), "la cookie es HttpOnly");
  afirmar(cookies.join(" ").includes("SameSite=lax"), "la cookie es SameSite=lax");

  // --- La fila quedo bien ---
  const usuario = await prisma.usuario.findUnique({ where: { email: EMAIL } });
  afirmar(usuario?.whatsapp === "573001234567", "guarda el whatsapp normalizado");
  afirmar(Boolean(usuario?.passwordHash.startsWith("$2")), "guarda un hash bcrypt");
  afirmar(!usuario?.passwordHash.includes(PASSWORD), "el hash no tiene la clave en claro");

  // --- La sesion da acceso ---
  const panel = await fetch(`${BASE}/mis-avisos`, { headers: { Cookie: cookie! } });
  afirmar(panel.status === 200, "con la cookie, /mis-avisos responde 200");
  afirmar(
    (await panel.text()).includes("Todavía no has publicado nada"),
    "una cuenta nueva ve el panel vacio",
  );

  // --- Rutas protegidas ---
  const sinCookie = await fetch(`${BASE}/mis-avisos`, { redirect: "manual" });
  afirmar(sinCookie.status === 307, "sin cookie, /mis-avisos redirige");
  const cookieFalsa = await fetch(`${BASE}/mis-avisos`, {
    headers: { Cookie: "sesion=token-falsificado" },
    redirect: "manual",
  });
  afirmar(cookieFalsa.status === 307, "con cookie falsificada tambien redirige");

  // --- Correo repetido ---
  const repetido = await postear(
    "/registro",
    { nombre: "Otra", email: EMAIL, whatsapp: "300 999 8877", password: PASSWORD },
    undefined,
    MARCA_REGISTRO,
  );
  afirmar((await repetido.text()).includes("Ya existe una cuenta"), "rechaza el correo repetido");
  afirmar((await prisma.usuario.count({ where: { email: EMAIL } })) === 1, "no crea un duplicado");

  // --- Validaciones ---
  const invalido = await postear(
    "/registro",
    { nombre: "A", email: "no-es-correo", whatsapp: "123", password: "corta" },
    undefined,
    MARCA_REGISTRO,
  );
  const htmlInvalido = await invalido.text();
  afirmar(htmlInvalido.includes("al menos 2 caracteres"), "rechaza el nombre corto");
  afirmar(htmlInvalido.includes("correo válido"), "rechaza el correo invalido");
  afirmar(htmlInvalido.includes("celular colombiano"), "rechaza el whatsapp invalido");
  afirmar(htmlInvalido.includes("al menos 8 caracteres"), "rechaza la clave corta");

  // --- Ingreso ---
  const malLogin = await postear(
    "/login",
    { email: EMAIL, password: "incorrecta-999" },
    undefined,
    MARCA_LOGIN,
  );
  afirmar(
    (await malLogin.text()).includes("Correo o contraseña incorrectos"),
    "rechaza la contrasena incorrecta",
  );
  afirmar(
    !(malLogin.headers.getSetCookie?.() ?? []).some((c) => c.startsWith("sesion=ey")),
    "no entrega sesion al fallar",
  );

  const inexistente = await postear(
    "/login",
    { email: `nadie${DOMINIO_PRUEBA}`, password: PASSWORD },
    undefined,
    MARCA_LOGIN,
  );
  afirmar(
    (await inexistente.text()).includes("Correo o contraseña incorrectos"),
    "el mismo mensaje si el correo no existe",
  );

  const buenLogin = await postear("/login", { email: EMAIL, password: PASSWORD }, undefined, MARCA_LOGIN);
  afirmar(
    (buenLogin.headers.getSetCookie?.() ?? []).some((c) => c.startsWith("sesion=")),
    "el ingreso correcto entrega sesion",
  );

  await limpiar(prisma);
  afirmar(await quedaLimpio(prisma), "la base queda limpia");

  await prisma.$disconnect();
  terminar();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
