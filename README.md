# Pixel Vania · Ecos del Núcleo

Una aventura corta de plataformas y exploración con Vael-7, estética pixelart y fondos 3D hechos con Three.js. Esta ampliación conserva el sprite, la armadura, el movimiento y la idea de conseguir el salto doble para atravesar el cortafuegos del proyecto original.

Esta edición incorpora un editor visual para las 15 escenas. Abre `editor.html` desde la misma carpeta o usa el enlace **Editor de escenas** al pie del juego.

## Jugar

Abre `index.html` en un navegador moderno. El juego y Three.js están incluidos: no se descargan bibliotecas durante la partida.

Para desarrollo, editar la historia en JSON o publicar en un servidor web, ejecuta desde esta carpeta:

```sh
python3 -m http.server 8080
```

Abre `http://localhost:8080`. También puedes subir el contenido de esta carpeta a cualquier alojamiento web estático; `index.html` es la entrada. En Android, el servidor web resulta más práctico que abrir archivos desde el gestor de documentos.

## Controles

| Acción                                    | Pantalla táctil               | Teclado                                     |
| ----------------------------------------- | ----------------------------- | ------------------------------------------- |
| Movimiento                                | Flechas izquierda / derecha   | ← → o A / D                                 |
| Salto                                     | A                             | Espacio, W o ↑                              |
| Salto doble, después de obtener las botas | A otra vez en el aire         | Otra pulsación de salto en el aire          |
| Pulso                                     | B, encima y a la derecha de A | X o J; mantener para disparar repetidamente |
| Correr                                    | —                             | Mayús al moverse                             |
| Desplazamiento rápido                     | Doble toque en una dirección  | C hacia donde mira Vael                     |
| Pausa                                     | Botón de pausa                | Esc o P                                     |
| Volver al último faro                     | —                             | R                                           |
| Historia y mapa                           | Botón del pie de la interfaz  | Botón del pie de la interfaz                |
| Cerrar mensaje                            | A o B en el diálogo           | Espacio, W, ↑, X o J                        |

La letra A del botón táctil significa salto; la tecla A del teclado conserva la función original de moverse a la izquierda. Los controles permanecen fuera del escenario: debajo en vertical y a los lados cuando el formato horizontal ofrece espacio suficiente. Puedes mover y saltar con dos dedos; cancelar una pulsación o cambiar de pestaña libera las entradas.

Desde **Aspecto** en el menú puedes alternar entre cuatro colores de armadura. La elección se conserva con la partida. El desplazamiento rápido tiene una breve recarga.

## Editor de escenas

Elige una de las 15 escenas en el panel izquierdo y una pieza de la biblioteca. Pinta sobre el mapa de 20 × 12 bloques arrastrando o tocando. **Pincel**, **Rellenar**, **Borrar** y **Copiar** tienen atajos B, F, E e I; Ctrl+Z y Ctrl+Mayús+Z deshacen y rehacen. El botón derecho borra sin abrir el menú del navegador. Cambia también el nombre, el ambiente y el pensamiento de Vael.

La biblioteca contiene 30 piezas: suelo, pared, plataformas, pinchos, cajas, cristal rompible, muelles, cintas transportadoras, vapor intermitente, salud, escudo, mejora del arma, cinco tipos de enemigo y farolas, ventanas, árboles, tuberías, arcos, conductos, escombros, cristales, canales, cadenas, chispas y terminales para la ciudad. Los enemigos son custodio, explorador veloz, bruto resistente, torreta y dron volador. Salud restaura dos unidades, el escudo absorbe un golpe y la mejora eleva el arma a potencia ×3.

Pulsa **Guardar escenas** y luego **Probar esta escena**. La prueba abre la sala elegida con botas y arma para ensayar el diseño, sin sobrescribir el avance de la campaña ni entrenar la IA. El guardado del editor es independiente de la partida y del reinicio de juego e IA; **Reponer mapas originales** devuelve el diseño inicial. **Exportar JSON** genera una copia transferible; **Importar JSON** valida y recupera esa copia. El guardado local pertenece a ese navegador y a esa dirección: al cambiar de dispositivo o alojamiento, importa el JSON de nuevo.

Los faros, sellos, puertas, objetos imprescindibles, posición inicial y bordes exteriores están protegidos. No se admiten enemigos en las primeras cinco escenas ni más de ocho por escena. Las demás piezas permiten transformar el terreno: prueba el recorrido después de editarlo para comprobar que puede superarse.

## Pantallas y orientación

