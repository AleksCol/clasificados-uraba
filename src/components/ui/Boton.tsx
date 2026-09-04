type Props = React.ComponentProps<"button"> & {
  variante?: "primario" | "secundario";
};

const ESTILOS = {
  primario: "bg-marca text-white hover:bg-marca-oscuro",
  secundario: "border border-borde text-texto hover:bg-superficie",
} as const;

export function Boton({
  variante = "primario",
  className = "",
  ...props
}: Props) {
  return (
    <button
      className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${ESTILOS[variante]} ${className}`}
      {...props}
    />
  );
}
