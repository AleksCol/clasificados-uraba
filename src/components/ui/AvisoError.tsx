// Error que no pertenece a un campo puntual, como "correo o contraseña
// incorrectos". role="alert" hace que el lector de pantalla lo anuncie.
export function AvisoError({ mensaje }: { mensaje: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
    >
      {mensaje}
    </p>
  );
}
