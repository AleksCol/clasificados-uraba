import { Contenedor } from "@/components/layout/Contenedor";

// Las páginas de registro e ingreso comparten la misma caja angosta y centrada.
export default function LayoutAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Contenedor>
      <div className="mx-auto w-full max-w-sm py-12 sm:py-16">{children}</div>
    </Contenedor>
  );
}
