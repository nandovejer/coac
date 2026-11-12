# Tráiler de «¿Quién canta hoy en el COAC?»

Vídeo vertical (1080 × 1920, 30 fps, 28,2 s) para redes, hecho con
[HyperFrames](https://hyperframes.heygen.com): HTML y GSAP que se renderizan a MP4.

```bash
npm run check    # lint, ejecución, maquetación, contraste y audio
npm run dev      # vista previa en el navegador
npx hyperframes render -o renders/coac-trailer.mp4
```

## Guion

Desde la app hasta el cierre, todo va al doble de rápido: `jokes` y `claim` se
escriben a velocidad normal y se reproducen con `timeScale(2)`, y la grabación de
la app va a velocidad 2 (salvo mientras se escribe «Jona»).

| Segundos | Escena (`compositions/`) | Qué se ve (y qué dice la voz) |
| --- | --- | --- |
| 0–2 | `hook` | «¿Quién canta ahora en el Falla?» y la fachada, que enciende las luces |
| 2–6 | `wall` | Nombres reales de agrupaciones: «Catorce noches», «Ciento veinte agrupaciones», «¿Y la tuya, a qué hora canta?» |
| 6–9,3 | `app` | La app real: se busca «Jona» y sale su agrupación («Busca a tu autor, o a tu agrupación») |
| 9,3–18,6 | `jokes` | «COAC, según a quién preguntes»: un panel de horarios con seis acrónimos de broma (sin voz), cada uno con su color, hasta que el panel se duerme con «Coro O Agarrar la Camita» |
| 18,6–21,1 | `claim` | Gratis. Sin publicidad. Sin cookies. 100 % código abierto. («Gratis, sin publicidad y de código abierto») |
| 21,1–28,2 | `end` | La fachada, papelillos, «¿Quién canta hoy en el COAC?», `coac.com.es` y «el Carnaval es del pueblo» |

## De dónde sale cada cosa

- **La app** (`assets/app-take.mp4`) es la web de verdad, grabada fotograma a
  fotograma con el reloj parado en el viernes 8 de enero de 2027 a las 21:10.
  Para rehacerla (al cambiar de fase o de diseño), con la app servida en local:

  ```bash
  node video/scripts/capture.mjs http://localhost:4173/ /tmp/take
  cd /tmp/take && ffmpeg -f concat -i take.txt -vf "fps=30,format=yuv420p" -t 15.5 \
    -c:v libx264 -crf 16 -preset slow -g 15 -an <repo>/video/assets/app-take.mp4
  ```

  Si cambian los tiempos de `take.json`, hay que ajustar los de `compositions/app.html`.
- **La música** (`assets/music.wav`) es «Big Band Jazz», de TheoTer, en
  dominio público (CC0: no hay que acreditarla), desde su segundo 3,6. Va como
  cama muy baja (unos −29 LUFS sin voz) y se aparta 7 dB más bajo cada frase.
  Fuente: https://freesound.org/s/510802/
- **La voz** (`assets/voice/`) es Piper, un sintetizador de código abierto que
  corre en local, con la voz de España `es_ES-davefx-medium`. Los textos están en
  `scripts/voice-lines.txt` y `scripts/make-voice.py` los genera (instrucciones en
  su cabecera). Después se recortan los silencios, las frases de la app y de
  «Gratis» se aceleran un 12 % y todo se nivela a −15 LUFS con ffmpeg.
- Ni la música ni la voz se han podido escuchar al montarlas: solo medir.
- **Los efectos** (`assets/sfx/`) son los que trae HyperFrames (licencia de
  Pixabay, ver `assets/sfx/CREDITS.md`).
- Los nombres y las cifras salen de `src/data/COAC_2027_PRE.json`.

## Zonas seguras

Todo lo que hay que leer va entre los 168 y los 1330 px de alto: por debajo, las
redes pintan su propia interfaz.
