import type { PerformanceView, SessionView } from "./schedule";

/** Un trozo del párrafo: texto normal o el nombre de una agrupación (en negrita). */
export interface BriefPart {
  text: string;
  strong?: boolean;
}

const modalidadName = (performance: PerformanceView) => performance.group.modalidad.toLowerCase();

/** «A», «A y B», «A, B y C», con cada nombre como trozo en negrita y su modalidad y hora. */
function listParts(performances: PerformanceView[]): BriefPart[] {
  return performances.flatMap((performance, index) => {
    const separator = index === 0 ? "" : index === performances.length - 1 ? " y " : ", ";
    return [
      ...(separator ? [{ text: separator }] : []),
      { text: `«${performance.group.nombre}»`, strong: true },
      { text: ` (${modalidadName(performance)}, ${performance.estimatedTime})` },
    ];
  });
}

/**
 * El resumen de una sesión para quien duda si ir o verla: primero las
 * imprescindibles, luego las recomendadas, en orden de actuación y con su hora
 * estimada. Sin ninguna de las dos, una invitación a descubrir.
 */
export function sessionBrief(session: SessionView): BriefPart[] {
  const top = session.performances.filter((performance) => performance.group.ranking === "top");
  const ok = session.performances.filter((performance) => performance.group.ranking === "ok");

  if (top.length === 0 && ok.length === 0) {
    const count = session.performances.length;
    const groups = count === 1 ? "Una agrupación" : `${count} agrupaciones`;
    return [
      { text: `${groups} sin imprescindibles ni recomendadas: buena noche para descubrir algo nuevo.` },
    ];
  }

  const parts: BriefPart[] = [];
  if (top.length > 0) parts.push({ text: "No te pierdas " }, ...listParts(top), { text: "." });
  if (ok.length > 0) {
    const lead =
      top.length === 0
        ? "Lo más recomendable: "
        : ok.length === 1
          ? " También merece la pena "
          : " También merecen la pena ";
    parts.push({ text: lead }, ...listParts(ok), { text: "." });
  }
  return parts;
}

/** El resumen como texto plano (para tests y para quien lo necesite sin formato). */
export const sessionBriefText = (session: SessionView) =>
  sessionBrief(session)
    .map((part) => part.text)
    .join("");
