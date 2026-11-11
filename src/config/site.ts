// Constantes del sitio que no dependen de la fase/temporada (ver `season.ts`
// para lo que sí cambia en cada fase).
export const SITE = {
  url: "https://nandovejer.github.io/coac/",
  name: "¿Quién canta hoy en el COAC?",
  venue: "Gran Teatro Falla",
  city: "Cádiz",
  // Las sesiones se miden siempre en hora de Cádiz, sea cual sea la zona del
  // navegador o de la máquina que hace el build.
  timeZone: "Europe/Madrid",
} as const;
