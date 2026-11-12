// Constantes del sitio que no dependen de la fase/temporada (ver `season.ts`
// para lo que sí cambia en cada fase).
export const SITE = {
  url: "https://coac.com.es/",
  name: "¿Quién canta hoy en el COAC?",
  venue: "Gran Teatro Falla",
  city: "Cádiz",
  // Las sesiones se miden siempre en hora de Cádiz, sea cual sea la zona del
  // navegador o de la máquina que hace el build.
  timeZone: "Europe/Madrid",
} as const;

/**
 * Correo para que los autores pidan retirar o corregir su nombre (RGPD). Mejor
 * un alias exclusivo de la web. Mientras esté vacío, los textos remiten a X y a
 * GitHub; al rellenarlo, aparece solo en la privacidad y en «Quiénes somos».
 */
export const CONTACT_EMAIL: string = "";
