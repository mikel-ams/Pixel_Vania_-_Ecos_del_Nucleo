"use strict";
const TILE_SIZE = 16,
  GRAVITY = 0.26,
  JUMP_FORCE = -6,
  MOVE_SPEED = 2,
  FRICTION = 0.82;
const canvas = document.getElementById("gameCanvas"),
  ctx = canvas.getContext("2d"),
  world = window.PixelWorld,
  story = world.story,
  $ = (id) => document.getElementById(id);
let seed = 9,
  LEVEL = world.generate(seed),
  cameraX = 320,
  time = 0,
  accumulator = 0,
  lastTime = 0,
  started = false,
  paused = true,
  gameWon = false,
  seals = new Set(),
  checkpoint = 1,
  visited = new Set([1]),
  enemies = [],
  shots = [],
  hostileShots = [],
  particles = [],
  cooldown = 0,
  attackFlash = 0,
  deaths = 0,
  corpses = [],
  stains = [],
  relays = new Set(),
  openedDoors = new Set(),
  shake = 0,
  collected = new Set(),
  bonusCollected = new Set(),
  keyring = new Set(),
  completed = new Set(),
  spoken = new Set([1]),
  previousRoom = 1,
  gameOver = false,
  dialogText = "",
  dialogChars = 0,
  dialogClock = 0,
  resetPending = false;
const ai = window.PixelAI;
const sceneStore = window.PixelScenes;
const customScenes = sceneStore?.load();
if (customScenes) sceneStore.applyMetadata(world.rooms, customScenes);
const previewRoom = (() => {
  try {
    const n = Number(new URLSearchParams(location.search).get("preview"));
    return Number.isInteger(n) &&
      n >= 0 &&
      n < 15 &&
      new URLSearchParams(location.search).has("preview")
      ? n
      : null;
  } catch {
    return null;
  }
})();
const player = {
    x: 368,
    y: 145,
    width: 12,
    height: 15,
    vx: 0,
    vy: 0,
    grounded: false,
    facingRight: true,
    frame: 0,
    canDoubleJump: false,
    hasDoubleJump: false,
    respawnX: 368,
    respawnY: 145,
    coyote: 0,
    jumpBuffer: 0,
    kick: 0,
    hp: 5,
    invulnerable: 0,
    hasWeapon: false,
    power: 1,
    shield: 0,
    suit: 0,
    dash: 0,
    dashDirection: 1,
    dashCooldown: 0,
  },
  keys = {},
  pointers = new Map(),
  keyboardKeys = new Set();
