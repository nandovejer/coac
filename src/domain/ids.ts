/** Minúsculas, sin acentos y solo letras y números. */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase();
}

/**
 * Crea un generador de ids de ancla únicos (`author2026<autor>`): si dos
 * agrupaciones dan el mismo id se les añade un sufijo `-2`, `-3`…
 */
export function createGroupIdGenerator(year: number) {
  const used = new Set<string>();

  return (group: { autor: string; nombre: string }): string => {
    const slug = slugify(group.autor) || slugify(group.nombre) || "agrupacion";
    const base = `author${year}${slug}`;

    let id = base;
    for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
    used.add(id);

    return id;
  };
}
