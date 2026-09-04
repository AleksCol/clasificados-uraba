// Ancho máximo y márgenes laterales compartidos por header, footer y páginas.
export function Contenedor({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</div>;
}
