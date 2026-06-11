
export type AlertTipo = (typeof AlertTipo)[keyof typeof AlertTipo];

export const AlertTipo = {
  bajo_rendimiento: "bajo_rendimiento",
  nivel_completado: "nivel_completado",
  logro: "logro",
  sistema: "sistema",
} as const;