La consola se adapta al ancho y al alto disponibles en celular, tablet y PC, manteniendo la proporción del juego. Puedes girar el dispositivo durante la partida. En pantallas táctiles, los botones conservan un área de pulsación de al menos 44px y el diseño deja espacio para las zonas seguras. Los diálogos aprovechan la ventana completa y permiten desplazar el texto sin ocultar sus acciones.

## Vida, arma y desafíos

Empiezas con cinco unidades de vida. Un contacto enemigo o un pincho resta una; una protección breve evita perder varias unidades por el mismo contacto. Los pinchos te devuelven al faro conservando la vida restante. Al agotarse las cinco, puedes reconstruirte en el último faro con vida completa, conservando mejoras y objetivos resueltos. R vuelve al faro sin recargar vida.

Las primeras cinco escenas no contienen enemigos. La armería se encuentra entre el antiguo acueducto y el jardín: recoger el cañón habilita B y abre la salida. El taller siguiente contiene el amplificador, que duplica el daño y reduce ligeramente la recarga. Los enemigos aparecen a partir de ese taller.

La estación médica, cerca de la mitad de la campaña, restaura las cinco unidades. Solo consume su carga cuando estás herido; si tienes la vida completa, puedes volver más tarde. Una vez utilizada, permanece agotada incluso al morir o reanudar.

| Escena | Zona                     | Objetivo o desafío                                                  |
| ------ | ------------------------ | ------------------------------------------------------------------- |
| 01     | Archivo oeste            | Recuperar las botas de salto doble                                  |
| 02     | Sala de control          | Regresar del archivo y superar el muro                              |
| 03     | Cortafuegos              | Cruzar pinchos con plataformas y salto doble                        |
| 04     | Acueducto de datos       | Atravesar el canal sin arma ni enemigos                             |
| 05     | Armería olvidada         | Recoger el cañón de pulso                                           |
| 06     | Taller de resonancia     | Recoger la mejora ×2 y derrotar al custodio                         |
| 07     | Canal del primer eco     | Restaurar el primer sello y despejar la salida                      |
| 08     | Jardín de memoria        | Activar la placa verde y derrotar al custodio                       |
| 09     | Estación de recuperación | Recargar la vida si hace falta                                      |
| 10     | Fundición roja           | Restaurar el segundo sello y derrotar al custodio                   |
| 11     | Galería glacial          | Alcanzar la llave elevada y derrotar al custodio                    |
| 12     | Bóveda del cerrojo       | Acercar la llave al lector y despejar la salida                     |
| 13     | Observatorio             | Restaurar el tercer sello y derrotar al custodio                    |
| 14     | Reactor de latidos       | Disparar al receptor durante su fase iluminada y despejar la salida |
| 15     | Matriz del Núcleo        | Recuperar la matriz después de los tres sellos                      |

La campaña conserva las ocho zonas anteriores e intercala siete: la armería, la estación médica y cinco zonas de desafíos. Se empieza en la sala de control y se explora primero hacia el oeste. Las puertas exigen los objetivos de su sala; la llave se conserva para poder regresar y volver a usar el lector.

Cada escena completada aumenta la dificultad una sola vez. Los custodios ganan velocidad, alcance de detección y, cada cuatro escenas, resistencia, hasta un máximo de cinco puntos. Volver a cruzar una sala no acumula dificultad. El amplificador permite compensar esa resistencia.

## Aprendizaje de los enemigos

La IA aprende **durante la partida, en el navegador**, sin conexión a Internet ni servicios externos. Mantiene decisiones separadas para jugadores lejanos, cercanos o en el aire y prueba tres estrategias: persecución, anticipación del movimiento y evasión de proyectiles con salto. Aprende de cuánto se acerca, de los impactos recibidos, del daño que logra causar y de sus derrotas. La exploración de estrategias nunca desaparece por completo.

El modelo se guarda localmente, junto con el avance de la campaña pero en una clave independiente. Nueva partida conserva el aprendizaje. En el menú de pausa, **Restablecer juego e IA** abre una confirmación que borra ambos; Cancelar conserva el estado anterior. El aprendizaje es un modelo contextual pequeño, no un modelo de lenguaje ni un servicio remoto.

## Ambiente y narrativa

Partículas flotantes se desplazan en cinco capas de profundidad: las cercanas tienen más tamaño, movimiento relativo y bordes suaves; las lejanas son pequeñas y nítidas. El efecto funciona con Three.js y con el fondo 2D de reserva. Se reutilizan texturas pequeñas para evitar crear desenfoques costosos en cada fotograma.