let storageOK = true;
try {
  localStorage.getItem("pixelvania-echoes-v1");
} catch {
  storageOK = false;
}
function save() {
  if (!storageOK || previewRoom !== null) return;
  try {
    localStorage.setItem(
      "pixelvania-echoes-v1",
      JSON.stringify({
        version: 2,
        hp: player.hp,
        weapon: player.hasWeapon,
        power: player.power,
        shield: player.shield,
        suit: player.suit,
        bonuses: [...bonusCollected],
        collected: [...collected],
        keyring: [...keyring],
        completed: [...completed],
        spoken: [...spoken],
        seed,
        checkpoint,
        boots: player.hasDoubleJump,
        seals: [...seals],
        visited: [...visited],
        deaths,
        won: gameWon,
        relays: [...relays],
        defeated: corpses.map((c) => ({
          id: c.id,
          x: c.x,
          y: c.y,
          dir: c.dir,
        })),
      }),
    );
  } catch {
    storageOK = false;
  }
}
function validSave(s) {
  if (
    !s ||
    ![1, 2].includes(s.version) ||
    !Number.isInteger(s.seed) ||
    typeof s.boots !== "boolean"
  )
    return false;
  const count = s.version === 1 ? 8 : world.rooms.length;
  const ints = (a, allowed) =>
    Array.isArray(a) &&
    a.length <= count &&
    a.every((n) => allowed.includes(n));
  const rooms = Array.from({ length: count }, (_, i) => i);
  if (
    !Number.isInteger(s.checkpoint) ||
    !rooms.includes(s.checkpoint) ||
    !ints(s.visited, rooms) ||
    !ints(s.seals, s.version === 1 ? [3, 5, 6] : world.sealRooms)
  )
    return false;
  if (
    s.relays !== undefined &&
    !ints(s.relays, s.version === 1 ? [4] : [7, 11, 13])
  )
    return false;
  if (
    s.defeated !== undefined &&
    (!Array.isArray(s.defeated) ||
      s.defeated.length > 160 ||
      !s.defeated.every(
        (c) =>
          Number.isInteger(c.id) &&
          c.id >= 0 &&
          c.id < count * 20 &&
          Number.isFinite(c.x) &&
          c.x >= 0 &&
          c.x <= count * 320 &&
          Number.isFinite(c.y) &&
          c.y >= 0 &&
          c.y <= 192 &&
          [-1, 1].includes(c.dir),
      ))
  )
    return false;
  if (
    s.version === 2 &&
    (!Number.isInteger(s.hp) ||
      s.hp < 0 ||
      s.hp > 5 ||
      typeof s.weapon !== "boolean" ||
      ![1, 2, 3].includes(s.power) ||
      (s.shield !== undefined &&
        (!Number.isInteger(s.shield) || s.shield < 0 || s.shield > 2)) ||
      (s.suit !== undefined &&
        (!Number.isInteger(s.suit) || s.suit < 0 || s.suit > 3)) ||
      (s.bonuses !== undefined &&
        (!Array.isArray(s.bonuses) ||
          s.bonuses.length > 2700 ||
          !s.bonuses.every(
            (n) => Number.isInteger(n) && n >= 0 && n < world.columns * 12,
          ))) ||
      (!s.weapon && s.power !== 1) ||
      !ints(s.collected, [4, 5, 8, 10]) ||
      !ints(s.keyring, [10]) ||
      !ints(s.completed, rooms) ||
      !ints(s.spoken, rooms))
  )
    return false;
  return true;
}
function migrateSave(s) {
  if (s.version === 2) return s;
  const rooms = [0, 1, 2, 6, 7, 9, 12, 14];
  return {
    ...s,
    version: 2,
    checkpoint: rooms[s.checkpoint],
    visited: s.visited.map((i) => rooms[i]),
    seals: s.seals.map((i) => rooms[i]),
    relays: (s.relays || []).map((i) => rooms[i]),
    hp: 5,
    weapon: s.boots,
    power: 1,
    collected: s.boots ? [4] : [],
    keyring: [],
    completed: [],
    spoken: s.visited.map((i) => rooms[i]),
    defeated: (s.defeated || []).map((c) => {
      const old = Math.floor(c.id / 20),
        room = rooms[old];
      return { ...c, id: room * 20 + (c.id % 20), x: c.x + (room - old) * 320 };
    }),
  };
}
let saved = null;
try {
  const s = JSON.parse(localStorage.getItem("pixelvania-echoes-v1"));
  if (validSave(s) && !s.won) saved = migrateSave(s);
} catch {}
function getTile(c, r) {
  return LEVEL[r]?.[c] || ".";
}
function modifyTile(r, c, t) {
  const row = LEVEL[r].split("");
  row[c] = t;
  LEVEL[r] = row.join("");
  invalidateNavigation();
}
function openGate() {
  for (let r = 1; r < 10; r++)
    modifyTile(r, (world.rooms.length - 1) * 20 + 4, ".");
}
function enemyMaxHP(type = "E") {
  const base = enemyStats().hp;
  return Math.max(
    1,
    Math.min(
      7,
      base +
        (["b", "F"].includes(type) ? 2 : ["e", "f"].includes(type) ? -1 : 0),
    ),
  );
}
function rebuildEntities() {
  enemies = [];
  for (let r = 0; r < 12; r++)
    for (let c = 0; c < world.columns; c++)
      if (["E", "e", "b", "F", "f"].includes(getTile(c, r))) {
        const type = getTile(c, r);
        const bornY = r * 16 + (type === "f" ? -27 : 4);
        enemies.push({
          type,
          x: c * 16,
          id: c + (r === 9 ? 0 : r * world.columns),
          room: Math.floor(c / 20),
          y: bornY,
          baseY: bornY,
          fireCD: 60,
          w: 12,
          h: 12,
          vy: 0,
          hp: enemyMaxHP(type),
          maxHP: enemyMaxHP(type),
          decisionTimer: 0,
          decisionDistance: 0,
          strategy: 0,
          grounded: false,
          alert: 0,
          mode: "patrol",
          jumpCD: 0,
          pathTimer: 0,
          path: [],
          base: c * 16,
          dir: -1,
          alive: true,
        });
        modifyTile(r, c, ".");
      }
  for (const body of corpses) {
    const e = enemies.find((e) => e.id === body.id);
    if (e) e.alive = false;
  }
  for (const id of bonusCollected) {
    const row = Math.floor(id / world.columns),
      col = id % world.columns;
    if (["+", "R", "Q"].includes(getTile(col, row))) modifyTile(row, col, ".");
  }
  if (player.hasDoubleJump) modifyTile(9, 3, ".");
  for (const room of seals) modifyTile(8, room * 20 + 12, ".");
  for (const room of collected) {
    const location = { 4: [9, 91], 5: [8, 112], 8: [9, 171], 10: [5, 212] }[
      room
    ];
    if (location) modifyTile(location[0], location[1], ".");
  }
  if (seals.size === 3) openGate();
  updateChallenges();
}
function setCheckpoint(room) {
  checkpoint = room;
  player.respawnX = room * 320 + 32;
  player.respawnY = 145;
  $("checkpoint-label").textContent =
    "FARO " + String(room + 1).padStart(2, "0");
  save();
}
function respawn(death = true) {
  if (death) deaths++;
  player.invulnerable = 120;
  player.x = player.respawnX;
  player.y = player.respawnY;
  player.vx = player.vy = 0;
  player.grounded = false;
  player.coyote = player.jumpBuffer = 0;
  player.canDoubleJump = player.hasDoubleJump;
  cameraX = Math.max(0, Math.min(world.columns * 16 - 320, player.x - 154));
  shots = [];
  hostileShots = [];
  player.kick = 0;
  player.dash = player.dashCooldown = 0;
  enemies.forEach((e) => {
    if (!e.alive) return;
    e.x = e.base;
    e.y = e.baseY;
    e.vy = 0;
    e.hp = e.maxHP = enemyMaxHP(e.type);
    e.dir = -1;
    e.alert = 0;
    e.path = [];
    e.mode = "patrol";
    e.decisionTimer = 0;
    e.fireCD = 60;
  });
  clearInputs();
  previousRoom = roomIndex();
  if (player.hp <= 0) {
    gameOver = true;
    showDialog(
      "Cinco vidas agotadas",
      "He agotado mi energía. El faro puede reconstruirme con cinco vidas. Mis mejoras y los desafíos resueltos seguirán aquí.",
      "A / B · Volver al faro",
      "VAEL—7 · SIN ENERGÍA",
    );
  }
  updateHUD();
  save();
}
function startGame(resume) {
  if (resume && saved) {
    saved = migrateSave(saved);
    seed = saved.seed;
    player.hp = saved.hp || 5;
    player.hasWeapon = saved.weapon;
    player.power = saved.power;
    player.shield = saved.shield || 0;
    player.suit = saved.suit || 0;
    bonusCollected = new Set(saved.bonuses || []);
    collected = new Set(saved.collected);
    keyring = new Set(saved.keyring);
    completed = new Set(saved.completed);
    spoken = new Set(saved.spoken);
    checkpoint = saved.checkpoint;
    player.hasDoubleJump = saved.boots;
    seals = new Set(saved.seals);
    visited = new Set(saved.visited);
    deaths = saved.deaths || 0;
    relays = new Set(saved.relays || []);
    corpses = (saved.defeated || []).map((c) => ({
      ...c,
      w: 12,
      h: 5,
      vy: 0,
      settled: false,
    }));
  } else {
    seed = 9;
    player.hp = 5;
    player.hasWeapon = false;
    player.power = 1;
    player.shield = player.suit = 0;
    bonusCollected = new Set();
    collected = new Set();
    keyring = new Set();
    completed = new Set();
    spoken = new Set([1]);
    checkpoint = 1;
    player.hasDoubleJump = false;
    seals = new Set();
    visited = new Set([1]);
    deaths = 0;
    corpses = [];
    relays = new Set();
  }
  stains = [];
  openedDoors = new Set();
  shake = 0;
  resetPending = false;
  player.kick = 0;
  for (const c of corpses) seedBlood(c);
  gameWon = false;
  gameOver = false;
  player.invulnerable = 90;
  LEVEL = customScenes
    ? sceneStore.compose(world.generate(seed), customScenes)
    : world.generate(seed);
  rebuildEntities();
  setCheckpoint(checkpoint);
  player.x = player.respawnX;
  player.y = player.respawnY;
  player.vx = player.vy = 0;
  player.grounded = false;
  player.coyote = player.jumpBuffer = 0;
  cameraX = Math.max(0, Math.min(world.columns * 16 - 320, player.x - 154));
  shots = [];
  hostileShots = [];
  player.dash = player.dashCooldown = 0;
  particles = [];
  cooldown = attackFlash = 0;
  player.canDoubleJump = player.hasDoubleJump;
  player.facingRight = true;
  player.frame = 0;
  $("btn-style").textContent = "Aspecto: " + suitNames[player.suit] + " ↻";
  previousRoom = checkpoint;
  started = true;
  closeDialog();
  updateHUD();
}
function clearInputs() {
  for (const k of Object.keys(keys)) keys[k] = false;
  pointers.clear();
  keyboardKeys.clear();
  document
    .querySelectorAll(".touch-btn")
    .forEach((el) => el.classList.remove("active"));
  player.jumpBuffer = 0;
}
function showDialog(
  title,
  text,
  label = "Continuar",
  tag = "TRANSMISIÓN · LIRA",
) {
  paused = true;
  resetPending = false;
  ai.save();
  $("btn-new").textContent = "Nueva partida";
  $("btn-new").onclick = () => startGame(false);
  clearInputs();
  $("dialog-title").textContent = title;
  dialogText = text;
  dialogChars = 0;
  dialogClock = 0;
  $("dialog-text").textContent = "";
  $("overlay").dataset.mode =
    tag.startsWith("VAEL") || tag.includes("RECUPERAD") ? "speech" : "menu";
  if (
    $("overlay").dataset.mode === "menu" ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    dialogChars = dialogText.length;
    $("dialog-text").textContent = dialogText;
  }
  $("dialog-tag").textContent = tag;
  $("btn-start").textContent = label;
  $("overlay").hidden = false;
  $("btn-new").hidden = true;
  $("btn-pause").textContent = "▶";
}
function closeDialog() {
  if (document.activeElement instanceof HTMLButtonElement)
    document.activeElement.blur();
  resetPending = false;
  paused = false;
  $("overlay").hidden = true;
  $("btn-pause").textContent = "Ⅱ";
  clearInputs();
  lastTime = performance.now();
  accumulator = 0;
}
function togglePause() {
  if (!started || gameWon) return;
  if (paused) advanceDialog();
  else
    showDialog(
      "Misión en pausa",
      "A / Espacio: salto y salto doble\nB / X / J: pulso · R: volver al faro",
      "Reanudar",
      "VAEL—7 · SECTOR 09",
    );
}
$("btn-start").onclick = () => {
  if (resetPending) {
    ai.reset();
    saved = null;
    startGame(false);
  } else if (!started) startGame(Boolean(saved));
  else if (gameWon) startGame(false);
  else if (gameOver) {
    gameOver = false;
    player.hp = 5;
    player.invulnerable = 120;
    closeDialog();
    save();
    updateHUD();
  } else closeDialog();
};
$("btn-new").onclick = () => startGame(false);
function advanceDialog() {
  if (!paused) return;
  dialogChars = dialogText.length;
  $("dialog-text").textContent = dialogText;
  $("btn-start").onclick();
}
$("dialog-a").onclick = advanceDialog;
$("dialog-b").onclick = advanceDialog;
$("btn-reset").onclick = () => {
  const previous = {
    paused,
    title: $("dialog-title").textContent,
    text: dialogText,
    label: $("btn-start").textContent,
    tag: $("dialog-tag").textContent,
    newHidden: $("btn-new").hidden,
  };
  showDialog(
    "Restablecer misión y aprendizaje",
    "Se borrarán el avance, las mejoras y lo aprendido por los enemigos en este navegador. ¿Empezar desde cero?",
    "A / B · Borrar y empezar",
    "REINICIO · CONFIRMACIÓN",
  );
  resetPending = true;
  $("btn-new").hidden = false;
  $("btn-new").textContent = "Cancelar";
  $("btn-new").onclick = () => {
    resetPending = false;
    if (previous.paused) {
      showDialog(previous.title, previous.text, previous.label, previous.tag);
      $("btn-new").hidden = previous.newHidden;
    } else closeDialog();
  };
};
$("btn-pause").onclick = togglePause;
const suitNames = ["carmesí", "cian", "dorado", "violeta"];
$("btn-style").onclick = () => {
  player.suit = (player.suit + 1) % 4;
  $("btn-style").textContent = "Aspecto: " + suitNames[player.suit] + " ↻";
  if (started) save();
};
$("btn-journal").onclick = () => {
  const lines = world.rooms
    .map(
      (r, i) =>
        `${visited.has(i) ? "●" : "○"} ${String(i + 1).padStart(2, "0")} · ${r.name}${visited.has(i) ? "\n" + r.text : ""}`,
    )
    .join("\n\n");
  showDialog(
    "Ecos del Sector 9",
    lines,
    started ? "Volver al juego" : saved ? "Continuar misión" : "Iniciar misión",
    "ARCHIVO · MAPA Y MEMORIA",
  );
};
function jumpTrigger() {
  if (paused || !started || gameWon) return;
  player.jumpBuffer = 7;
}
function performJump() {
  if (player.coyote > 0) {
    player.vy = JUMP_FORCE;
    player.grounded = false;
    player.coyote = 0;
    player.canDoubleJump = player.hasDoubleJump;
    player.jumpBuffer = 0;
    spawnParticles(player.x + 6, player.y + 15, "#aaa", 4);
  } else if (player.hasDoubleJump && player.canDoubleJump) {
    player.vy = JUMP_FORCE * 0.92;
    player.canDoubleJump = false;
    player.jumpBuffer = 0;
    spawnParticles(player.x + 6, player.y + 15, "#75f9dd", 12);
  }
}
function pulse() {
  if (paused || !started || gameWon || !player.hasWeapon || cooldown > 0)
    return;
  cooldown = player.power === 3 ? 12 : player.power > 1 ? 15 : 18;
  attackFlash = 7;
  const direction = player.facingRight ? 1 : -1;
  player.kick = Math.max(
    -2.4,
    Math.min(2.4, player.kick - direction * (player.grounded ? 1.1 : 1.6)),
  );
  if (!player.grounded) player.vy = Math.max(-6, player.vy - 0.16);
  shake = Math.max(shake, 1.7);
  spawnParticles(player.x + 6 + direction * 9, player.y + 7, "#fff0ba", 5);
  particles.push({
    x: player.x + 6,
    y: player.y + 5,
    vx: -direction * 0.6,
    vy: -1.5,
    gravity: 0.13,
    life: 35,
    color: "#e5b867",
    size: 1,
  });
  shots.push({
    x: player.x + 6 + direction * 8,
    y: player.y + 7,
    vx: player.facingRight ? 4 : -4,
    life: 65,
    damage: player.power,
  });
}
let lastDirectionTap = { ArrowLeft: 0, ArrowRight: 0 };
function dash(direction) {
  if (paused || !started || gameWon || player.dashCooldown > 0) return;
  player.dash = 10;
  player.dashCooldown = 72;
  player.dashDirection = direction;
  player.facingRight = direction > 0;
  spawnParticles(player.x + 6, player.y + 8, world.rooms[roomIndex()].color, 8);
}
function setupButton(id, key, action) {
  const el = $(id);
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (paused) {
      if (id === "btn-jump" || id === "btn-pulse") advanceDialog();
      return;
    }
    el.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, key);
    keys[key] = true;
    el.classList.add("active");
    if (action) action();
    if (key === "ArrowLeft" || key === "ArrowRight") {
      const now = performance.now();
      if (now - lastDirectionTap[key] < 280 && now - lastDirectionTap[key] > 50)
        dash(key === "ArrowRight" ? 1 : -1);
      lastDirectionTap[key] = now;
    }
  });
  const release = (e) => {
    pointers.delete(e.pointerId);
    keys[key] = keyboardKeys.has(key) || [...pointers.values()].includes(key);
    if (!keys[key]) el.classList.remove("active");
  };
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);
  el.addEventListener("lostpointercapture", release);
}
setupButton("btn-left", "ArrowLeft");
setupButton("btn-right", "ArrowRight");
setupButton("btn-jump", "Space", jumpTrigger);
setupButton("btn-pulse", "KeyX", pulse);
// Bloquear únicamente las superficies de juego: el resto de la página conserva sus menús.
for (const el of [$("mobile-controls"), $("viewport-wrapper")]) {
  el.addEventListener("contextmenu", (e) => e.preventDefault());
  el.addEventListener("selectstart", (e) => e.preventDefault());
  el.addEventListener("dragstart", (e) => e.preventDefault());
}
window.addEventListener("keydown", (e) => {
  if (
    paused &&
    !e.repeat &&
    ["Space", "ArrowUp", "KeyW", "KeyX", "KeyJ"].includes(e.code)
  ) {
    e.preventDefault();
    advanceDialog();
    return;
  }
  if (
    paused &&
    e.target instanceof HTMLButtonElement &&
    ["Space", "Enter"].includes(e.code)
  )
    return;
  if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp"].includes(e.code))
    e.preventDefault();
  if (e.code === "Escape" || e.code === "KeyP") {
    if (!e.repeat) togglePause();
    return;
  }
  if (paused) return;
  keyboardKeys.add(e.code);
  keys[e.code] = true;
  if (!e.repeat && ["Space", "ArrowUp", "KeyW"].includes(e.code)) jumpTrigger();
  if (!e.repeat && ["KeyX", "KeyJ"].includes(e.code)) pulse();
  if (!e.repeat && e.code === "KeyR") respawn(false);
  if (!e.repeat && e.code === "KeyC") dash(player.facingRight ? 1 : -1);
});
window.addEventListener("keyup", (e) => {
  keyboardKeys.delete(e.code);
  keys[e.code] = [...pointers.values()].includes(e.code);
});
window.addEventListener("pagehide", () => {
  save();
  ai.save();
});
window.addEventListener("blur", () => {
  clearInputs();
  if (started && !paused && !gameWon) togglePause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInputs();
    if (started && !paused && !gameWon) togglePause();
  }
});
function solidRects(x, y, w, h) {
  const hits = [];
  for (let r = Math.floor(y / 16); r <= Math.floor((y + h - 0.01) / 16); r++)
    for (
      let c = Math.floor(x / 16);
      c <= Math.floor((x + w - 0.01) / 16);
      c++
    ) {
      const t = getTile(c, r);
      if (!["#", "G", "D", "H", "X", "z"].includes(t)) continue;
      const rect = {
        x: c * 16,
        y: r * 16 + (t === "H" ? 8 : 0),
        w: 16,
        h: t === "H" ? 8 : 16,
        r,
        c,
        t,
      };
      if (overlaps({ x, y, w, h }, rect)) hits.push(rect);
    }
  return hits;
}
function collision(x, y, w, h, type = "#") {
  if (type === "#") return solidRects(x, y, w, h).length > 0;
  for (let r = Math.floor(y / 16); r <= Math.floor((y + h - 0.01) / 16); r++)
    for (let c = Math.floor(x / 16); c <= Math.floor((x + w - 0.01) / 16); c++)
      if (getTile(c, r) === type) return true;
  return false;
}
function moveBody(body, dx, dy, step = true) {
  const w = body.w || body.width,
    h = body.h || body.height;
  body.x += dx;
  let hits = solidRects(body.x, body.y, w, h);
  if (hits.length) {
    let climbed = false;
    if (step && body.grounded && dx !== 0)
      for (let lift = 1; lift <= 8; lift++) {
        if (!collision(body.x, body.y - lift, w, h)) {
          body.y -= lift;
          climbed = true;
          break;
        }
      }
    if (!climbed) {
      if (dx > 0) body.x = Math.min(...hits.map((t) => t.x)) - w - 0.01;
      else if (dx < 0) body.x = Math.max(...hits.map((t) => t.x + t.w)) + 0.01;
      body.blocked = true;
    }
  } else body.blocked = false;
  body.y += dy;
  body.grounded = false;
  hits = solidRects(body.x, body.y, w, h);
  if (hits.length) {
    if (dy >= 0) {
      body.y = Math.min(...hits.map((t) => t.y)) - h - 0.01;
      body.grounded = true;
    } else body.y = Math.max(...hits.map((t) => t.y + t.h)) + 0.01;
    body.vy = 0;
  }
}
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++)
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 2 - 1,
      life: 15 + Math.random() * 15,
      color,
    });
}
function overlaps(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}
function roomIndex() {
  return Math.max(
    0,
    Math.min(world.rooms.length - 1, Math.floor((player.x + 6) / 320)),
  );
}
function enemyStats() {
  const n = completed.size;
  return {
    hp: Math.min(5, 2 + Math.floor(n / 4)),
    speed: 1 + Math.min(0.38, n * 0.027),
    vision: 224 + Math.min(64, n * 5),
  };
}
function completeRoom(room) {
  if (completed.has(room)) return;
  completed.add(room);
  for (const e of enemies)
    if (e.alive) {
      const hp = enemyMaxHP(e.type);
      e.hp += Math.max(0, hp - e.maxHP);
      e.maxHP = hp;
    }
  save();
  updateHUD();
}
function roomReady(room) {
  const goal = world.rooms[room].goal;
  const clear = !enemies.some((e) => e.room === room && e.alive);
  const objective = {
    boots: player.hasDoubleJump,
    weapon: player.hasWeapon,
    upgrade: player.power > 1,
    seal: seals.has(room),
    plate: relays.has(room),
    heal: true,
    key: keyring.has(10),
    lock: relays.has(11),
    timing: relays.has(13),
    travel: true,
    final: gameWon,
  };
  return clear && Boolean(objective[goal]);
}
function updateHUD() {
  const i = roomIndex(),
    goal = world.rooms[i].goal;
  $("room-label").textContent =
    `${String(i + 1).padStart(2, "0")} / 15 · ${world.rooms[i].name}`;
  $("ability-label").textContent = player.hasDoubleJump
    ? "SALTO DOBLE"
    : "SALTO SIMPLE";
  $("progress").textContent =
    `${seals.size}/3 sellos · DIF ${completed.size + 1}`;
  $("health-fill").style.width = `${player.hp * 20}%`;
  $("health-bar").setAttribute("aria-valuenow", player.hp);
  $("health-label").textContent =
    `VIDA ${player.hp}/5${player.shield ? ` ◈${player.shield}` : ""}`;
  $("weapon-label").textContent = player.hasWeapon
    ? `PULSO ×${player.power}`
    : "SIN ARMA";
  $("btn-pulse").classList.toggle("locked", !player.hasWeapon);
  const remaining = enemies.filter((e) => e.room === i && e.alive).length;
  const missions = {
    boots: "Recupera las botas del archivo oeste",
    travel: player.hasDoubleJump
      ? "Cruza las plataformas hacia el este"
      : "Busca las botas hacia el oeste",
    weapon: "Recoge el cañón de pulso",
    upgrade: "Recoge el amplificador del taller",
    seal: seals.has(i) ? "Despeja la salida" : "Dispara al sello con B",
    plate: relays.has(i) ? "Despeja la salida" : "Pisa la placa verde",
    heal: collected.has(8)
      ? "Continúa hacia la fundición"
      : player.hp < 5
        ? "Recarga tus cinco vidas en la estación"
        : "Estación disponible · continúa o vuelve herido",
    key: keyring.has(10)
      ? "Despeja la salida"
      : "Recoge la llave criónica en la repisa alta",
    lock: relays.has(11)
      ? "Despeja la salida"
      : keyring.has(10)
        ? "Acerca la llave al lector de la salida"
        : "Busca la llave en la galería anterior",
    timing: relays.has(13)
      ? "Despeja la salida"
      : "Dispara al receptor mientras esté iluminado",
    final:
      seals.size === 3
        ? "Recupera la Matriz del Núcleo"
        : "Restaura los tres sellos",
  };
  $("objective").textContent =
    "OBJETIVO · " +
    (openedDoors.has(i)
      ? "Salida abierta · sigue hacia el este"
      : missions[goal]) +
    (remaining ? " · " + remaining + " custodio" : "");
}
function damagePlayer(source = null, hazard = false) {
  if (player.invulnerable > 0 || gameOver) return false;
  if (player.shield > 0) {
    player.shield--;
    player.invulnerable = 75;
    spawnParticles(player.x + 6, player.y + 7, "#8ddfff", 20);
    shake = 1.6;
    save();
    updateHUD();
    return true;
  }
  player.hp = Math.max(0, player.hp - 1);
  player.invulnerable = 90;
  shake = 3;
  spawnParticles(player.x, player.y, "#d93855", 16);
  if (source) {
    ai.reward(source.context, source.strategy, 2.5);
    player.kick = (player.x > source.x ? 1 : -1) * 2.4;
    player.vy = -2.5;
  }
  if (player.hp === 0) {
    respawn(true);
    return true;
  } else if (hazard) respawn(false);
  save();
  updateHUD();
  return true;
}
function processPickups() {
  const room = roomIndex();
  const pickup = (tile) => collision(player.x, player.y, 12, 15, tile);
  const take = (row, column) => {
    modifyTile(row, column, ".");
    collected.add(room);
    spawnParticles(player.x, player.y, world.rooms[room].color, 22);
    save();
    updateHUD();
  };
  if (pickup("W")) {
    player.hasWeapon = true;
    take(9, 91);
    showDialog(
      "Cañón de pulso",
      "Lo tengo. B o X / J dispara; mantén el botón para repetir. A partir de aquí puede haber custodios.",
      "A / B · Continuar",
      "VAEL—7 · ARMA RECUPERADA",
    );
    return true;
  }
  if (pickup("U")) {
    player.power = 2;
    take(8, 112);
    showDialog(
      "Resonancia doble",
      "El amplificador funciona: cada pulso causa el doble de daño y la recarga es un poco más rápida.",
      "A / B · Continuar",
      "VAEL—7 · MEJORA RECUPERADA",
    );
    return true;
  }
  if (pickup("M") && player.hp < 5) {
    player.hp = 5;
    take(9, 171);
    completeRoom(8);
    showDialog(
      "Energía restaurada",
      "Cinco unidades de vida. La estación ha agotado su carga, así que cuidaré cada una.",
      "A / B · Continuar",
      "VAEL—7 · RECARGA",
    );
    return true;
  }
  if (pickup("K")) {
    keyring.add(10);
    take(5, 212);
    showDialog(
      "Llave criónica",
      "La llevaré hasta el lector de la bóveda. El cerrojo ya no podrá detenerme.",
      "A / B · Continuar",
      "VAEL—7 · LLAVE RECUPERADA",
    );
    return true;
  }
  // Las piezas añadidas en el editor recuerdan su posición individual.
  for (
    let row = Math.max(1, Math.floor(player.y / 16));
    row <= Math.min(9, Math.floor((player.y + 14) / 16));
    row++
  )
    for (
      let col = Math.floor(player.x / 16);
      col <= Math.floor((player.x + 11) / 16);
      col++
    ) {
      const tile = getTile(col, row);
      if (
        !["+", "R", "Q"].includes(tile) ||
        (tile === "+" && player.hp === 5) ||
        (tile === "Q" && !player.hasWeapon)
      )
        continue;
      if (tile === "+") player.hp = Math.min(5, player.hp + 2);
      if (tile === "R") player.shield = Math.min(2, player.shield + 1);
      if (tile === "Q") player.power = 3;
      bonusCollected.add(row * world.columns + col);
      modifyTile(row, col, ".");
      spawnParticles(
        player.x + 6,
        player.y + 6,
        tile === "+" ? "#9ef8bd" : tile === "R" ? "#87d9ff" : "#ffb979",
        18,
      );
      save();
      updateHUD();
    }
  if (pickup("L") && keyring.has(10) && !relays.has(11)) {
    relays.add(11);
    spawnParticles(player.x, player.y, "#bcecff", 18);
    save();
  }
  return false;
}

