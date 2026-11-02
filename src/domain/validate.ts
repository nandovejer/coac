import { parseSessionDate } from "../lib/dates";
import { MODALIDADES, RANKINGS } from "../types";

const REQUIRED_TEXT_FIELDS = ["nombre", "autor", "ciudad"] as const;
const KNOWN_FIELDS = new Set<string>(["ranking", "modalidad", ...REQUIRED_TEXT_FIELDS]);

/**
 * Comprueba que el JSON de una fase tiene el formato esperado y devuelve la
 * lista de errores (vacía si es válido). Se ejecuta en el build y en los tests
 * para que un dato mal escrito rompa el build y no la web.
 */
export function validateSessions(raw: unknown, previousYear: number): string[] {
  const errors: string[] = [];
  const previousYearKey = String(previousYear);

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return ["El JSON debe ser un objeto { 'dd/mm/yyyy': [agrupaciones] }"];
  }

  const entries = Object.entries(raw);
  if (entries.length === 0) errors.push("El JSON no tiene ninguna sesión");

  for (const [date, groups] of entries) {
    if (!parseSessionDate(date)) {
      errors.push(`"${date}": la clave no es una fecha dd/mm/yyyy válida`);
    }
    if (!Array.isArray(groups) || groups.length === 0) {
      errors.push(`${date}: debe ser una lista con al menos una agrupación`);
      continue;
    }

    groups.forEach((group: unknown, index: number) => {
      const where = `${date} #${index + 1}`;
      if (typeof group !== "object" || group === null) {
        errors.push(`${where}: la agrupación debe ser un objeto`);
        return;
      }
      const record = group as Record<string, unknown>;

      for (const field of REQUIRED_TEXT_FIELDS) {
        const value = record[field];
        if (typeof value !== "string" || value.trim() === "") {
          errors.push(`${where}: "${field}" debe ser un texto no vacío`);
        }
      }
      if (!(MODALIDADES as readonly unknown[]).includes(record.modalidad)) {
        errors.push(
          `${where}: "modalidad" debe ser una de ${MODALIDADES.join(", ")} (es ${JSON.stringify(record.modalidad)})`,
        );
      }
      if (!(RANKINGS as readonly unknown[]).includes(record.ranking)) {
        errors.push(
          `${where}: "ranking" debe ser uno de ${RANKINGS.join(", ")} (es ${JSON.stringify(record.ranking)})`,
        );
      }

      const previous = record[previousYearKey];
      if (typeof previous !== "string" || previous.trim() === "") {
        errors.push(
          `${where}: falta "${previousYearKey}" (agrupación del año anterior o "Nueva agrupación")`,
        );
      }

      for (const key of Object.keys(record)) {
        if (!KNOWN_FIELDS.has(key) && key !== previousYearKey) {
          errors.push(`${where}: campo desconocido "${key}"`);
        }
      }
    });
  }

  return errors;
}
