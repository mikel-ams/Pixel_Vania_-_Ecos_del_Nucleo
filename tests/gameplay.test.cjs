const assert = require("node:assert/strict"),
  engine = require("./harness.cjs");
const e = engine(),
  { run, elements, sandbox } = e;
run(
  `startGame(false);spoken=new Set(world.rooms.map((_,i)=>i));for(let i=0;i<10;i++)update();const x=player.x;keys.ArrowRight=true;for(let i=0;i<8;i++)update();assert(player.x>x);clearInputs();jumpTrigger();update();assert(player.vy<0);assert(!player.hasWeapon);pulse();assert.equal(shots.length,0);assert(enemies.every(e=>e.room>=5));`,
);
const event = (id) => ({ pointerId: id, preventDefault() {} });
elements["btn-right"].events.pointerdown(event(1));
elements["btn-jump"].events.pointerdown(event(2));
run("assert(keys.ArrowRight&&keys.Space);");
elements["btn-jump"].events.pointerup(event(2));
elements["btn-right"].events.pointercancel(event(1));
run("assert(!keys.ArrowRight&&!keys.Space);");
let prevented = false;
elements["mobile-controls"].events.contextmenu({
  preventDefault() {
    prevented = true;
  },
});
assert(prevented);
// Arma, mejora, recarga de un solo uso, llave y cerrojo.
run(
  `startGame(false);player.x=91*16;player.y=145;assert(processPickups());assert(player.hasWeapon);assert(paused);assert.equal(getTile(91,9),'.');advanceDialog();assert(!paused);pulse();assert.equal(shots.length,1);assert(player.kick<0);cooldown=0;shots=[];player.x=112*16;player.y=129;assert(processPickups());assert.equal(player.power,2);advanceDialog();pulse();assert.equal(shots[0].damage,2);player.hp=2;player.x=171*16;player.y=145;assert(processPickups());assert.equal(player.hp,5);assert.equal(getTile(171,9),'.');advanceDialog();player.hp=3;assert(!processPickups());assert.equal(player.hp,3);player.x=212*16;player.y=81;assert(processPickups());assert(keyring.has(10));advanceDialog();player.x=237*16;player.y=145;processPickups();assert(relays.has(11));`,
);
// Vida e invulnerabilidad: un contacto no consume varias unidades; quinto daño vuelve al faro.
run(
  `startGame(false);player.invulnerable=0;damagePlayer();assert.equal(player.hp,4);damagePlayer();assert.equal(player.hp,4);for(let i=0;i<4;i++){player.invulnerable=0;damagePlayer();}assert.equal(player.hp,0);assert.equal(deaths,1);assert(gameOver&&paused);assert.equal(player.x,player.respawnX);advanceDialog();assert.equal(player.hp,5);assert(!gameOver&&!paused);`,
);
// Escalones, pinchos y faro: daño sin perder mejoras.
run(
  `startGame(false);enemies=[];spoken=new Set(world.rooms.map((_,i)=>i));player.x=64;player.y=144.99;player.grounded=true;keys.ArrowRight=true;for(let i=0;i<12;i++)update();assert(player.x>80);assert(Math.abs(player.y-136.99)<.1);clearInputs();player.invulnerable=0;player.x=176;player.y=145;update();assert.equal(player.hp,4);assert.equal(deaths,0);assert.equal(player.x,player.respawnX);`,
);
// El custodio navega con saltos sobre el terreno real y alcanza al jugador sin atravesarlo.
run(
  `startGame(false);player.x=2500;player.y=144.99;player.invulnerable=0;const e=enemies.find(e=>e.room===7);e.x=2306;e.y=139.99;e.base=2306;e.grounded=true;e.alert=180;e.targetX=2500;e.targetY=145;e.pathTimer=0;e.strategy=0;e.decisionTimer=999;let jumped=false;const hp=player.hp;for(let i=0;i<420&&player.hp===hp;i++){updateEnemy(e);if(e.y<125)jumped=true;}assert(jumped);assert(player.hp<hp);`,
);
// La estación conserva la carga cuando ya tienes las cinco vidas.
run(
  `startGame(false);player.x=171*16;player.y=145;assert(!processPickups());assert.equal(getTile(171,9),'M');assert(!collected.has(8));`,
);
// Puertas y dificultad: completar objetivos sube estadísticas; volver a abrir no permite farmear.
run(
  `startGame(false);const hp=enemyStats().hp;assert(collision(99*16,40,12,15));updateChallenges();assert(!openedDoors.has(4));player.hasWeapon=true;collected.add(4);updateChallenges();assert(openedDoors.has(4));const n=completed.size;updateChallenges();assert.equal(completed.size,n);for(const room of [0,1,2,3])completeRoom(room);assert(enemyStats().hp>hp);assert(enemyStats().speed>1);seals.add(6);updateChallenges();assert(!openedDoors.has(6));killEnemy(enemies.find(e=>e.room===6),1);assert(openedDoors.has(6));killEnemy(enemies.find(e=>e.room===7),1);assert(!openedDoors.has(7));relays.add(7);updateChallenges();assert(openedDoors.has(7));`,
);
// Combate, órganos, cadáver persistente y memoria visual. Desactivar exploración aleatoria para esta fixture.
run(
  `startGame(false);spoken=new Set(world.rooms.map((_,i)=>i));player.hasWeapon=true;player.power=2;player.x=1826;player.y=144.99;player.grounded=true;player.facingRight=true;const guard=enemies.find(e=>e.room===5);guard.x=1852;guard.base=1852;guard.strategy=0;guard.decisionTimer=999;const x=guard.x;for(let i=0;i<12;i++)update();assert(guard.x<x);assert.equal(guard.mode,'chase');pulse();for(let i=0;i<35;i++)update();assert(!guard.alive);assert.equal(corpses.length,1);assert(stains.length>0);assert(particles.some(p=>p.gore&&p.organ));const bx=corpses[0].x;respawn(false);assert(!guard.alive);assert.equal(corpses[0].x,bx);`,
);
// Receptor de latidos: pulso fuera de ventana no abre; ventana iluminada sí.
run(
  `startGame(false);spoken=new Set(world.rooms.map((_,i)=>i));enemies=[];player.hasWeapon=true;player.x=13*320+170;player.y=129;player.vy=0;time=110;shots=[{x:4356,y:136,vx:4,life:10,damage:1}];update();assert(!relays.has(13));time=0;shots=[{x:4356,y:136,vx:4,life:10,damage:1}];update();assert(relays.has(13));assert(openedDoors.has(13));`,
);
// Aprendizaje persistente y selección aprendida: premiar una estrategia cambia la siguiente decisión.
run(
  `ai.reset();for(let i=0;i<20;i++)ai.reward(1,1,2);assert.equal(ai.choose(1,()=>.9),1);ai.save();assert(ai.stats().updates===20);`,
);
const learned = engine(e.storage);
learned.run(`assert.equal(ai.choose(1,()=>.9),1);`);
// Estado completo se guarda y reanuda sin duplicar la estación ni las recogidas.
run(
  `startGame(false);player.hasDoubleJump=true;player.hasWeapon=true;player.power=2;player.hp=3;collected=new Set([4,5,8,10]);keyring=new Set([10]);relays=new Set([7,11,13]);seals=new Set([6,9,12]);completed=new Set([4,5,6,7,8,9,10,11,12,13]);for(const en of enemies)killEnemy(en,1);setCheckpoint(12);save();`,
);
const resumed = engine(e.storage);
resumed.run(
  `assert(saved);startGame(true);assert.equal(player.hp,3);assert.equal(player.power,2);assert(keyring.has(10));assert(relays.has(11));assert.equal(getTile(171,9),'.');assert.equal(getTile(91,9),'.');assert.equal(seals.size,3);assert(enemies.every(e=>!e.alive));assert(openedDoors.has(11));assert.equal(checkpoint,12);`,
);
resumed.elements["btn-reset"].onclick();
resumed.run("assert(resetPending);");
resumed.elements["btn-new"].onclick();
resumed.run(`assert(player.hasWeapon);assert(ai.stats().updates>0);`);
resumed.elements["btn-reset"].onclick();
resumed.elements["btn-start"].onclick();
resumed.run(
  `assert(!player.hasWeapon);assert.equal(player.hp,5);assert.equal(completed.size,0);assert.equal(ai.stats().updates,0);assert.equal(ai.stats().decisions,0);`,
);
// Migración de 0.3.1 conserva botas y desplaza las antiguas salas y cadáveres.
const legacy = engine({
  "pixelvania-echoes-v1": JSON.stringify({
    version: 1,
    seed: 9,
    checkpoint: 6,
    boots: true,
    seals: [3, 5, 6],
    visited: [0, 1, 2, 3, 4, 5, 6],
    relays: [4],
    defeated: [{ id: 95, x: 1520, y: 155, dir: 1 }],
  }),
});
legacy.run(
  `assert(saved);startGame(true);assert.equal(checkpoint,12);assert(player.hasDoubleJump&&player.hasWeapon);assert(seals.has(6)&&seals.has(9)&&seals.has(12));assert(relays.has(7));assert.equal(corpses[0].id,155);assert(validSave(JSON.parse(localStorage.getItem('pixelvania-echoes-v1'))));`,
);
console.log(
  "OK: vida, armería, amplificador, estación, llave, puertas, dificultad, combate, aprendizaje, reinicio y migración",
);
