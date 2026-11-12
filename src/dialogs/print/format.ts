import type { SessionView } from "../../domain/schedule";
import type { Group } from "../../types";

/** "COMPARSA" → "Comparsa". */
export const capitalize = (text: string) => text.charAt(0) + text.slice(1).toLowerCase();

/** Orden de actuación en su sesión (1, 2, 3…), aunque los filtros quiten otras. */
export const actOrder = (session: SessionView, group: Group) =>
  session.performances.findIndex((performance) => performance.group.id === group.id) + 1;
