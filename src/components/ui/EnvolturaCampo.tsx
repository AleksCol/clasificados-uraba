// Etiqueta, texto de ayuda y mensaje de error compartidos por los tres
// controles de formulario, para que se vean y se anuncien igual.
type Props = {
  nombre: string;
  etiqueta: string;
  ayuda?: string;
  errores?: string[];
  children: React.ReactNode;
};

export function clasesControl(tieneError: boolean): string {
  return `mt-1.5 w-full rounded-lg border bg-fondo px-3 py-2.5 text-base transition-colors placeholder:text-texto-suave ${
    tieneError ? "border-red-500" : "border-borde focus:border-marca"
  }`;
}

export function descripcionCampo(
  nombre: string,
  ayuda?: string,
  tieneError?: boolean,
): string | undefined {
  return (
    [ayuda ? `${nombre}-ayuda` : null, tieneError ? `${nombre}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined
  );
}

export function EnvolturaCampo({
  nombre,
  etiqueta,
  ayuda,
  errores,
  children,
}: Props) {
  const tieneError = Boolean(errores?.length);

  return (
    <div>
      <label htmlFor={nombre} className="block text-sm font-medium">
        {etiqueta}
      </label>
      {children}
      {ayuda && (
        <p id={`${nombre}-ayuda`} className="mt-1.5 text-sm text-texto-suave">
          {ayuda}
        </p>
      )}
      {tieneError && (
        <p id={`${nombre}-error`} className="mt-1.5 text-sm text-red-600">
          {errores![0]}
        </p>
      )}
    </div>
  );
}
