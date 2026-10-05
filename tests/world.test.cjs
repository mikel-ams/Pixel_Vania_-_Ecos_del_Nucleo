const assert = require("node:assert/strict");
global.window = {};
require("../src/world.js");
const { generate, rooms, sealRooms, gateRooms } = window.PixelWorld;
for (let seed = 1; seed <= 200; seed++) {
  const map = generate(seed);
  assert.equal(map.length, 12);
  assert(map.every((r) => r.length === 300));
  assert.equal(rooms.length, 15);
  assert.deepEqual(map, generate(seed));
  for (const tile of ["O", "W", "U", "M", "K", "V", "L", "T", "P"])
    assert.equal(map.join("").split(tile).length - 1, 1, tile);
  assert.equal(map.join("").split("S").length - 1, 3);
  assert.equal(map.join("").split("D").length - 1, gateRooms.length * 9);
  for (let room = 0; room < 15; room++) {
    const x = room * 20 + 2;
    assert.equal(map[9][x], "C");
    assert.equal(map[10][x], "#");
    const enemies = map.some((row) =>
      row.slice(room * 20, (room + 1) * 20).includes("E"),
    );
    if (room <= 4) assert(!enemies, "sin enemigos antes de recoger el arma");
  }
  for (const room of sealRooms) {
    assert.equal(map[8][room * 20 + 12], "S");
    assert.equal(map[9][room * 20 + 12], "#");
  }
}
console.log(
  "OK: 200 semillas · 15 escenas · armería segura · objetos únicos · faros y sellos",
);
