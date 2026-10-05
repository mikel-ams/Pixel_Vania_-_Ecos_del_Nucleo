/* Quince escenas; las tres primeras conservan el recorrido original. */
window.PixelWorld = (() => {
  const story = {
    title: "Pixel Vania: Ecos del Núcleo",
    intro: {
      title: "Una ciudad sin recuerdos",
      text: "Soy Vael-7. El Sector 9 se está apagando y LIRA me ha llamado. Buscaré las botas al oeste, cruzaré el cortafuegos y recuperaré un arma en la armería. Tres sellos protegen la Matriz.\n\nA: salto · B: pulso después de recoger el arma. A o B cierran mis mensajes. Tengo cinco unidades de vida.",
    },
    item_pickup: {
      title: "Botas de propulsión",
      text: "Ya puedo saltar dos veces. A o Espacio de nuevo en el aire. Volveré al este para cruzar el muro.",
    },
    victory: {
      title: "La memoria vuelve a casa",
      text: "Los ecos vuelven a la Matriz. LIRA reconstruye los recuerdos y NULL abandona el borrado. Vuelvo a ser el guardián de un hogar.\n\nHe completado las 15 escenas de Ecos del Núcleo.",
    },
    rooms: [
      {
        name: "Archivo oeste",
        theme: "crypt",
        color: "#75f9dd",
        goal: "boots",
        text: "Aquí están las botas. Con ellas podré saltar otra vez en el aire.",
      },
      {
        name: "Sala de control",
        theme: "crypt",
        color: "#75f9dd",
        goal: "travel",
        text: "LIRA sigue llamándome. Primero exploraré el archivo al oeste; después podré cruzar el muro.",
      },
      {
        name: "Cortafuegos",
        theme: "crypt",
        color: "#b194ed",
        goal: "travel",
        text: "No hay vuelta atrás. Las botas me permitirán cruzar estos pinchos.",
      },
      {
        name: "Acueducto de datos",
        theme: "water",
        color: "#78bdff",
        goal: "travel",
        text: "Los canales llevan recuerdos rotos. No tengo un arma: buscaré una armería antes de seguir.",
      },
      {
        name: "Armería olvidada",
        theme: "crypt",
        color: "#ffd68c",
        goal: "weapon",
        text: "Ese cañón de pulso aún tiene energía. Lo necesito para abrir los sellos que protegen el Núcleo.",
      },
      {
        name: "Taller de resonancia",
        theme: "forge",
        color: "#ffbb79",
        goal: "upgrade",
        text: "Un amplificador de resonancia. Si lo conecto al arma, cada disparo tendrá el doble de potencia.",
      },
      {
        name: "Canal del primer eco",
        theme: "water",
        color: "#78bdff",
        goal: "seal",
        text: "Ahora sí puedo defenderme. Restauraré el sello azul y despejaré la salida.",
      },
      {
        name: "Jardín de memoria",
        theme: "garden",
        color: "#a9f1b0",
        goal: "plate",
        text: "LIRA es el eco de quienes vivieron aquí. Esa placa verde parece alimentar el bloqueo.",
      },
      {
        name: "Estación de recuperación",
        theme: "garden",
        color: "#bfffd3",
        goal: "heal",
        text: "Una estación médica. Si estoy herido, recargará mis cinco unidades de vida. Solo queda una carga; mientras no la necesite, seguirá disponible.",
      },
      {
        name: "Fundición roja",
        theme: "forge",
        color: "#ffaa75",
        goal: "seal",
        text: "NULL intenta proteger la ciudad borrando sus recuerdos. El segundo sello puede detenerlo.",
      },
      {
        name: "Galería glacial",
        theme: "ice",
        color: "#bcecff",
        goal: "key",
        text: "La llave criónica está arriba. Tendré que saltar entre las repisas para alcanzarla.",
      },
      {
        name: "Bóveda del cerrojo",
        theme: "ice",
        color: "#8dd5ff",
        goal: "lock",
        text: "Este cerrojo reconoce la llave criónica. La llevaré al lector junto a la salida.",
      },
      {
        name: "Observatorio",
        theme: "sky",
        color: "#c6aeff",
        goal: "seal",
        text: "El último sello conserva mi propia memoria. Yo fui el guardián de este lugar antes del apagón.",
      },
      {
        name: "Reactor de latidos",
        theme: "forge",
        color: "#ffe090",
        goal: "timing",
        text: "El receptor solo acepta el pulso cuando brilla. Debo acertar en el momento justo y despejar la sala.",
      },
      {
        name: "Matriz del Núcleo",
        theme: "core",
        color: "#ee85ac",
        goal: "final",
        text: "Ya tengo los tres sellos. Recuperaré la matriz para devolver a LIRA y a la ciudad sus recuerdos.",
      },
    ],
  };
  const rooms = story.rooms;
  const sealRooms = [6, 9, 12];
  const gateRooms = [4, 5, 6, 7, 9, 10, 11, 12, 13];
  const columns = rooms.length * 20;
  function generate(seed = 9) {
    let state = seed >>> 0;
    const random = () =>
      (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
    const map = Array.from({ length: 12 }, () => Array(columns).fill("."));
    const platform = (row, start, len) => {
      for (let c = start; c < start + len; c++) map[row][c] = "#";
    };
    platform(0, 0, columns);
    platform(10, 0, columns);
    platform(11, 0, columns);
    for (let row = 0; row < 12; row++) {
      map[row][0] = "#";
      map[row][columns - 1] = "#";
    }
    platform(8, 7, 3);
    platform(6, 12, 3);
    platform(8, 17, 2);
    map[9][3] = "O";
    map[9][5] = "H";
    map[9][11] = "^";
    map[9][12] = "^";
    platform(8, 26, 3);
    platform(6, 21, 3);
    for (let row = 4; row < 10; row++) {
      map[row][37] = "#";
      map[row][38] = "#";
    }
    platform(4, 39, 3);
    for (let c = 44; c < 57; c++) map[9][c] = "^";
    platform(7, 43, 3);
    platform(6, 49, 3);
    platform(7, 55, 3);
    for (let room = 3; room < 15; room++) {
      const x = room * 20;
      if (![4, 8, 14].includes(room)) {
        for (let c = x + 7; c <= x + 9; c++) map[9][c] = "^";
        platform(7 + (random() < 0.5 ? 0 : 1), x + 6, 4);
        platform(6, x + 13, 3);
        map[9][x + 4] = "H";
        map[9][x + 5] = "#";
      }
      const variants = {
        5: "E",
        6: "e",
        7: "E",
        9: "b",
        10: "f",
        11: "F",
        12: "e",
        13: "b",
      };
      if (variants[room]) map[9][x + 15] = variants[room];
    }
    for (const room of gateRooms)
      for (let row = 1; row < 10; row++) map[row][room * 20 + 19] = "D";
    for (let room = 0; room < 15; room++) map[9][room * 20 + 2] = "C";
    // Recogidas y desafíos: siempre sobre superficies transitables.
    map[9][4 * 20 + 11] = "W";
    platform(9, 5 * 20 + 11, 3);
    map[8][5 * 20 + 12] = "U";
    map[9][5 * 20 + 17] = "X";
    for (const room of sealRooms) {
      platform(9, room * 20 + 11, 3);
      map[8][room * 20 + 12] = "S";
    }
    map[9][7 * 20 + 14] = "P";
    map[9][7 * 20 + 17] = "X";
    map[9][8 * 20 + 11] = "M";
    platform(8, 10 * 20 + 6, 4);
    platform(6, 10 * 20 + 11, 4);
    map[5][10 * 20 + 12] = "K";
    map[9][11 * 20 + 17] = "L";
    platform(9, 13 * 20 + 11, 3);
    map[8][13 * 20 + 12] = "T";
    for (let row = 1; row < 10; row++) map[row][14 * 20 + 4] = "G";
    platform(9, 14 * 20 + 15, 3);
    map[8][14 * 20 + 16] = "V";
    // Elementos no sólidos que el editor puede ampliar o sustituir.
    const detail = (r, c, t) => {
      if (map[r][c] === ".") map[r][c] = t;
    };
    for (let room = 0; room < 15; room++) {
      const x = room * 20,
        theme = rooms[room].theme;
      detail(3, x + 3, "w");
      detail(2, x + 17, "l");
      detail(5, x + 2, "p");
      detail(4, x + 10, "a");
      detail(8, x + 18, theme === "garden" ? "t" : theme === "ice" ? "c" : "r");
      detail(6, x + 4, theme === "water" ? "~" : theme === "forge" ? "!" : "v");
      if (room >= 5) detail(4, x + 16, ":");
    }
    return map.map((row) => row.join(""));
  }
  return { rooms, story, generate, sealRooms, gateRooms, columns };
})();
