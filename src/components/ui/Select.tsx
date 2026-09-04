import {
  EnvolturaCampo,
  clasesControl,
  descripcionCampo,
} from "./EnvolturaCampo";

type Opcion = { valor: string; texto: string };

type Props = Omit<React.ComponentProps<"select">, "id" | "children"> & {
  etiqueta: string;
  nombre: string;
  opciones: Opcion[];
  errores?: string[];
  ayuda?: string;
};

export function Select({
  etiqueta,
  nombre,
  opciones,
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
      <select
        id={nombre}
        name={nombre}
        aria-invalid={tieneError || undefined}
        aria-describedby={descripcionCampo(nombre, ayuda, tieneError)}
        className={clasesControl(tieneError)}
        {...props}
      >
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.texto}
          </option>
        ))}
      </select>
    </EnvolturaCampo>
  );
}