function update() {
  time++;
  player.dashCooldown = Math.max(0, player.dashCooldown - 1);
  if (player.dash > 0) {
    player.dash--;
    spawnParticles(
      player.x + 6,
      player.y + 8,
      world.rooms[roomIndex()].color,
      1,
    );
  }
  player.invulnerable = Math.max(0, player.invulnerable - 1);
  if (time % 600 === 0) ai.save();
  cooldown = Math.max(0, cooldown - 1);
  attackFlash = Math.max(0, attackFlash - 1);
  shake *= 0.72;
  updateRemains();
  if (keys.KeyX || keys.KeyJ) pulse();
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.vy += p.gravity || 0;
    p.y += p.vy;
    if (p.gore && collision(p.x, p.y, p.size || 2, p.size || 2)) {
      p.y -= p.vy;
      p.vy = 0;
      p.vx *= 0.45;
      if (!p.marked) {
        stains.push({
          x: p.x,
          y: p.y,
          color: p.color,
          w: p.size || 2,
          h: p.organ ? 2 : 1,
        });
        p.marked = true;
      }
    }
    if (--p.life <= 0) particles.splice(i, 1);
  }
  for (let i = hostileShots.length - 1; i >= 0; i--) {
    const bolt = hostileShots[i];
    bolt.x += bolt.vx;
    bolt.y += bolt.vy;
    bolt.life--;
    if (bolt.life <= 0 || collision(bolt.x - 2, bolt.y - 2, 4, 4)) {
      hostileShots.splice(i, 1);
      continue;
    }
    if (
      overlaps(
        { x: bolt.x - 2, y: bolt.y - 2, w: 4, h: 4 },
        { x: player.x, y: player.y, w: 12, h: 15 },
      )
    ) {
      hostileShots.splice(i, 1);
      damagePlayer(bolt);
      if (paused) return;
    }
  }
  player.coyote = player.grounded ? 6 : Math.max(0, player.coyote - 1);
  if (player.jumpBuffer > 0) {
    performJump();
    player.jumpBuffer--;
  }
  const left = !!(keys.ArrowLeft || keys.KeyA),
    right = !!(keys.ArrowRight || keys.KeyD);
  if (left !== right) {
    player.vx =
      (left ? -MOVE_SPEED : MOVE_SPEED) *
      (keys.ShiftLeft || keys.ShiftRight ? 1.3 : 1);
    player.facingRight = !left;
    player.frame++;
  } else {
    player.vx *= FRICTION;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
    player.frame = 0;
  }
  player.vy = Math.min(player.vy + GRAVITY, 7);
  const belt = player.grounded
    ? collision(player.x, player.y, 12, 15, ">")
      ? 0.58
      : collision(player.x, player.y, 12, 15, "<")
        ? -0.58
        : 0
    : 0;
  moveBody(
    player,
    player.vx +
      player.kick +
      belt +
      (player.dash ? player.dashDirection * 3.2 : 0),
    player.vy,
  );
  if (player.blocked) {
    player.vx = 0;
    player.kick = 0;
  }
  player.kick *= 0.78;
  if (player.grounded) player.canDoubleJump = player.hasDoubleJump;
  if (player.grounded && collision(player.x, player.y, 12, 15, "B")) {
    player.vy = -8;
    player.grounded = false;
    player.canDoubleJump = player.hasDoubleJump;
    spawnParticles(player.x + 6, player.y + 14, "#ffcf81", 9);
  }
  if (time % 120 < 50 && collision(player.x, player.y, 12, 15, "h"))
    damagePlayer();
  if (collision(player.x, player.y, 12, 15, "^") || player.y > 200) {
    damagePlayer(null, true);
    return;
  }
  const room = roomIndex();
  if (room !== previousRoom) {
    if (room > previousRoom && roomReady(previousRoom))
      completeRoom(previousRoom);
    previousRoom = room;
  }
  if (!visited.has(room)) {
    visited.add(room);
    save();
    updateHUD();
  }
  if (
    player.grounded &&
    Math.abs(player.x - (room * 320 + 32)) < 20 &&
    checkpoint !== room
  )
    setCheckpoint(room);
  if (collision(player.x, player.y, 12, 15, "O")) {
    player.hasDoubleJump = true;
    completeRoom(0);
    player.canDoubleJump = true;
    modifyTile(9, 3, ".");
    spawnParticles(player.x, player.y, "#75f9dd", 25);
    save();
    updateHUD();
    showDialog(
      story.item_pickup.title,
      story.item_pickup.text,
      "Probar salto doble",
      "MEJORA RECUPERADA",
    );
  }
  if (processPickups()) {
    updateChallenges();
    return;
  }
  if (!spoken.has(room) && !paused) {
    spoken.add(room);
    save();
    showDialog(
      world.rooms[room].name,
      world.rooms[room].text,
      "A / B · Continuar",
      "VAEL—7 · PENSAMIENTO",
    );
    return;
  }
  if (paused) return;
  for (const e of enemies) {
    if (!e.alive || Math.abs(e.x - player.x) > 420) continue;
    const beforeDeaths = deaths;
    updateEnemy(e);
    if (deaths !== beforeDeaths || paused) return;
  }
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.x += s.vx;
    let remove = --s.life <= 0;
    const hit = solidRects(s.x - 2, s.y - 2, 4, 4)[0];
    if (hit) {
      if (hit.t === "X" || hit.t === "z") {
        modifyTile(hit.r, hit.c, ".");
        spawnParticles(hit.x + 8, hit.y + 8, "#c2a783", 14);
      } else spawnParticles(s.x, s.y, "#f0d695", 4);
      shots.splice(i, 1);
      continue;
    }
    for (const e of enemies)
      if (e.alive && overlaps({ x: s.x - 3, y: s.y - 3, w: 6, h: 6 }, e)) {
        e.hp = (e.hp || 2) - (s.damage || 1);
        ai.reward(e.context, e.strategy, -1);
        e.stun = 12;
        const impulse = Math.sign(s.vx) * 5;
        if (!collision(e.x + impulse, e.y, e.w, e.h)) e.x += impulse;
        spawnParticles(s.x, s.y, "#c04364", 8);
        if (e.hp <= 0) killEnemy(e, Math.sign(s.vx));
        remove = true;
        break;
      }
    for (const index of world.sealRooms) {
      const x = (index * 20 + 12) * 16 + 8,
        y = 136;
      if (
        !seals.has(index) &&
        Math.abs(s.x - x) < 12 &&
        Math.abs(s.y - y) < 16
      ) {
        seals.add(index);
        modifyTile(8, index * 20 + 12, ".");
        spawnParticles(x, y, world.rooms[index].color, 25);
        remove = true;
        if (seals.size === 3) openGate();
        save();
        updateHUD();
        showDialog(
          `Sello ${seals.size} / 3 restaurado`,
          world.rooms[index].text +
            (seals.size === 3 ? "\n\nEl acceso al Núcleo está abierto." : ""),
          "Continuar",
          "MEMORIA RECUPERADA",
        );
      }
    }
    if (
      !relays.has(13) &&
      timingWindow() &&
      Math.abs(s.x - (13 * 20 + 12) * 16 - 8) < 12 &&
      Math.abs(s.y - 136) < 16
    ) {
      relays.add(13);
      spawnParticles(s.x, 136, "#ffe090", 25);
      remove = true;
      save();
    }
    if (remove) shots.splice(i, 1);
    if (paused) {
      updateChallenges();
      return;
    }
  }
  if (collision(player.x, player.y, 12, 15, "V") && seals.size === 3) {
    gameWon = true;
    completeRoom(14);
    save();
    showDialog(
      story.victory.title,
      story.victory.text,
      "Jugar de nuevo",
      "SECTOR 09 · RESTAURADO",
    );
  }
  if (
    player.grounded &&
    collision(player.x, player.y + 2, 12, 15, "P") &&
    !relays.has(room)
  ) {
    relays.add(room);
    spawnParticles(player.x, player.y + 15, "#a9f1b0", 16);
    save();
    updateHUD();
  }
  updateChallenges();
  const target = Math.max(
    0,
    Math.min(world.columns * 16 - 320, player.x - 154),
  );
  cameraX += (target - cameraX) * 0.13;
  if (Math.abs(target - cameraX) < 0.2) cameraX = target;
  if (time % 12 === 0) updateHUD();
}
function drawBrick(x, y, height = 16) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, 16, height);
  ctx.clip();
  const theme =
    world.rooms[Math.min(world.rooms.length - 1, Math.floor(x / 320))].theme;
  const colors =
    theme === "garden"
      ? ["#1b3535", "#456655", "#102325"]
      : theme === "forge"
        ? ["#402832", "#754744", "#281821"]
        : theme === "ice"
          ? ["#23384b", "#82b9cc", "#132435"]
          : theme === "water"
            ? ["#1a2e43", "#3d586e", "#101c2b"]
            : ["#221a2e", "#3c2d52", "#110a1a"];
  ctx.fillStyle = colors[0];
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = colors[1];
  ctx.fillRect(x, y, 16, 2);
  ctx.fillRect(x, y, 2, 16);
  ctx.fillStyle = colors[2];
  ctx.fillRect(x + 14, y, 2, 16);
  ctx.fillRect(x, y + 14, 16, 2);
  ctx.fillRect(x + 2, y + 8, 12, 2);
  ctx.fillRect(x + 6, y + 2, 2, 6);
  // Juntas desplazadas, bordes biselados y pequeños relieves de superficie.
  ctx.fillStyle = colors[1];
  ctx.fillRect(x + 2, y + 3, 11, 1);
  ctx.fillRect(x + 2, y + 4, 1, 2);
  ctx.fillStyle = colors[2];
  ctx.fillRect(x + 10, y + 10, 3, 1);
  ctx.fillRect(x + 11, y + 11, 1, 2);
  if ((Math.floor(x / 16) + Math.floor(y / 16)) % 3 === 0) {
    ctx.fillStyle = colors[1];
    ctx.fillRect(x + 4, y + 11, 2, 2);
    ctx.fillStyle = colors[2];
    ctx.fillRect(x + 6, y + 12, 2, 2);
  }
  if (theme === "ice") {
    ctx.fillStyle = "#b2d5de";
    ctx.fillRect(x, y, 16, 2);
    ctx.fillRect(x + 2, y + 2, 3, 2);
  }
  if (theme === "garden" && y === 160) {
    ctx.fillStyle = "#72ae78";
    ctx.fillRect(x, y, 16, 2);
  }
  ctx.restore();
}
function drawSpikes(x, y) {
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = "#9ba3a7";
    ctx.beginPath();
    ctx.moveTo(x + i * 8, y + 16);
    ctx.lineTo(x + i * 8 + 4, y + 4);
    ctx.lineTo(x + i * 8 + 8, y + 16);
    ctx.fill();
    ctx.fillStyle = "#545d61";
    ctx.fillRect(x + i * 8 + 4, y + 12, 3, 4);
  }
}
function drawPlayer() {
  if (player.invulnerable > 0 && Math.floor(time / 5) % 2) return;
  ctx.save();
  const walk = Math.abs(player.vx) > 0.1 && player.grounded;
  const bob = walk ? Math.sin(player.frame * 0.55) * 0.75 : 0;
  ctx.translate(Math.round(player.x), Math.round(player.y + bob));
  ctx.rotate(
    (walk ? Math.sin(player.frame * 0.28) * 0.035 : 0) +
      (attackFlash ? -0.035 : 0),
  );

  let walking = Math.abs(player.vx) > 0.1 && player.grounded;
  let animStep = walking ? Math.floor(player.frame / 6) % 2 : 0;

  if (!player.facingRight) {
    ctx.translate(player.width, 0);
    ctx.scale(-1, 1);
  }

  // Efecto estela propulsión de botas
  if (!player.grounded) {
    ctx.fillStyle = player.canDoubleJump ? "#ff6a00" : "#00ffcc";
    ctx.fillRect(2, 14, 3, 3 + Math.random() * 3);
  }

  // Sprite de Armadura Pixel-Art ensamblado por bloques
  ctx.fillStyle = "#515963"; // Piernas
  if (animStep === 0) {
    ctx.fillRect(2, 10, 3, 5);
    ctx.fillRect(7, 10, 3, 5);
  } else {
    ctx.fillRect(1, 9, 3, 5);
    ctx.fillRect(8, 11, 3, 4);
  }

  const suit = [
    ["#d93855", "#ff6b8b", "#00ffcc"],
    ["#377d9f", "#8adcea", "#b3fcff"],
    ["#c18a38", "#ffe094", "#adf7dc"],
    ["#79429b", "#c28de9", "#f0b0ff"],
  ][player.suit];
  ctx.fillStyle = suit[0]; // Botas
  ctx.fillRect(1, 13, 4, 2);
  ctx.fillRect(7, 13, 4, 2);

  ctx.fillStyle = "#2d1b33"; // Torso base
  ctx.fillRect(2, 5, 8, 6);
  ctx.fillStyle = suit[0]; // Pechera
  ctx.fillRect(3, 6, 6, 4);

  ctx.fillStyle = suit[1]; // Hombreras
  ctx.fillRect(1, 5, 2, 3);
  ctx.fillRect(9, 5, 2, 3);

  ctx.fillStyle = "#1e222a"; // Yelmo blindado
  ctx.fillRect(2, 0, 8, 5);
  ctx.fillStyle = suit[2]; // Visor
  ctx.fillRect(6, 1, 4, 2);

  if (player.shield) {
    ctx.strokeStyle = "#91dfff";
    ctx.lineWidth = 1;
    ctx.strokeRect(-2, -2, 16, 19);
  }
  if (player.hasWeapon) {
    // Brazo y cañón; el retroceso desplaza la mano sin alterar el collider.
    ctx.fillStyle = "#717b86";
    ctx.fillRect(8 - (attackFlash ? 1 : 0), 7, 7, 3);
    ctx.fillStyle = "#b3c2cc";
    ctx.fillRect(12 - (attackFlash ? 1 : 0), 7, 3, 1);
    if (attackFlash) {
      ctx.fillStyle = attackFlash > 4 ? "#fff8d7" : "#ffc66a";
      ctx.fillRect(15, 5, 3, 6);
      ctx.fillRect(18, 7, 3, 2);
    }
  }
  ctx.restore();
}

