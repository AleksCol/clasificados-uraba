import {
  EnvolturaCampo,
  clasesControl,
  descripcionCampo,
} from "./EnvolturaCampo";

type Props = Omit<React.ComponentProps<"textarea">, "id"> & {
  etiqueta: string;
  nombre: string;
  errores?: string[];
  ayuda?: string;
};

export function AreaTexto({
  etiqueta,
  nombre,
  errores,
  ayuda,
  ...props
}: Props) {
  const tieneError = Boolean(errores?.length);

  return (
    <EnvolturaCampo
      nombre={nombre}
      etiqueta={etiqueta}
      ayuda={ayuda}
      errores={errores}
    >
      <textarea
        id={nombre}
        name={nombre}
        rows={6}
        aria-invalid={tieneError || undefined}
        aria-describedby={descripcionCampo(nombre, ayuda, tieneError)}
        className={`${clasesControl(tieneError)} resize-y`}
        {...props}
      />
    </EnvolturaCampo>
  );
}
