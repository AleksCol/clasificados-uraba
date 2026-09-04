type Props = Omit<React.ComponentProps<"input">, "id"> & {
  etiqueta: string;
  nombre: string;
  errores?: string[];
  ayuda?: string;
};

export function Campo({
  etiqueta,
  nombre,
  errores,
  ayuda,
  className = "",
  ...props
}: Props) {
  const tieneError = Boolean(errores?.length);
  const idAyuda = `${nombre}-ayuda`;
  const idError = `${nombre}-error`;

  // Le decimos al lector de pantalla qué textos acompañan al campo.
  const descrito = [ayuda ? idAyuda : null, tieneError ? idError : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={nombre} className="block text-sm font-medium">
        {etiqueta}
      </label>
      <input
        id={nombre}
        name={nombre}
        aria-invalid={tieneError || undefined}
        aria-describedby={descrito || undefined}
        className={`mt-1.5 w-full rounded-lg border bg-fondo px-3 py-2.5 text-base transition-colors placeholder:text-texto-suave ${
          tieneError ? "border-red-500" : "border-borde focus:border-marca"
        } ${className}`}
        {...props}
      />
      {ayuda && (
        <p id={idAyuda} className="mt-1.5 text-sm text-texto-suave">
          {ayuda}
        </p>
      )}
      {tieneError && (
        <p id={idError} className="mt-1.5 text-sm text-red-600">
          {errores![0]}
        </p>
      )}
    </div>
  );
}
