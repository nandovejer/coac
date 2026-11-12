import { CONTACT_EMAIL } from "../../config/site";
import { InfoDialog, InfoSection } from "../info/InfoDialog";

const AUTHOR_URL = "https://twitter.com/nandovejer";
const REPO_URL = "https://github.com/nandovejer/coac";
const GITHUB_PRIVACY_URL =
  "https://docs.github.com/es/site-policy/privacy-policies/github-general-privacy-statement";
const AEPD_URL = "https://www.aepd.es";

/**
 * Página de privacidad (modal en `#privacidad`). Escrita para que la entienda
 * cualquiera, de 15 a 90 años: frases cortas, sin palabras técnicas y, si
 * hace falta una, explicada. Si cambias algo, cambia también la fecha de abajo
 * y `PRIVACY_VERSION` (policy.ts), para que el aviso vuelva a salir.
 */
export default function PrivacyDialog({ onClose }: { onClose: () => void }) {
  return (
    <InfoDialog title="Privacidad" titleId="privacy-title" onClose={onClose}>
      <InfoSection title="En pocas palabras">
        <ul className="coac-info__summary">
          <li>No usamos cookies.</li>
          <li>No te pedimos tu nombre, tu correo ni ningún otro dato.</li>
          <li>No sabemos quién eres ni qué miras.</li>
          <li>No hay anuncios ni nadie contando las visitas.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Qué se guarda en tu móvil u ordenador">
        <p>
          Solo unos pocos ajustes para que la web funcione como prefieres. Se quedan en tu aparato y no nos
          llegan ni a nosotros ni a nadie:
        </p>
        <ul>
          <li>
            Si ves la web clara, oscura o con más contraste. Se guarda la primera vez que entras, con el modo
            que ya usa tu aparato, y cambia si lo cambias tú.
          </li>
          <li>Que ya has cerrado el aviso de privacidad, para no enseñártelo cada vez.</li>
          <li>
            Mientras tienes la pestaña abierta, que ya has visto la animación de entrada, para no repetirla.
          </li>
        </ul>
        <p>
          Puedes borrarlos cuando quieras. En los ajustes del navegador, busca la opción de borrar los datos
          de las webs.
        </p>
      </InfoSection>

      <InfoSection title="Nombres de agrupaciones y autores">
        <p>
          La web enseña el nombre de cada agrupación, su modalidad, su ciudad y el nombre de sus autores, tal
          como salen en el listado oficial del concurso que publica el Ayuntamiento de Cádiz. Algunos autores
          aparecen con el apodo con el que se les conoce en el Carnaval.
        </p>
        <p>
          Lo hacemos para que puedas saber quién canta y cuándo. Es información que ya es pública y que
          interesa a la afición. Guardamos también los programas de años anteriores, como archivo.
        </p>
        <p>
          Si eres autor o autora y quieres que quitemos o corrijamos tu nombre o tu apodo, escríbenos{" "}
          {CONTACT_EMAIL ? (
            <>
              a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </>
          ) : (
            <>
              por <a href={AUTHOR_URL}>Twitter (X)</a> o en <a href={REPO_URL}>GitHub</a>
            </>
          )}{" "}
          y lo haremos lo antes posible.
        </p>
      </InfoSection>

      <InfoSection title="Dónde está la web">
        <p>
          La web está guardada en GitHub, una empresa que aloja páginas. Para enseñarte la página, GitHub
          necesita saber a dónde enviarla: la dirección de tu conexión a internet (se llama dirección IP).
          Pasa lo mismo en cualquier web.
        </p>
        <p>
          GitHub puede guardar ese dato un tiempo por seguridad. Nosotros no lo vemos ni lo guardamos. Si
          quieres saber más, lee la <a href={GITHUB_PRIVACY_URL}>privacidad de GitHub</a>.
        </p>
        <p>
          GitHub es una empresa de Estados Unidos. Se compromete a proteger estos datos con las garantías que
          exige la ley europea.
        </p>
      </InfoSection>

      <InfoSection title="Cuando pulsas un enlace">
        <p>
          Algunos botones te llevan a otras webs. Por ejemplo, «Ver el directo» abre YouTube. Al entrar en
          ellas, valen sus normas de privacidad, no las nuestras. Si no los pulsas, esas webs no se enteran de
          nada.
        </p>
      </InfoSection>

      <InfoSection title="Imprimir o descargar tu horario">
        <p>
          Cuando imprimes tu horario o lo descargas en PDF o en imagen, todo se hace en tu propio móvil u
          ordenador. No se envía a ningún sitio.
        </p>
      </InfoSection>

      <InfoSection title="Quién se encarga">
        <p>
          Esta web la hace Nando Muñoz, por su cuenta. Si tienes alguna duda, puedes escribirle por{" "}
          <a href={AUTHOR_URL}>Twitter (X)</a>, en <a href={REPO_URL}>GitHub</a>
          {CONTACT_EMAIL && (
            <>
              {" "}
              o por correo, a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </>
          )}
          .
        </p>
      </InfoSection>

      <InfoSection title="Tus derechos">
        <p>
          La ley te deja saber qué datos tuyos se guardan, corregirlos y pedir que se borren. De ti, como
          visitante, no guardamos nada. Si eres autor o autora y apareces en el programa, mira el apartado
          «Nombres de agrupaciones y autores».
        </p>
        <p>
          Si aun así crees que algo no está bien, puedes reclamar a la{" "}
          <a href={AEPD_URL}>Agencia Española de Protección de Datos</a>, que vigila que se cumpla la ley.
        </p>
      </InfoSection>

      <InfoSection title="Si algo cambia">
        <p>
          Si algún día la web cambia (por ejemplo, para contar las visitas), lo pondremos aquí antes y te
          volveremos a avisar.
        </p>
        <p className="coac-info__note">Última actualización: 12 de noviembre de 2026.</p>
      </InfoSection>
    </InfoDialog>
  );
}
