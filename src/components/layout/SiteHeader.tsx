interface SiteHeaderProps {
  year: number;
  phaseTitle: string;
}

export function SiteHeader({ year, phaseTitle }: SiteHeaderProps) {
  return (
    <header id="siteHeader" className="text-center bg-gray-800">
      <hgroup className="flex justify-center items-center max-w-6xl mx-auto p-6  ">
        <h1 className="text-2xl font-extrabold tracking-tighter mb-4 text-white">
          ¿Quién canta hoy en el COAC {year}? <br />{" "}
          <strong className="text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400 uppercase">
            {phaseTitle}
          </strong>
        </h1>
      </hgroup>
    </header>
  );
}
