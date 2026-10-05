(() => {
  const world = window.PixelWorld,
    scenes = window.PixelScenes;
  const $ = (id) => document.getElementById(id);
  const canvas = $("scene-canvas"),
    ctx = canvas.getContext("2d");
  const base = world.generate(9),
    master = scenes.load();
  let current = 0,
    selected = "#",
    tool = "brush",
    hovering = null,
    drawing = false,
    lastCell = "",
    dirty = false;
  const draft = structuredClone(master);
  const history = Array.from({ length: 15 }, () => ({ undo: [], redo: [] }));
  const color = {
    "#": "#6d6a88",
    H: "#adb5bc",
    X: "#a98464",
    "^": "#d381a0",
    z: "#80d9ed",
    B: "#edb86b",
    ">": "#88bbdf",
    "<": "#88bbdf",
    h: "#e1a9a4",
    "+": "#77f0a5",
    R: "#80ceff",
    Q: "#fcb66c",
    E: "#cc6991",
    e: "#f29e69",
    b: "#ac5172",
    F: "#9c9fff",
    f: "#74c9ef",
    l: "#fff3a3",
    w: "#94c8f1",
    t: "#89c89b",
    p: "#7e8eb1",
    a: "#bbb2bd",
    v: "#9ad1d4",
    r: "#b1a2a0",
    c: "#b9e8ff",
    "~": "#539cbb",
    ":": "#c6c9d3",
    "!": "#ffbd67",
    "?": "#67e6b2",
  };
  const glyph = {
    ".": "·",
    "#": "▦",
    H: "▤",
    X: "▣",
    "^": "▲",
    z: "▣",
    B: "↟",
    ">": "→",
    "<": "←",
    h: "♨",
    "+": "+",
    R: "◈",
    Q: "✦",
    E: "●",
    e: "◆",
    b: "■",
    F: "◉",
    f: "◇",
    l: "✧",
    w: "▣",
    t: "♣",
    p: "╬",
    a: "∩",
    v: "✳",
    r: "▪",
    c: "♦",
    "~": "≈",
    ":": "║",
    "!": "✹",
    "?": "▣",
  };
  function message(text, isError = false) {
    $("editor-status").textContent = text;
    $("editor-status").style.color = isError ? "#ff9ba9" : "#9fe8d4";
  }
  function baseCell(room, row, col) {
    return base[row][room * 20 + col];
  }
  function roomCell(row, col) {
    const patch = draft.rooms[current].patches.find(
      ([r, c]) => r === row && c === col,
    );
    return patch ? patch[2] : baseCell(current, row, col);
  }
  function updatePatch(row, col, tile) {
    if (
      !scenes.editable(current, row, col, base) ||
      (current <= 4 && scenes.enemies.has(tile))
    )
      return false;
    const patches = draft.rooms[current].patches,
      index = patches.findIndex(([r, c]) => r === row && c === col);
    const native = baseCell(current, row, col),
      before = index >= 0 ? patches[index][2] : native;
    if (before === tile) return false;
    if (index >= 0) patches.splice(index, 1);
    if (tile !== native) patches.push([row, col, tile]);
    dirty = true;
    return true;
  }
  function checkpoint() {
    const h = history[current];
    h.undo.push(JSON.stringify(draft.rooms[current]));
    if (h.undo.length > 80) h.undo.shift();
    h.redo = [];
  }
  function restore(direction) {
    const h = history[current],
      source = direction === "undo" ? h.undo : h.redo,
      dest = direction === "undo" ? h.redo : h.undo;
    if (!source.length) return;
    dest.push(JSON.stringify(draft.rooms[current]));
    draft.rooms[current] = JSON.parse(source.pop());
    dirty = true;
    showRoom();
    message(direction === "undo" ? "Cambio deshecho." : "Cambio recuperado.");
  }
  function coords(event) {
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor(((event.clientX - rect.left) / rect.width) * 20),
      row = Math.floor(((event.clientY - rect.top) / rect.height) * 12);
    return col >= 0 && col < 20 && row >= 0 && row < 12 ? { row, col } : null;
  }
  function fill(row, col, tile) {
    const original = roomCell(row, col),
      stack = [[row, col]],
      seen = new Set();
    if (original === tile) return false;
    let changed = false;
    while (stack.length) {
      const [r, c] = stack.pop(),
        key = `${r}:${c}`;
      if (
        seen.has(key) ||
        !scenes.editable(current, r, c, base) ||
        roomCell(r, c) !== original
      )
        continue;
      seen.add(key);
      changed = updatePatch(r, c, tile) || changed;
      for (const [dr, dc] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ])
        stack.push([r + dr, c + dc]);
    }
    return changed;
  }
  function apply(row, col, rightClick = false) {
    if (!scenes.editable(current, row, col, base)) {
      message(
        "Esta celda protege una misión, un faro o el límite del mapa.",
        true,
      );
      return;
    }
    let paint = rightClick || tool === "erase" ? "." : selected;
    if (tool === "pick" && !rightClick) {
      const tile = roomCell(row, col);
      if (scenes.allowed.has(tile)) {
        selected = tile;
        tool = "brush";
        updateTools();
        render();
      }
      return;
    }
    if (current <= 4 && scenes.enemies.has(paint)) {
      message("Los enemigos comienzan después de recoger el arma.", true);
      return;
    }
    if (tool === "fill" && !rightClick) {
      checkpoint();
      if (fill(row, col, paint)) {
        render();
        refreshCounts();
      } else history[current].undo.pop();
      return;
    }
    if (lastCell === `${row}:${col}`) return;
    lastCell = `${row}:${col}`;
    if (roomCell(row, col) === paint) return;
    if (!drawing) checkpoint();
    if (updatePatch(row, col, paint)) {
      render();
      refreshCounts();
    }
  }
  function updateTools() {
    document
      .querySelectorAll("[data-tool]")
      .forEach((el) =>
        el.classList.toggle("selected", el.dataset.tool === tool),
      );
    document
      .querySelectorAll(".swatch")
      .forEach((el) =>
        el.classList.toggle("active", el.dataset.tile === selected),
      );
    $("selected-label").textContent =
      `${tool === "erase" ? "Borrar" : tool === "fill" ? "Rellenar" : "Pincel"} · ${scenes.groups.flatMap((x) => x.tiles).find(([tile]) => tile === selected)?.[1] || "Vacío"}`;
  }
  function refreshCounts() {
    const room = draft.rooms[current];
    $("scene-count").textContent =
      `${room.patches.length} cambio${room.patches.length === 1 ? "" : "s"}`;
    $("room-list")
      .querySelectorAll(".room-entry")
      .forEach((el, i) =>
        el.classList.toggle("changed", draft.rooms[i].patches.length > 0),
      );
    $("btn-undo").disabled = history[current].undo.length === 0;
    $("btn-redo").disabled = history[current].redo.length === 0;
  }
  function showRoom() {
    const room = draft.rooms[current];
    $("scene-name").value = room.name;
    $("scene-theme").value = room.theme;
    $("scene-story").value = room.text;
    $("scene-title").textContent = room.name;
    $("btn-preview").href = `index.html?preview=${current}`;
    $("room-list")
      .querySelectorAll(".room-entry")
      .forEach((el, i) => el.classList.toggle("active", i === current));
    document
      .querySelectorAll(".swatch")
      .forEach(
        (el) =>
          (el.disabled = current <= 4 && scenes.enemies.has(el.dataset.tile)),
      );
    if (current <= 4 && scenes.enemies.has(selected)) selected = "#";
    updateTools();
    refreshCounts();
    render();
  }
  function drawTile(row, col, tile) {
    const x = col * 16,
      y = row * 16;
    if (tile === "#") {
      ctx.fillStyle = "#394054";
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = "#777e91";
      ctx.fillRect(x, y, 16, 3);
      ctx.fillRect(x + 2, y + 8, 12, 1);
      return;
    }
    if (tile === "H") {
      ctx.fillStyle = "#82939e";
      ctx.fillRect(x, y + 8, 16, 8);
      ctx.fillStyle = "#c1d7dd";
      ctx.fillRect(x, y + 8, 16, 2);
      return;
    }
    if (tile === "^") {
      ctx.fillStyle = "#cc6c88";
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 8, y + 16);
        ctx.lineTo(x + i * 8 + 4, y + 4);
        ctx.lineTo(x + i * 8 + 8, y + 16);
        ctx.fill();
      }
      return;
    }
    if (tile === "z") {
      ctx.fillStyle = "#68aabd";
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = "#d5f7fb";
      ctx.fillRect(x + 3, y + 2, 3, 12);
      return;
    }
    if (tile === "B") {
      ctx.fillStyle = "#c58b65";
      ctx.fillRect(x + 1, y + 12, 14, 4);
      ctx.fillStyle = "#f6d095";
      ctx.fillRect(x + 5, y + 5, 6, 5);
      return;
    }
    if (tile === ">" || tile === "<") {
      ctx.fillStyle = "#3f5b71";
      ctx.fillRect(x, y + 12, 16, 4);
      ctx.fillStyle = "#a0d6e0";
      ctx.fillRect(x + 5, y + 7, 7, 3);
      return;
    }
    if (tile === "h") {
      ctx.fillStyle = "#84596a";
      ctx.fillRect(x + 2, y + 12, 12, 4);
      ctx.fillStyle = "#e1a9a4";
      ctx.fillRect(x + 6, y + 2, 4, 8);
      return;
    }
    if (tile === "~") {
      ctx.fillStyle = "#225370";
      ctx.fillRect(x, y + 8, 16, 8);
      ctx.fillStyle = "#8cd7ea";
      ctx.fillRect(x + 2, y + 9, 9, 2);
      return;
    }
    if (tile === "t") {
      ctx.fillStyle = "#555e6b";
      ctx.fillRect(x + 7, y + 8, 3, 8);
      ctx.fillStyle = "#71b886";
      ctx.fillRect(x + 2, y + 2, 13, 9);
      return;
    }
    if (
      tile === "C" ||
      tile === "O" ||
      tile === "S" ||
      tile === "W" ||
      tile === "U" ||
      tile === "M" ||
      tile === "K" ||
      tile === "V" ||
      tile === "P" ||
      tile === "L" ||
      tile === "T"
    ) {
      ctx.fillStyle = "#62b6bd";
      ctx.fillRect(x + 3, y + 2, 10, 12);
      ctx.fillStyle = "#c8ffed";
      ctx.fillRect(x + 6, y + 5, 4, 5);
      return;
    }
    if (tile === "D" || tile === "G") {
      ctx.fillStyle = "#af6399";
      ctx.fillRect(x + 4, y, 8, 16);
      return;
    }
    if (tile === ".") return;
    ctx.fillStyle = color[tile] || "#899db2";
    ctx.fillRect(x + 3, y + 3, 10, 10);
    ctx.fillStyle = "#172436";
    ctx.fillRect(x + 6, y + 5, 4, 5);
  }
  const backgrounds = {
    crypt: "#101726",
    water: "#10283c",
    garden: "#142e29",
    forge: "#351e29",
    ice: "#1b3145",
    sky: "#232743",
    core: "#331a3c",
  };
  function render() {
    ctx.fillStyle = backgrounds[draft.rooms[current].theme];
    ctx.fillRect(0, 0, 320, 192);
    for (let row = 0; row < 12; row++)
      for (let col = 0; col < 20; col++) {
        const cell = roomCell(row, col);
        drawTile(row, col, cell);
        if (
          scenes.editable(current, row, col, base) &&
          cell !== baseCell(current, row, col)
        ) {
          ctx.fillStyle = "#fce294";
          ctx.fillRect(col * 16 + 13, row * 16 + 1, 2, 2);
        }
      }
    ctx.strokeStyle = "rgba(197,229,240,.12)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= 320; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, 192);
      ctx.stroke();
    }
    for (let y = 0; y <= 192; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(320, y + 0.5);
      ctx.stroke();
    }
    if (hovering) {
      ctx.strokeStyle = "#75f9dd";
      ctx.lineWidth = 1;
      ctx.strokeRect(hovering.col * 16 + 0.5, hovering.row * 16 + 0.5, 15, 15);
    }
  }
  scenes.groups.forEach((group) => {
    const box = document.createElement("section");
    box.className = "palette-group";
    const heading = document.createElement("h3");
    heading.textContent = group.name;
    box.append(heading);
    const grid = document.createElement("div");
    grid.className = "palette-grid";
    group.tiles.forEach(([tile, name]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swatch";
      btn.dataset.tile = tile;
      btn.style.setProperty("--swatch-color", color[tile] || "#9fe8dc");
      const icon = document.createElement("span");
      icon.className = "symbol";
      icon.textContent = glyph[tile] || tile;
      const label = document.createElement("span");
      label.textContent = name;
      btn.append(icon, label);
      btn.setAttribute("aria-label", name);
      btn.onclick = () => {
        selected = tile;
        tool = "brush";
        updateTools();
      };
      grid.append(btn);
    });
    box.append(grid);
    $("palette").append(box);
  });
  world.rooms.forEach((room, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "room-entry";
    btn.setAttribute("role", "listitem");
    btn.innerHTML = `<b>${String(i + 1).padStart(2, "0")}</b>`;
    const name = document.createElement("em");
    name.textContent = room.name;
    btn.append(name);
    btn.onclick = () => {
      current = i;
      lastCell = "";
      showRoom();
      message(`Escena ${i + 1}: ${draft.rooms[i].name}.`);
    };
    $("room-list").append(btn);
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    hovering = coords(e);
    if (!hovering) return;
    lastCell = "";
    drawing = false;
    apply(hovering.row, hovering.col, e.button === 2);
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    hovering = coords(e);
    if (hovering) {
      $("cursor-label").textContent =
        `Col ${hovering.col + 1} · Fila ${hovering.row + 1} · ${roomCell(hovering.row, hovering.col)}`;
      if (drawing && tool !== "fill" && tool !== "pick")
        apply(hovering.row, hovering.col, e.buttons === 2);
    }
    render();
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    canvas.addEventListener(name, () => {
      drawing = false;
      lastCell = "";
    });
  canvas.addEventListener("pointerleave", () => {
    hovering = null;
    render();
  });
  document.querySelectorAll("[data-tool]").forEach(
    (el) =>
      (el.onclick = () => {
        tool = el.dataset.tool;
        updateTools();
      }),
  );
  $("btn-undo").onclick = () => restore("undo");
  $("btn-redo").onclick = () => restore("redo");
  const updateMeta = () => {
    const room = draft.rooms[current],
      name = $("scene-name").value.trim().slice(0, 50),
      theme = $("scene-theme").value,
      text = $("scene-story").value.trim().slice(0, 400);
    if (name !== room.name || theme !== room.theme || text !== room.text) {
      checkpoint();
      Object.assign(room, {
        name: name || world.rooms[current].name,
        theme,
        text: text || world.rooms[current].text,
      });
      dirty = true;
      showRoom();
    }
  };
  for (const id of ["scene-name", "scene-theme", "scene-story"])
    $(id).addEventListener("change", updateMeta);
  $("btn-save").onclick = () => {
    try {
      scenes.save(draft);
      dirty = false;
      message(
        "Escenas guardadas. Abre «Probar esta escena» o recarga el juego para ver los cambios.",
      );
    } catch (error) {
      message("No se pudieron guardar: " + error.message, true);
    }
  };
  $("btn-export").onclick = () => {
    try {
      const contents = JSON.stringify(scenes.validate(draft), null, 2);
      const link = document.createElement("a");
      const url = URL.createObjectURL(
        new Blob([contents], { type: "application/json" }),
      );
      link.href = url;
      link.download = "PixelVania-escenas.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      message("Escenas exportadas como JSON.");
    } catch (error) {
      message(error.message, true);
    }
  };
  $("btn-import").onclick = () => $("import-file").click();
  $("import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (file.size > 128000) throw new Error("Archivo demasiado grande.");
      const imported = scenes.validate(JSON.parse(await file.text()));
      draft.rooms = imported.rooms;
      for (const h of history) {
        h.undo = [];
        h.redo = [];
      }
      dirty = true;
      showRoom();
      message("Archivo importado. Revisa las escenas y pulsa Guardar escenas.");
    } catch (error) {
      message("Importación rechazada: " + error.message, true);
    }
  });
  $("btn-reset-scenes").onclick = () => {
    if (
      !confirm(
        "¿Reponer las 15 escenas originales? Se borrarán las ediciones guardadas.",
      )
    )
      return;
    draft.rooms = scenes.blank().rooms;
    try {
      localStorage.removeItem(scenes.KEY);
      for (const h of history) {
        h.undo = [];
        h.redo = [];
      }
      dirty = false;
      showRoom();
      message(
        "Escenas originales restauradas. La partida y la IA permanecen intactas.",
      );
    } catch (error) {
      message("No se pudo restablecer: " + error.message, true);
    }
  };
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input,textarea,select")) return;
    const key = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && key === "z") {
      e.preventDefault();
      restore(e.shiftKey ? "redo" : "undo");
    } else if (["b", "f", "e", "i"].includes(key) && !e.altKey && !e.ctrlKey) {
      tool = { b: "brush", f: "fill", e: "erase", i: "pick" }[key];
      updateTools();
    }
  });
  window.addEventListener("beforeunload", (event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  showRoom();
})();