function drawOrb(x, y) {
  let oscillation = Math.sin(time * 0.1) * 3;
  ctx.fillStyle = "rgba(0, 255, 204, 0.15)";
  ctx.beginPath();
  ctx.arc(x + 8, y + 8 + oscillation, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#00ffcc";
  ctx.fillRect(x + 4, y + 4 + oscillation, 8, 8);
  ctx.fillStyle = "#fff";
  ctx.fillRect(x + 6, y + 6 + oscillation, 2, 2);
}

function drawRelic(x, y) {
  let oscillation = Math.sin(time * 0.08) * 4;
  ctx.fillStyle = "#ff00ff";
  ctx.beginPath();
  ctx.moveTo(x + 8, y + oscillation);
  ctx.lineTo(x + 15, y + 7 + oscillation);
  ctx.lineTo(x + 8, y + 14 + oscillation);
  ctx.lineTo(x + 1, y + 7 + oscillation);
  ctx.fill();
  ctx.fillStyle = "#ffff00";
  ctx.fillRect(x + 6, y + 5 + oscillation, 4, 4);
}

function drawBackdrop() {
  const i = roomIndex(),
    theme = world.rooms[i].theme;
  ctx.fillStyle =
    theme === "garden"
      ? "#0c2024"
      : theme === "forge"
        ? "#291322"
        : theme === "water"
          ? "#0b182c"
          : "#0f091c";
  ctx.fillRect(0, 0, 320, 192);
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = ["#22253d", "#2b2d49", "#33334e"][layer];
    const factor = 0.1 + layer * 0.11;
    for (let n = 0; n < 70; n++) {
      const x = n * 69 - 85 - cameraX * factor,
        h = 19 + ((n * 37 + layer * 41) % 68);
      if (x < -55 || x > 375) continue;
      ctx.fillRect(x, 150 - h, 15 + (n % 3) * 5, h);
      ctx.fillStyle = world.rooms[i].color;
      ctx.globalAlpha = 0.08 + layer * 0.035;
      if (n % 3 !== 0) ctx.fillRect(x + 5, 160 - h, 2, 3);
      ctx.globalAlpha = 1;
      ctx.fillStyle = ["#22253d", "#2b2d49", "#33334e"][layer];
      if (n % 5 === 1) ctx.fillRect(x + 7, 143 - h, 2, 13);
      if (n % 7 === 2) ctx.fillRect(x + 13, 156 - h, 28, 2);
    }
  }
  ctx.fillStyle = world.rooms[i].color;
  for (let n = 0; n < 35; n++) {
    let x = (((n * 53 - cameraX * 0.15) % 320) + 320) % 320;
    let y = (n * 37 + Math.sin(time * 0.02 + n) * 3) % 148;
    ctx.globalAlpha = 0.2 + 0.2 * Math.sin(time * 0.025 + n);
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
}
function render() {
  ctx.clearRect(0, 0, 320, 192);
  if (!window.pixelRenderer?.active) drawBackdrop();
  ctx.save();
  ctx.translate(
    -Math.round(cameraX) + Math.sin(time * 2.1) * shake,
    Math.cos(time * 1.7) * shake * 0.4,
  );
  drawEnvironment(minVisibleColumn());
  const min = Math.max(0, Math.floor(cameraX / 16) - 1),
    max = Math.min(world.columns - 1, min + 22);
  for (let r = 0; r < 12; r++)
    for (let c = min; c <= max; c++) {
      const cell = getTile(c, r),
        x = c * 16,
        y = r * 16;
      if (cell === "#") drawBrick(x, y);
      else if (cell === "H") drawRaisedBlock(x, y);
      else if (cell === "X") drawCrate(x, y);
      else if (["z", "B", ">", "<", "h"].includes(cell))
        drawMechanism(cell, x, y);
      else if (cell === "P") drawPlate(x, y);
      else if (["W", "U", "M", "K", "L", "T", "+", "R", "Q"].includes(cell))
        drawPickup(cell, x, y);
      else if (
        ["l", "w", "t", "p", "a", "v", "r", "c", "~", ":", "!", "?"].includes(
          cell,
        )
      )
        drawCityPiece(cell, x, y);
      else if (cell === "^") drawSpikes(x, y);
      else if (cell === "O") drawOrb(x, y);
      else if (cell === "V") drawRelic(x, y);
      else if (cell === "C") {
        ctx.fillStyle = "#253848";
        ctx.fillRect(x + 4, y + 1, 8, 15);
        ctx.fillStyle =
          checkpoint === Math.floor(c / 20) ? "#75f9dd" : "#577b8b";
        ctx.fillRect(x + 6, y + 3, 4, 7);
        ctx.fillRect(x + 2, y + 14, 12, 2);
      } else if (cell === "S") {
        ctx.fillStyle = world.rooms[Math.floor(c / 20)].color;
        ctx.fillRect(x + 3, y + 3, 10, 10);
        ctx.fillStyle = "#122131";
        ctx.fillRect(x + 5, y + 5, 6, 6);
        ctx.fillStyle = "#fff";
        ctx.fillRect(x + 7, y + 7, 2, 2);
      } else if (cell === "G" || cell === "D") {
        ctx.fillStyle = time % 40 < 20 ? "#ee85ac" : "#a3446d";
        ctx.fillRect(x + 5, y, 6, 16);
        ctx.fillStyle = "#ffbacb";
        ctx.fillRect(x + 7, y, 2, 16);
      }
    }
  drawGroundParallax();
  drawRemains();
  for (const e of enemies) if (e.alive) drawEnemy(e);
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size || 2, p.organ ? 2 : p.size || 2);
  }
  for (const bolt of hostileShots) {
    ctx.fillStyle = "#ef7193";
    ctx.fillRect(bolt.x - 2, bolt.y - 2, 5, 4);
    ctx.fillStyle = "#ffe5b1";
    ctx.fillRect(bolt.x, bolt.y - 1, 2, 2);
  }
  for (const s of shots) {
    ctx.fillStyle = "#315c63";
    ctx.fillRect(s.x - Math.sign(s.vx) * 9, s.y, 8, 1);
    ctx.fillStyle = "#75f9dd";
    ctx.fillRect(s.x - 3, s.y - 1, 6, 3);
    ctx.fillStyle = "#fff";
    ctx.fillRect(s.x, s.y, 2, 1);
  }
  drawPlayer();

  ctx.restore();
  drawAirParticles();
  if (window.pixelRenderer?.active)
    window.pixelRenderer.render({
      canvas,
      cameraX,
      playerX: player.x,
      room: roomIndex(),
      theme: world.rooms[roomIndex()].theme,
      time,
    });
}
// Guardias biomecánicos: visión, memoria y navegación sobre superficies transitables.
var navCache = null;
function invalidateNavigation() {
  navCache = null;
}
function lineOfSight(x1, y1, x2, y2) {
  const length = Math.hypot(x2 - x1, y2 - y1),
    steps = Math.ceil(length / 6);
  for (let i = 1; i < steps; i++) {
    const f = i / steps;
    if (collision(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f, 2, 2)) return false;
  }
  return true;
}
function navigationNodes() {
  if (navCache) return navCache;
  const nodes = [];
  for (let r = 1; r < 12; r++)
    for (let c = 1; c < world.columns - 1; c++) {
      const t = getTile(c, r);
      if (!["#", "H", "X"].includes(t)) continue;
      const x = c * 16 + 2,
        y = r * 16 + (t === "H" ? 8 : 0) - 12 - 0.01;
      if (y < 16 || collision(x, y, 12, 12) || collision(x, y, 12, 12, "^"))
        continue;
      nodes.push({ x, y, id: `${c}:${r}`, links: null });
    }
  navCache = nodes;
  return nodes;
}
function jumpEdge(a, b) {
  const dy = b.y - a.y,
    dx = b.x - a.x;
  if (Math.abs(dx) > 68 || dy < -48 || dy > 64) return null;
  const discriminant = 5.87 * 5.87 + 0.52 * dy;
  if (discriminant < 0) return null;
  const frames = (5.87 + Math.sqrt(discriminant)) / 0.26,
    vx = dx / frames;
  if (Math.abs(vx) > 1.6) return null;
  for (let i = 1; i <= 12; i++) {
    const t = (frames * i) / 12,
      x = a.x + vx * t,
      y = a.y - 6 * t + 0.13 * t * (t + 1);
    if (i < 12 && collision(x, y, 12, 12)) return null;
    if (collision(x, y, 12, 12, "^")) return null;
  }
  return { node: b, jump: true, vx };
}
function findEnemyPath(e, targetX, targetY) {
  const nodes = navigationNodes();
  if (!nodes.length) return [];
  const distance = (n, x, y) => Math.abs(n.x - x) + Math.abs(n.y - y) * 1.5;
  const start = nodes.reduce((a, n) =>
    distance(n, e.x, e.y) < distance(a, e.x, e.y) ? n : a,
  );
  const goal = nodes.reduce((a, n) =>
    distance(n, targetX, targetY) < distance(a, targetX, targetY) ? n : a,
  );
  if (start === goal) return [];
  const queue = [start],
    parents = new Map([[start.id, null]]);
  let goalNode = null;
  for (let i = 0; i < queue.length && i < 500; i++) {
    const a = queue[i];
    if (a === goal) {
      goalNode = a;
      break;
    }
    if (!a.links) {
      a.links = [];
      for (const b of nodes) {
        if (b === a || Math.abs(b.x - a.x) > 68 || Math.abs(b.y - a.y) > 64)
          continue;
        if (
          Math.abs(b.x - a.x) <= 16 &&
          b.y - a.y >= -8 &&
          b.y - a.y <= 16 &&
          !collision((a.x + b.x) / 2, Math.min(a.y, b.y), 12, 12)
        )
          a.links.push({ node: b, jump: false });
        else {
          const edge = jumpEdge(a, b);
          if (edge) a.links.push(edge);
        }
      }
    }
    for (const edge of a.links)
      if (!parents.has(edge.node.id)) {
        parents.set(edge.node.id, { from: a, edge });
        queue.push(edge.node);
      }
  }
  if (!goalNode) return [];
  const path = [];
  let n = goalNode;
  while (parents.get(n.id)) {
    const { from, edge } = parents.get(n.id);
    path.push({ x: n.x, y: n.y, jump: edge.jump, vx: edge.vx });
    n = from;
  }
  return path.reverse();
}
function updateEnemy(e) {
  e.vy = e.vy || 0;
  e.jumpCD = Math.max(0, (e.jumpCD || 0) - 1);
  e.pathTimer = Math.max(0, (e.pathTimer || 0) - 1);
  e.stun = Math.max(0, (e.stun || 0) - 1);
  const stats = enemyStats();
  e.decisionTimer = Math.max(0, (e.decisionTimer || 0) - 1);
  const sees =
    Math.abs(player.x - e.x) < stats.vision &&
    lineOfSight(e.x + 6, e.y + 4, player.x + 6, player.y + 5);
  if (sees && e.decisionTimer === 0) {
    if (e.context !== undefined) {
      const closing = (e.decisionDistance - Math.abs(player.x - e.x)) / 80;
      ai.reward(e.context, e.strategy, Math.max(-0.4, Math.min(0.5, closing)));
    }
    e.context = !player.grounded ? 1 : Math.abs(player.x - e.x) < 96 ? 2 : 0;
    e.strategy = ai.choose(e.context);
    e.decisionTimer = 45;
    e.decisionDistance = Math.abs(player.x - e.x);
  }
  if (sees) {
    e.alert = 180;
    const predicted = e.strategy === 1 ? player.vx * 12 : 0;
    e.targetX = player.x + predicted;
    e.targetY = player.y;
    e.mode = "chase";
  } else if (e.alert > 0) {
    e.alert--;
    e.mode = "search";
  } else {
    e.mode = "patrol";
    e.path = [];
  }
  if (e.type === "F") {
    e.dir = player.x >= e.x ? 1 : -1;
    e.fireCD = Math.max(0, e.fireCD - 1);
    if (sees && Math.abs(player.x - e.x) < 210 && e.fireCD === 0) {
      hostileShots.push({
        x: e.x + 6 + e.dir * 9,
        y: e.y + 5,
        vx: e.dir * (2.25 + completed.size * 0.02),
        vy: Math.max(-1.15, Math.min(1.15, (player.y - e.y) * 0.018)),
        life: 98,
        context: e.context,
        strategy: e.strategy,
      });
      e.fireCD = Math.max(46, 98 - completed.size * 3);
      spawnParticles(e.x + 6 + e.dir * 9, e.y + 5, "#ffaabb", 4);
    }
    if (overlaps({ x: player.x, y: player.y, w: 12, h: 15 }, e))
      damagePlayer(e);
    return;
  }
  if (e.type === "f") {
    const patrolY = e.baseY + Math.sin(time * 0.07 + e.id) * 11;
    const dx =
      e.alert > 0
        ? Math.sign(e.targetX - e.x) * 1.05 * stats.speed
        : Math.sin(time * 0.025 + e.id) * 0.7;
    const dy =
      e.alert > 0
        ? Math.sign(e.targetY - e.y) * 0.65
        : Math.sign(patrolY - e.y) * 0.55;
    if (
      !collision(e.x + dx, e.y, e.w, e.h) &&
      e.x + dx > e.room * 320 + 16 &&
      e.x + dx < (e.room + 1) * 320 - 26
    )
      e.x += dx;
    if (!collision(e.x, e.y + dy, e.w, e.h)) e.y += dy;
    e.dir = dx >= 0 ? 1 : -1;
    if (overlaps({ x: player.x, y: player.y, w: 12, h: 15 }, e))
      damagePlayer(e);
    return;
  }
  if (e.alert > 0 && e.pathTimer === 0 && e.grounded) {
    e.path = findEnemyPath(e, e.targetX, e.targetY);
    e.pathTimer = 35;
  }
  let dx = 0;
  if (!e.stun) {
    if (e.alert > 0) {
      let point = e.path?.[0];
      if (point && Math.abs(point.x - e.x) < 5 && Math.abs(point.y - e.y) < 6) {
        e.path.shift();
        point = e.path[0];
      }
      const target = point ? point.x : e.targetX;
      e.dir = Math.sign(target - e.x) || e.dir;
      if (e.grounded && point?.jump && e.jumpCD === 0) {
        e.vy = -6;
        e.grounded = false;
        e.jumpVX = point.vx;
        e.jumpCD = 42;
      }
      dx =
        !e.grounded && e.jumpVX !== undefined
          ? e.jumpVX
          : e.dir *
            (e.mode === "chase" ? 1.2 : 0.8) *
            stats.speed *
            (e.type === "e" ? 1.48 : e.type === "b" ? 0.72 : 1);
      if (!point && Math.abs(target - e.x) < 6) dx = 0;
    } else {
      if (Math.abs(e.x - e.base) > 34) e.dir = e.x > e.base ? -1 : 1;
      dx = e.dir * (e.type === "e" ? 0.68 : e.type === "b" ? 0.3 : 0.45);
    }
    const threat = shots.find(
      (s) =>
        Math.abs(s.y - (e.y + 6)) < 14 &&
        Math.abs(s.x - e.x) < 70 &&
        Math.sign(s.vx) === Math.sign(e.x - s.x),
    );
    if (
      e.strategy === 2 &&
      threat &&
      e.grounded &&
      e.jumpCD === 0 &&
      !collision(e.x, e.y - 32, e.w, e.h)
    ) {
      e.vy = -5.2;
      e.jumpVX = -Math.sign(threat.vx) * 0.9;
      e.jumpCD = 55;
      dx = e.jumpVX;
    }
    if (e.grounded) {
      const ahead = e.x + (dx > 0 ? 16 : -7);
      if (
        collision(ahead, e.y + e.h, 5, 5, "^") ||
        !collision(
          ahead,
          e.y + e.h + 1,
          5,
          e.path?.[0] && !e.path[0].jump && e.path[0].y > e.y + 4 ? 32 : 8,
        )
      ) {
        if (!e.path?.[0]?.jump) {
          dx = 0;
          if (e.mode === "patrol") e.dir *= -1;
        }
      }
      if (
        e.alert > 0 &&
        e.jumpCD === 0 &&
        collision(e.x + Math.sign(dx) * 14, e.y, e.w, e.h) &&
        !collision(e.x, e.y - 28, e.w, e.h)
      ) {
        e.vy = -6;
        e.jumpVX = e.dir * 1.15;
        e.jumpCD = 42;
      }
    }
  }
  e.vy = Math.min(e.vy + GRAVITY, 6);
  moveBody(e, dx, e.vy);
  if (e.grounded) e.jumpVX = undefined;
  if (e.blocked) {
    e.pathTimer = 0;
    if (e.mode === "patrol") e.dir *= -1;
  }
  if (collision(e.x, e.y, e.w, e.h, "^")) {
    e.x = e.base;
    e.y = e.baseY;
    e.vy = 0;
    e.path = [];
    e.jumpVX = undefined;
  }
  if (overlaps({ x: player.x, y: player.y, w: 12, h: 15 }, e)) {
    damagePlayer(e);
  }
}
function seedBlood(c) {
  for (let i = 0; i < 7; i++)
    stains.push({
      x: c.x + ((i * 7 + c.id) % 19) - 4,
      y: Math.min(159, c.y + 4 + (i % 2)),
      w: 2 + (i % 3),
      h: 1,
      color: i % 3 === 0 ? "#be526d" : "#711f3a",
    });
}
function killEnemy(e, direction) {
  if (!e.alive) return;
  e.alive = false;
  ai.reward(e.context, e.strategy, -3);
  ai.save();
  shake = Math.max(shake, 2.5);
  const body = {
    id: e.id ?? Math.floor(e.base / 16),
    x: e.x,
    y: e.y + e.h - 5,
    w: 12,
    h: 5,
    vy: 0,
    dir: e.dir || 1,
    settled: false,
  };
  corpses.push(body);
  seedBlood(body);
  for (let i = 0; i < 24; i++)
    particles.push({
      x: e.x + 6,
      y: e.y + 5,
      vx: direction * (0.4 + Math.random() * 2.1) + (Math.random() - 0.5) * 2,
      vy: -0.5 - Math.random() * 3,
      gravity: 0.16,
      life: 80 + Math.random() * 35,
      color: i % 4 === 0 ? "#ea7a94" : "#a32d51",
      size: i < 4 ? 3 : 1 + (i % 2),
      gore: true,
      organ: i < 4,
    });
  updateChallenges();
  save();
}
function updateRemains() {
  for (const c of corpses) {
    if (c.settled && collision(c.x, c.y + 1, c.w, c.h)) continue;
    c.vy = Math.min((c.vy || 0) + 0.2, 5);
    moveBody(c, 0, c.vy, false);
    if (c.grounded && !c.settled) {
      c.settled = true;
      save();
    }
  }
  if (stains.length > 160) stains.splice(0, stains.length - 160);
}
function timingWindow() {
  return time % 180 < 85;
}
function updateChallenges() {
  for (const room of world.gateRooms) {
    if (roomReady(room) && !openedDoors.has(room)) {
      openedDoors.add(room);
      for (let r = 1; r < 10; r++) modifyTile(r, room * 20 + 19, ".");
      completeRoom(room);
      spawnParticles(
        (room * 20 + 19) * 16 + 8,
        90,
        world.rooms[room].color,
        12,
      );
    }
  }
}
function minVisibleColumn() {
  return Math.max(0, Math.floor(cameraX / 16) - 1);
}
function drawRaisedBlock(x, y) {
  drawBrick(x, y + 8, 8);
  ctx.fillStyle = "#a2aab1";
  ctx.fillRect(x + 1, y + 8, 14, 1);
  ctx.fillStyle = "#0b1421";
  ctx.fillRect(x + 2, y + 14, 12, 2);
}
function drawCrate(x, y) {
  ctx.fillStyle = "#634a43";
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = "#c7ab84";
  ctx.fillRect(x, y, 16, 2);
  ctx.fillRect(x, y, 2, 16);
  ctx.fillStyle = "#292337";
  ctx.fillRect(x + 3, y + 3, 10, 10);
  ctx.fillStyle = "#8c745d";
  for (let i = 0; i < 10; i++) ctx.fillRect(x + 3 + i, y + 3 + i, 2, 2);
}
function drawPlate(x, y) {
  ctx.fillStyle = relays.has(Math.floor(x / 320)) ? "#98efb1" : "#547668";
  ctx.fillRect(x + 1, y + 13, 14, 3);
  ctx.fillStyle = "#d4ffe4";
  ctx.fillRect(x + 4, y + 12, 8, 1);
}
function drawGroundParallax() {
  // La banda profunda se desplaza ligeramente; los apoyos y su colisión siguen anclados.
  const start = cameraX - 20,
    end = cameraX + 340,
    phase = (cameraX + player.x * 0.35) * 0.12;
  ctx.fillStyle =
    world.rooms[roomIndex()].theme === "forge" ? "#2c1d25" : "#111d2b";
  ctx.fillRect(start, 177, end - start, 15);
  for (
    let x = Math.floor((start + phase) / 28) * 28 - phase;
    x < end;
    x += 28
  ) {
    ctx.fillStyle = "#334053";
    ctx.fillRect(x, 178, 22, 2);
    ctx.fillStyle = "#080e19";
    ctx.fillRect(x + 3, 182, 18, 1);
    ctx.fillStyle = "#27334a";
    ctx.fillRect(x + 10, 185, 11, 3);
  }
}
function drawMechanism(tile, x, y) {
  if (tile === "z") {
    ctx.fillStyle = "#36758e";
    ctx.fillRect(x, y, 16, 16);
    ctx.fillStyle = "#b3ecf1";
    ctx.fillRect(x + 1, y + 1, 14, 2);
    ctx.fillRect(x + 2, y + 3, 2, 12);
    ctx.fillRect(x + 9, y + 7, 2, 8);
  } else if (tile === "B") {
    ctx.fillStyle = "#794e40";
    ctx.fillRect(x + 1, y + 12, 14, 4);
    ctx.fillStyle = "#f4bf73";
    ctx.fillRect(x + 4, y + 8, 8, 3);
    ctx.fillRect(x + 6, y + 5, 4, 3);
  } else if (tile === ">" || tile === "<") {
    ctx.fillStyle = "#304a60";
    ctx.fillRect(x, y + 12, 16, 4);
    ctx.fillStyle = "#9acbdb";
    const off = time % 16;
    for (let n = 0; n < 3; n++) {
      const step = ((n * 6 + off / 4) % 18) - 2;
      ctx.fillRect(x + (tile === ">" ? step : 16 - step), y + 10, 3, 2);
    }
  } else if (tile === "h") {
    ctx.fillStyle = "#65495a";
    ctx.fillRect(x + 2, y + 12, 12, 4);
    if (time % 120 < 50) {
      ctx.fillStyle = "#e8a8a0";
      for (let i = 0; i < 3; i++)
        ctx.fillRect(x + 3 + i * 5, y + 2 + ((time + i * 7) % 11), 2, 5);
    }
  }
}
function drawCityPiece(tile, x, y) {
  const sway = Math.sin(time * 0.04 + x) * 2;
  if (tile === "l") {
    ctx.fillStyle = "#47596b";
    ctx.fillRect(x + 7, y + 3, 2, 13);
    ctx.fillStyle = "#f2daa3";
    ctx.fillRect(x + 4, y + 1, 8, 3);
    ctx.fillStyle = "rgba(242,218,163,.12)";
    ctx.fillRect(x, y + 3, 16, 12);
  } else if (tile === "w") {
    ctx.fillStyle = "#344c61";
    ctx.fillRect(x + 1, y, 14, 14);
    ctx.fillStyle = "#8ccedb";
    ctx.fillRect(x + 3, y + 2, 4, 4);
    ctx.fillRect(x + 9, y + 2, 4, 4);
    ctx.fillRect(x + 3, y + 8, 10, 3);
  } else if (tile === "t") {
    ctx.fillStyle = "#4f5e5f";
    ctx.fillRect(x + 7, y + 7, 3, 9);
    ctx.fillStyle = "#64ad86";
    ctx.fillRect(x + 3 + sway / 2, y + 2, 11, 8);
    ctx.fillStyle = "#9be0a3";
    ctx.fillRect(x + 6 + sway / 2, y + 1, 4, 3);
  } else if (tile === "p") {
    ctx.fillStyle = "#596b79";
    ctx.fillRect(x + 2, y + 7, 14, 3);
    ctx.fillRect(x + 3, y + 1, 3, 13);
    ctx.fillStyle = "#9db5bd";
    ctx.fillRect(x + 7, y + 7, 4, 1);
  } else if (tile === "a") {
    ctx.fillStyle = "#51617a";
    ctx.fillRect(x + 1, y + 4, 3, 12);
    ctx.fillRect(x + 12, y + 4, 3, 12);
    ctx.fillRect(x + 3, y + 2, 10, 3);
  } else if (tile === "v") {
    ctx.fillStyle = "#3d4d5b";
    ctx.fillRect(x + 1, y + 1, 14, 14);
    ctx.fillStyle = "#9ab7c4";
    ctx.fillRect(x + 6, y + 3, 4, 10);
    ctx.fillRect(x + 3, y + 6, 10, 4);
    ctx.fillStyle = "#16222e";
    ctx.fillRect(x + 7, y + 7, 2, 2);
  } else if (tile === "r") {
    ctx.fillStyle = "#556276";
    ctx.fillRect(x + 2, y + 11, 6, 4);
    ctx.fillRect(x + 9, y + 13, 6, 2);
    ctx.fillStyle = "#8894a1";
    ctx.fillRect(x + 3, y + 9, 3, 2);
  } else if (tile === "c") {
    ctx.fillStyle = "#75bbd2";
    ctx.fillRect(x + 5, y + 3, 6, 12);
    ctx.fillStyle = "#d5f4f7";
    ctx.fillRect(x + 8, y + 1, 2, 8);
    ctx.fillRect(x + 2, y + 10, 3, 5);
  } else if (tile === "~") {
    ctx.fillStyle = "#234f68";
    ctx.globalAlpha = 0.6;
    ctx.fillRect(x, y + 7, 16, 9);
    ctx.fillStyle = "#88d5e8";
    ctx.fillRect(x + (time % 8), y + 8, 7, 1);
    ctx.globalAlpha = 1;
  } else if (tile === ":") {
    ctx.fillStyle = "#738497";
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 7, y + i * 4, 2, 3);
  } else if (tile === "!") {
    ctx.fillStyle = time % 20 < 10 ? "#ffbc75" : "#775a50";
    ctx.fillRect(x + 7 + sway, y + 7, 2, 3);
    ctx.fillRect(x + 4, y + 12, 2, 2);
  } else if (tile === "?") {
    ctx.fillStyle = "#314b58";
    ctx.fillRect(x + 1, y + 2, 14, 13);
    ctx.fillStyle = time % 60 < 45 ? "#7ce6b4" : "#557e73";
    ctx.fillRect(x + 3, y + 4, 10, 5);
    ctx.fillStyle = "#abd7cf";
    ctx.fillRect(x + 4, y + 12, 6, 1);
  }
}
function drawEnvironment(min) {
  const end = Math.min(world.columns - 1, min + 23);
  for (let c = min; c <= end; c++) {
    const x = c * 16,
      room = Math.floor(c / 20),
      theme = world.rooms[room].theme;
    if (c % 5 === 1) {
      const sway = Math.sin(time * 0.035 + c);
      ctx.fillStyle = "#22293b";
      ctx.fillRect(x + 6, 17, 1, 9);
      ctx.fillStyle = time % 90 < 75 ? world.rooms[room].color : "#53647c";
      ctx.fillRect(x + 3 + sway, 26, 7, 2);
      ctx.globalAlpha = 0.08;
      ctx.fillRect(x, 24, 14, 16);
      ctx.globalAlpha = 1;
    }
    if (c % 7 === 2) {
      ctx.fillStyle = "#25283a";
      ctx.fillRect(x + 1, 84, 9, 13);
      ctx.fillStyle = "#576276";
      ctx.fillRect(x + 2, 85, 7, 1);
    }
    if (theme === "water" && c % 6 === 0) {
      ctx.fillStyle = "#427594";
      ctx.globalAlpha = 0.3;
      for (let k = 0; k < 9; k++)
        ctx.fillRect(x + 8, 38 + ((k * 15 + time * 0.6) % 115), 1, 6);
      ctx.globalAlpha = 1;
    }
    if (getTile(c, 10) === "#" && getTile(c, 9) === "." && c % 4 === 0) {
      ctx.fillStyle = theme === "garden" ? "#5e9e74" : "#3e485d";
      const sway = Math.sin(time * 0.05 + c);
      ctx.fillRect(x + 6, 155, 1, 5);
      ctx.fillRect(x + 7 + sway, 153, 4, 2);
      ctx.fillRect(x + 3, 156, 3, 1);
    }
    if (theme === "forge" && c % 3 === 0) {
      ctx.fillStyle = "#bb6b48";
      ctx.globalAlpha = 0.5;
      ctx.fillRect(
        x + ((time * 0.12 + c) % 10),
        155 - ((time * 0.35 + c) % 65),
        1,
        1,
      );
      ctx.globalAlpha = 1;
    }
  }
}
function drawRemains() {
  for (const p of stains) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }
  for (const c of corpses) {
    ctx.fillStyle = "#541e32";
    ctx.fillRect(c.x - 2, c.y + 4, 17, 1);
    ctx.fillStyle = "#983951";
    ctx.fillRect(c.x, c.y + 1, 9, 4);
    ctx.fillStyle = "#dc718a";
    ctx.fillRect(c.x + 3, c.y + 1, 3, 2);
    ctx.fillStyle = "#333d4b";
    ctx.fillRect(c.x + 9, c.y + 2, 5, 3);
    ctx.fillStyle = "#b77583";
    ctx.fillRect(c.x - 1, c.y + 2, 3, 2);
  }
}
function drawEnemy(e) {
  const walking = e.grounded && e.mode !== "search",
    bob = walking ? Math.sin(time * 0.3 + e.id) * 0.5 : 0;
  const x = Math.round(e.x),
    y = Math.round(e.y + bob);
  const skins = {
    E: ["#6a314b", "#ce6889"],
    e: ["#a3543a", "#f3a56a"],
    b: ["#713447", "#d47287"],
    F: ["#5a4c86", "#b4a4f8"],
    f: ["#32657d", "#85d9ec"],
  };
  const skin = skins[e.type] || skins.E;
  if (e.type === "f") {
    ctx.fillStyle = skin[1];
    ctx.fillRect(x - 2, y + 4, 4, 2);
    ctx.fillRect(x + 10, y + 4, 4, 2);
  }
  if (e.type === "b") {
    ctx.fillStyle = "#3e263d";
    ctx.fillRect(x, y + 3, 12, 8);
  }
  if (e.type === "F") {
    ctx.fillStyle = "#3b355c";
    ctx.fillRect(x + 1, y + 8, 10, 4);
    ctx.fillRect(x + (e.dir > 0 ? 8 : -2), y + 5, 6, 2);
  }
  ctx.fillStyle = e.stun ? "#f7e7d6" : skin[0];
  ctx.fillRect(x + 2, y + 4, 8, 6);
  ctx.fillStyle = skin[1];
  ctx.fillRect(x + 3, y + 2, 6, 4);
  ctx.fillStyle = "#263440";
  ctx.fillRect(x + 3, y, 6, 3);
  ctx.fillStyle = e.alert > 0 ? "#ffe09a" : "#9ee4d7";
  ctx.fillRect(x + (e.dir > 0 ? 7 : 3), y + 2, 2, 1);
  ctx.fillStyle = "#424557";
  const gait = Math.floor(time / 7) % 2;
  if (e.type !== "f") {
    ctx.fillRect(x + 2, y + 9, gait ? 2 : 3, 3);
    ctx.fillRect(x + 7, y + 8, gait ? 3 : 2, 4);
  }
  ctx.fillStyle = "#a64e6c";
  ctx.fillRect(x + (e.dir > 0 ? 9 : 0), y + 5, 3, 4);
  if (e.alert > 0) {
    ctx.fillStyle = e.mode === "chase" ? "#f4b767" : "#aebad0";
    ctx.fillRect(x + 5, y - 5, 2, 2);
    ctx.fillRect(x + 5, y - 2, 2, 1);
  }
  ctx.fillStyle = "#351b2d";
  ctx.fillRect(x, y - 8, 12, 2);
  ctx.fillStyle = "#e589a4";
  ctx.fillRect(x, y - 8, (12 * Math.max(0, e.hp)) / e.maxHP, 2);
}

