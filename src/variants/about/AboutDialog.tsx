import { SEASON } from "../../config/season";
import { InfoDialog, InfoSection } from "../info/InfoDialog";

const REPO_URL = "https://github.com/nandovejer/coac-quien-canta-hoy";

/**
 * «Quiénes somos»: qué es la web, quién la hace, de dónde salen los datos,
 * agradecimientos, autoría y licencia. Se carga solo al pulsar el enlace del pie.
 */
export default function AboutDialog({ onClose }: { onClose: () => void }) {
  return (
    <InfoDialog title="Quiénes somos" titleId="about-title" onClose={onClose}>
      <InfoSection title="El proyecto">
        <p>
          <strong>¿Quién canta hoy en el COAC?</strong> responde a la pregunta de cada noche de Carnaval: qué
          agrupación sale ahora y cuándo toca ver la que te interesa. El listado oficial del Concurso Oficial
          de Agrupaciones Carnavalescas es una tabla larga y sin horas; esta web lo convierte en un programa
          que se abre en el móvil y se entiende de un vistazo: la sesión de hoy, las que vienen, quién está
          actuando y a qué hora aproximada sale cada agrupación.
        </p>
        <p>Es una web estática: sin cuentas, sin cookies y sin servidor. Se abre, se mira y se cierra.</p>
      </InfoSection>

      <InfoSection title="Quién lo hace">
        <p>
          La idea, el diseño y el código son de <a href="https://twitter.com/nandovejer">Nando Muñoz</a>,
          aficionado al Carnaval de Cádiz. Es un proyecto personal, hecho por gusto y en abierto.
        </p>
      </InfoSection>

      <InfoSection title="De dónde salen los datos">
        <p>
          Las agrupaciones y su orden de actuación se copian del listado oficial del COAC {SEASON.year}. Las
          horas <strong>no son oficiales</strong>: se estiman sumando {SEASON.minutesPerGroup} minutos por
          agrupación (actuación y montaje) desde el inicio de la sesión, así que pueden adelantarse o
          retrasarse. El directo enlaza a la emisión pública en YouTube.
        </p>
      </InfoSection>

      <InfoSection title="Agradecimientos">
        <p>
          A las agrupaciones, autores y autoras que cada año suben al escenario del Gran Teatro Falla, y a la
          afición que llena el teatro y las casas de Carnaval. El logo es un homenaje a la fachada del Falla.
        </p>
      </InfoSection>

      <InfoSection title="Autoría y licencia">
        <p>
          © 2026 Nando Muñoz. Código abierto bajo{" "}
          <a href="https://es.wikipedia.org/wiki/MIT_License">licencia MIT</a>: puedes verlo, copiarlo y
          mejorarlo en <a href={REPO_URL}>GitHub</a>. Hecho con{" "}
          <a href="https://github.com/nandovejer/luz">Luz</a>, React y Vite.
        </p>
        <p className="coac-info__note">
          Web no oficial, sin relación con la organización del concurso. Los nombres de las agrupaciones y de
          sus autores pertenecen a sus responsables.
        </p>
      </InfoSection>
    </InfoDialog>
  );
}
