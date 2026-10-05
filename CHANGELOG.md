# Cambios

## 0.5.0 · 5 de octubre de 2026

- Editor visual adaptable para las 15 escenas, con pincel, relleno, borrador, cuentagotas, historial, nombre, ambiente y pensamiento de Vael.
- Biblioteca de 30 piezas, terreno interactivo, elementos decorativos de ciudad, objetos de salud, escudo y mejora ×3.
- Guardado local de mapas independiente de la partida; exportación/importación JSON validada, vista de prueba y reposición de originales.
- Cinco variantes de enemigos: custodio, explorador, bruto, torreta y dron volador; dificultad de campaña y aprendizaje existentes se mantienen.
- Carrera, desplazamiento rápido y cuatro apariencias de armadura persistentes.
- Cámara suave con desplazamiento dentro de las salas; skyline continuo con puentes, antenas, rótulos y tránsito que revela partes nuevas al avanzar y retroceder.
- Pruebas físicas de los nuevos elementos y del editor, verificación de interfaz en navegador y 20 tamaños responsive.

## 0.4.0 · 4 de octubre de 2026

- Campaña ampliada de 8 a 15 escenas: armería, taller, canal, estación médica, galería glacial, bóveda y reactor intercalados en el recorrido.
- Primeras cinco escenas sin enemigos; B se habilita al recoger el arma en la armería.
- Amplificador temprano con daño ×2 y recarga ligeramente más rápida.
- Barra segmentada de cinco unidades de vida, invulnerabilidad breve y reconstrucción en el faro al agotarlas.
- Estación médica central de una sola carga; no se consume con la vida completa.
- Llave elevada, lector de cerrojo y receptor que solo responde durante su fase iluminada.
- Dificultad creciente por escena completada, sin duplicarla al revisitar: velocidad, visión y resistencia con límites.
- Aprendizaje online local de persecución, anticipación y evasión mediante recompensas de combate; modelo persistente separado del avance.
- Opción de restablecer juego y aprendizaje desde los diálogos o la pausa, con confirmación y cancelación.
- Partículas flotantes en cinco profundidades, con parallax y desenfoque aparente en las capas cercanas.
- Pensamientos de Vael con pausa, cierre A/B y aparición progresiva; fuente pixelada local con acentos y ñ.
- Ambiente glacial y nuevas superficies; migración de partidas del mapa anterior.
- Pruebas de mapas, vida, objetos, puertas, aprendizaje, reinicio, combate y ruta física completa; revisión responsive en 20 tamaños y controles reales en Chromium.

## 0.3.1 · 4 de octubre de 2026

- Consola ajustada al ancho y alto disponibles en celular, tablet y PC, conservando la proporción del escenario.
- Controles inferiores en vertical y laterales cuando el formato horizontal lo permite; objetivos táctiles de al menos 44px.
- Tipografía, objetivos y cabecera adaptables, con espacio para las zonas seguras y las barras del navegador.
- Diálogos sobre la ventana completa, con texto desplazable y acciones visibles.
- Reajuste al cambiar de orientación o tamaño, liberando las entradas que estuvieran pulsadas.
- Verificación en Chromium de 20 tamaños con entrada táctil y ratón, sin desbordamiento horizontal ni controles sobre el escenario.

## 0.3.0 · 4 de octubre de 2026

- Bloqueados el menú contextual, la selección, el arrastre y la llamada táctil en los controles y el escenario; el resto de la página conserva sus acciones del navegador.
- Banda inferior del suelo con parallax suave, sin desplazar los apoyos ni sus colisiones.
- Custodios biomecánicos con visión, alerta, memoria de la última posición, búsqueda y rutas con saltos entre plataformas.
- Dos impactos para derrotar a un custodio; destello de impacto y breve interrupción de su movimiento.
- Fogonazo de arma, estela de proyectil, casquillos, partículas, sacudida breve y retroceso físico en suelo y aire.
- Muerte de enemigos con sangre y fragmentos orgánicos sujetos a gravedad; manchas y cadáveres persistentes. Los enemigos derrotados no reaparecen al volver al faro ni al reanudar.
- Bloques biselados, escalones de 8px con colisión real, cajas destructibles y una placa de presión.
- Cuatro puertas de salida: combate y sello en acueducto, fundición y observatorio; combate y placa en el jardín.
- Balanceo y ligera inclinación al caminar, con animación del brazo al disparar.
- Lámparas, paneles, plantas que oscilan, goteos y brasas para dar vida al entorno.
- Guardado ampliado compatible con las partidas de la versión anterior.
- Pruebas de persecución física sobre obstáculos, nuevas puertas, retroceso, cadáveres y ruta completa de terreno.

## 0.2.0 · 4 de octubre de 2026

- Incorporado Three.js 0.180.0, incluido localmente, con cámara en perspectiva y composición de los sprites pixelart originales.
- Ampliación de tres a ocho pantallas conectadas: acueducto, jardín de memoria, fundición, observatorio y núcleo.
- Fondos con profundidad, movimiento parallax y motivos específicos por ambiente.
- Controles fuera del escenario, con disposición inferior o lateral según la orientación.
- Botón A para saltar y botón B, encima a su derecha, para lanzar pulsos.
- Entradas con Pointer Events, captura, multitáctil, cancelación y limpieza al perder el foco.
- Salto doble, tolerancia al abandonar bordes y breve memoria de pulsaciones de salto.
- Drones, tres sellos activados por disparos y una barrera final vinculada al avance.
- Faros de retorno y guardado local de mejoras, sellos y zonas descubiertas.
- Historia «Ecos del Núcleo», introducción, diálogos, archivo de zonas y final.
- Física a 60 Hz, mapas estables al morir y variación limitada por semilla.
- Fondo 2D de reserva si no hay WebGL; paquete ejecutable sin CDN ni instalación.
- Pruebas de generación, física, combate, multitáctil, avance y reanudación.