function drawPickup(type, x, y) {
  const bob = Math.round(Math.sin(time * 0.045 + x) * 2);
  const colors = {
    "+": "#89e9aa",
    R: "#86d6ff",
    Q: "#ffb877",
    W: "#ffd68c",
    U: "#ffbb79",
    M: "#bfffd3",
    K: "#bcecff",
    L: "#8dd5ff",
    T: relays.has(13) ? "#75f9dd" : timingWindow() ? "#ffe090" : "#574838",
  };
  ctx.fillStyle = "#182538";
  ctx.fillRect(x + 2, y + 2, 12, 14);
  ctx.fillStyle = colors[type];
  if (type === "W") {
    ctx.fillRect(x + 3, y + 5 + bob, 10, 3);
    ctx.fillRect(x + 4, y + 8 + bob, 3, 4);
  } else if (type === "M") {
    ctx.fillRect(x + 6, y + 4, 4, 10);
    ctx.fillRect(x + 3, y + 7, 10, 4);
  } else if (type === "K") {
    ctx.fillRect(x + 3, y + 3 + bob, 5, 5);
    ctx.fillRect(x + 6, y + 7 + bob, 2, 6);
    ctx.fillRect(x + 8, y + 10 + bob, 3, 2);
  } else if (type === "L") {
    ctx.fillRect(x + 4, y + 5, 8, 7);
    ctx.fillStyle = relays.has(11) ? "#75f9dd" : "#0e1a2a";
    ctx.fillRect(x + 6, y + 6, 4, 5);
  } else {
    ctx.fillRect(x + 4, y + 4 + bob, 8, 8);
    ctx.fillStyle = "#132232";
    ctx.fillRect(x + 6, y + 6 + bob, 4, 4);
  }
}
// Profundidad perspectiva: partículas cercanas, grandes y desenfocadas; lejanas nítidas.
const airLayers = [0.15, 0.32, 0.55, 0.82, 1];
const airTextures = airLayers.map((depth) => {
  const c = document.createElement("canvas");
  c.width = c.height = 48;
  const g = c.getContext("2d"),
    soft = depth > 0.55;
  const gradient = g.createRadialGradient(
    24,
    24,
    soft ? 0 : 5,
    24,
    24,
    soft ? 21 : 7,
  );
  gradient.addColorStop(0, "rgba(225,247,255,.8)");
  gradient.addColorStop(soft ? 0.2 : 0.72, "rgba(198,233,255,.42)");
  gradient.addColorStop(1, "rgba(170,215,255,0)");
  g.fillStyle = gradient;
  g.fillRect(0, 0, 48, 48);
  return c;
});
const air = Array.from({ length: 45 }, (_, i) => ({
  depth: airLayers[i % 5],
  layer: i % 5,
  x: (i * 73) % 320,
  y: (i * 41) % 192,
  phase: i * 1.7,
}));
function drawAirParticles() {
  const slow = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  ctx.save();
  for (const p of air) {
    const drift = slow ? 0 : time;
    const x =
      ((((p.x +
        Math.sin(drift * 0.005 + p.phase) * 14 +
        drift * 0.045 * p.depth -
        cameraX * 0.12 * p.depth) %
        360) +
        360) %
        360) -
      20;
    const y =
      ((((p.y -
        drift * 0.023 * p.depth +
        Math.cos(drift * 0.009 + p.phase) * 8) %
        216) +
        216) %
        216) -
      12;
    const size = 1.2 + p.depth * p.depth * 13;
    ctx.globalAlpha = p.depth > 0.55 ? 0.2 : 0.55;
    ctx.drawImage(airTextures[p.layer], x - size / 2, y - size / 2, size, size);
  }
  ctx.restore();
}

