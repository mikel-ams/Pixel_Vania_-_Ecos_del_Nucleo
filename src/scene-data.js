/* Formato compartido entre el editor y el juego. Solo se editan celdas seguras. */
window.PixelScenes = (() => {
  const KEY = "pixelvania-scenes-v1";
  const themes = ["crypt", "water", "garden", "forge", "ice", "sky", "core"];
  const groups = [
    {
      name: "Terreno",
      tiles: [
        [".", "Vacío"],
        ["#", "Bloque"],
        ["H", "Escalón"],
        ["X", "Caja"],
        ["^", "Pinchos"],
        ["z", "Cristal rompible"],
        ["B", "Muelle"],
        [">", "Cinta derecha"],
        ["<", "Cinta izquierda"],
        ["h", "Vapor intermitente"],
      ],
    },
    {
      name: "Objetos",
      tiles: [
        ["+", "Botiquín"],
        ["R", "Escudo"],
        ["Q", "Núcleo del arma"],
      ],
    },
    {
      name: "Enemigos",
      tiles: [
        ["E", "Custodio"],
        ["e", "Explorador"],
        ["b", "Bruto"],
        ["F", "Torreta"],
        ["f", "Dron"],
      ],
    },
    {
      name: "Ciudad",
      tiles: [
        ["l", "Farola"],
        ["w", "Ventana"],
        ["t", "Árbol"],
        ["p", "Tubería"],
        ["a", "Arco"],
        ["v", "Ventilador"],
        ["r", "Escombros"],
        ["c", "Cristal"],
        ["~", "Canal"],
        [":", "Cadena"],
        ["!", "Chispas"],
        ["?", "Terminal"],
      ],
    },
  ];
  const allowed = new Set(
    groups.flatMap((group) => group.tiles.map(([tile]) => tile)),
  );
  const enemies = new Set(["E", "e", "b", "F", "f"]);
  const protectedTiles = new Set([
    "O",
    "C",
    "W",
    "U",
    "M",
    "K",
    "L",
    "T",
    "S",
    "P",
    "D",
    "G",
    "V",
  ]);
  function editable(room, row, col, base) {
    return (
      Number.isInteger(room) &&
      room >= 0 &&
      room < 15 &&
      Number.isInteger(row) &&
      row >= 1 &&
      row <= 9 &&
      Number.isInteger(col) &&
      col >= 1 &&
      col <= 18 &&
      !protectedTiles.has(base[row][room * 20 + col])
    );
  }
  function validate(data, base = window.PixelWorld.generate(9)) {
    if (
      !data ||
      data.version !== 1 ||
      !Array.isArray(data.rooms) ||
      data.rooms.length !== 15
    )
      throw new Error(
        "El archivo debe contener 15 escenas en formato Pixel Vania 1.",
      );
    const rooms = data.rooms.map((room, index) => {
      if (
        !room ||
        typeof room !== "object" ||
        !Array.isArray(room.patches) ||
        room.patches.length > 180 ||
        typeof room.name !== "string" ||
        room.name.length > 50 ||
        typeof room.text !== "string" ||
        room.text.length > 400 ||
        !themes.includes(room.theme)
      )
        throw new Error(`Datos incorrectos en la escena ${index + 1}.`);
      const seen = new Set();
      const patches = room.patches.map((patch) => {
        if (!Array.isArray(patch) || patch.length !== 3)
          throw new Error(`Celda incorrecta en la escena ${index + 1}.`);
        const [row, col, tile] = patch;
        if (
          !editable(index, row, col, base) ||
          !allowed.has(tile) ||
          (index <= 4 && enemies.has(tile)) ||
          seen.has(`${row}:${col}`)
        )
          throw new Error(`Celda no permitida en la escena ${index + 1}.`);
        seen.add(`${row}:${col}`);
        return [row, col, tile];
      });
      let enemyCount = 0;
      for (let r = 1; r <= 9; r++)
        for (let c = 1; c <= 18; c++)
          if (enemies.has(base[r][index * 20 + c])) enemyCount++;
      for (const [r, c, t] of patches) {
        if (enemies.has(base[r][index * 20 + c])) enemyCount--;
        if (enemies.has(t)) enemyCount++;
      }
      if (enemyCount > 8)
        throw new Error(`Máximo ocho enemigos en la escena ${index + 1}.`);
      return {
        name: room.name.trim() || window.PixelWorld.rooms[index].name,
        theme: room.theme,
        text: room.text.trim() || window.PixelWorld.rooms[index].text,
        patches,
      };
    });
    return { version: 1, rooms };
  }
  function blank() {
    return {
      version: 1,
      rooms: window.PixelWorld.rooms.map((room) => ({
        name: room.name,
        theme: room.theme,
        text: room.text,
        patches: [],
      })),
    };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? validate(JSON.parse(raw)) : blank();
    } catch (error) {
      console.warn("Las escenas personalizadas no se pudieron cargar.", error);
      return blank();
    }
  }
  function save(data) {
    const clean = validate(data);
    localStorage.setItem(KEY, JSON.stringify(clean));
    return clean;
  }
  function compose(base, data) {
    const rows = base.map((row) => row.split(""));
    const safe = validate(data, base);
    safe.rooms.forEach((room, index) =>
      room.patches.forEach(([r, c, t]) => {
        rows[r][index * 20 + c] = t;
      }),
    );
    return rows.map((row) => row.join(""));
  }
  function applyMetadata(rooms, data) {
    validate(data).rooms.forEach((custom, index) => {
      Object.assign(rooms[index], {
        name: custom.name,
        theme: custom.theme,
        text: custom.text,
      });
    });
  }
  return {
    KEY,
    groups,
    themes,
    allowed,
    enemies,
    protectedTiles,
    editable,
    validate,
    blank,
    load,
    save,
    compose,
    applyMetadata,
  };
})();
