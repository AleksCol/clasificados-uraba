// Estado que devuelven las server actions de formularios a useActionState.
// Vive fuera de los archivos "use server" porque esos solo pueden exportar
// funciones asíncronas.
export type EstadoFormulario = {
  errorGeneral?: string;
  errores?: Record<string, string[] | undefined>;
};

export const ESTADO_INICIAL: EstadoFormulario = {};