La cámara sigue a Vael de forma progresiva dentro y entre salas. El paisaje de Three.js usa edificios, puentes, antenas, rótulos y tránsito en posiciones estables del mundo y distintas profundidades: caminar hacia adelante o volver revela zonas de la ciudad que antes quedaban fuera del encuadre. Los objetos de ciudad del editor aparecen en primer plano, vinculados al terreno.

Los pensamientos de Vael pausan la simulación. A o B, también dentro del diálogo, los cierran sin activar un salto ni un disparo. La fuente pixelada local incluye letras acentuadas y la ñ; el texto aparece de forma progresiva. La preferencia de movimiento reducido muestra el mensaje completo.

Los bloques bajos tienen relieve físico de 8px. Las cajas se rompen con B. Disparar aplica retroceso, también en el aire. Las muertes de custodios dejan sangre, fragmentos orgánicos con gravedad y cadáveres persistentes. Lámparas, plantas, goteos, brasas y el ambiente glacial animan el recorrido.

Los faros cian guardan el punto de retorno. Vida, arma, mejora, llave, estación utilizada, sellos, placas, escenas completadas y custodios derrotados se conservan localmente. Las partidas de 0.3.1 se migran al nuevo mapa, conservando sus mejoras y objetivos. El guardado y el aprendizaje dependen del navegador, dispositivo y dirección web; borrar sus datos elimina ambos. Sin almacenamiento disponible, la sesión sigue funcionando.

## Archivos y edición

- `src/engine.js`: física, vida, combate, objetos, desafíos, diálogos y dibujo de sprites.
- `src/adaptive-ai.js`: aprendizaje contextual, selección de estrategias, persistencia y reinicio.
- `src/world.js`: quince salas, mapas, objetivos y narrativa de reserva para la apertura local.
- `editor.html`, `editor.css`, `src/scene-editor.js`: taller visual, herramientas de pintura, vista de prueba, importación y exportación.
- `src/scene-data.js`: biblioteca de piezas, composición de mapas personalizados y validación del formato guardado.
- `story.json`: textos de la introducción, mejoras, final y zonas. Se carga desde un servidor; los textos de reserva permiten jugar directamente desde archivos locales.
- `src/renderer.js`: escena Three.js, cámara en perspectiva, fondos y composición con los sprites originales.
- `src/renderer.bundle.js`: versión preparada del renderizador, válida también al abrir `index.html` directamente.
- `vendor/`: Three.js 0.180.0 y su licencia MIT.
- `styles.css`: consola y controles adaptables.
- `src/responsive.js`: ajuste al tamaño visible, orientación, zonas seguras y disposición de controles.
- `assets/pixelvania.ttf`: fuente pixelada original incluida localmente.
- `STORYLINE.md`: argumento y progresión narrativa.

Los mapas originales usan una semilla y variaciones acotadas de plataformas. La campaña usa la semilla 9; las muertes mantienen el diseño para facilitar aprender los saltos. El editor guarda solo las diferencias respecto a estos mapas. Para ampliar el número total de niveles, edita `generate()` en `src/world.js`. La física se simula a 60 pasos por segundo, independientemente de la frecuencia de refresco de la pantalla.

Si cambias `src/renderer.js`, recompila el archivo preparado:

```sh
npm install
npm run build
```

No necesitas instalar nada para jugar. El juego conserva un fondo parallax 2D si WebGL no está disponible o se pierde su contexto.

## Verificación

Con Node.js instalado, `npm test` comprueba mapas con 200 semillas y 15 escenas, entradas simultáneas, menú contextual, vida e invulnerabilidad, recogidas, estación de un solo uso, llaves, puertas, dificultad, combate, cadáveres, persecución física con saltos, aprendizaje, reinicio y migración de partidas. También reproduce una ruta física continua hasta el final que recoge los objetos elevados y activa cada desafío. En esa ruta los enemigos están desactivados; combate y persecución se verifican en casos separados.

Las pruebas nuevas cubren el formato del editor, celdas protegidas, límite de enemigos, objetos, escudo, muelles, cintas, vapor, cristal, guardado y las variantes de enemigos.

La interfaz y Three.js se revisaron en Chromium en 20 tamaños, desde 280×568 hasta 2560×1440, con entrada táctil y ratón, en vertical y horizontal. Se comprobaron la proporción del escenario, los botones, los diálogos y la ausencia de desbordamiento horizontal. También se revisaron en el navegador los controles A/B, la fuente, el guardado, la recarga de vida y el reinicio del aprendizaje.