function masterLoop(now) {
  if (!lastTime) lastTime = now;
  accumulator += Math.min(now - lastTime, 100);
  lastTime = now;
  if (!paused) {
    while (accumulator >= 1000 / 60) {
      update();
      accumulator -= 1000 / 60;
      if (paused) break;
    }
  } else accumulator = 0;
  if (paused && dialogChars < dialogText.length) {
    dialogClock += Math.min(now - (window.lastDialogFrame || now), 100);
    if (dialogClock >= 20) {
      dialogChars = Math.min(
        dialogText.length,
        dialogChars + Math.floor(dialogClock / 20),
      );
      dialogClock %= 20;
      $("dialog-text").textContent =
        dialogText.slice(0, dialogChars) +
        (dialogChars < dialogText.length ? " ▓" : "");
    }
  }
  window.lastDialogFrame = now;
  render();
  requestAnimationFrame(masterLoop);
}
if (customScenes)
  LEVEL = sceneStore.compose(world.generate(seed), customScenes);
rebuildEntities();
showDialog(
  story.intro.title,
  story.intro.text,
  saved ? "Continuar misión" : "Iniciar misión",
);
$("btn-new").hidden = !saved;
if (previewRoom !== null) {
  ai.choose = () => 0;
  ai.reward = () => {};
  ai.save = () => {};
  $("btn-reset").hidden = true;
  startGame(false);
  player.hasDoubleJump = true;
  player.hasWeapon = true;
  player.x = previewRoom * 320 + 34;
  player.y = 145;
  setCheckpoint(previewRoom);
  previousRoom = previewRoom;
  cameraX = Math.max(0, Math.min(world.columns * 16 - 320, player.x - 154));
  visited.add(previewRoom);
  spoken.add(previewRoom);
  if (previewRoom === 11) keyring.add(10);
  if (previewRoom === 14) {
    seals = new Set(world.sealRooms);
    openGate();
  }
  updateChallenges();
}
updateHUD();
requestAnimationFrame(masterLoop);
if (location.protocol !== "file:")
  fetch("story.json")
    .then((r) => {
      if (!r.ok) throw new Error("story.json");
      return r.json();
    })
    .then((data) => {
      for (const k of ["intro", "item_pickup", "victory"])
        if (
          typeof data[k]?.title === "string" &&
          typeof data[k]?.text === "string"
        )
          Object.assign(story[k], data[k]);
      if (Array.isArray(data.rooms) && data.rooms.length === world.rooms.length)
        data.rooms.forEach((r, i) => {
          if (typeof r.name === "string" && typeof r.text === "string")
            Object.assign(world.rooms[i], { name: r.name, text: r.text });
        });
      if (customScenes) sceneStore.applyMetadata(world.rooms, customScenes);
      updateHUD();
      if (!started) {
        $("dialog-title").textContent = story.intro.title;
        dialogText = story.intro.text;
        dialogChars = 0;
        dialogClock = 0;
      }
    })
    .catch(() => {});
