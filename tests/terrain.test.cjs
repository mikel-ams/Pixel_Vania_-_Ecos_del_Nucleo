const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  engine = require("./harness.cjs");
const { run, sandbox } = engine();
run(
  `startGame(false);spoken=new Set(world.rooms.map((_,i)=>i));enemies.forEach(e=>e.alive=false);`,
);
const original = JSON.parse(
  fs.readFileSync(
    require("node:path").join(__dirname, "campaign-route.json"),
    "utf8",
  ),
);
for (const route of original.slice(0, 2)) {
  sandbox.route = route;
  run(
    `const hp=player.hp;for(const a of route.actions){keys.ArrowLeft=a.dir===-1;keys.ArrowRight=a.dir===1;if(a.jump)jumpTrigger();for(let n=0;n<6&&!gameWon;n++){if(paused)advanceDialog();update();}}clearInputs();assert.equal(player.hp,hp);assert(Math.abs(player.x-route.goal.x)<12);`,
  );
}
// Buscador de rutas que usa los mismos saltos y colisiones; los resultados se reproducen con update().
run(`
window.plan=function(goal){
 const original={...player},seen=new Set();
 let beam=[{p:{...player},actions:[]}];
 const distance=p=>Math.hypot(p.x-goal.x,(p.y-goal.y)*1.5);
 for(let depth=0;depth<95;depth++){
  const candidates=[];
  for(const node of beam)for(const dir of [1,0,-1])for(const jump of [false,true]){
    if(jump&&node.p.coyote<=0&&!node.p.canDoubleJump)continue;
    Object.assign(player,node.p);player.jumpBuffer=jump?7:0;
    let safe=true;
    for(let frame=0;frame<6;frame++){
      player.coyote=player.grounded?6:Math.max(0,player.coyote-1);
      if(player.jumpBuffer>0){performJump();player.jumpBuffer--;}
      player.vx=dir?dir*2:player.vx*.82;
      player.vy=Math.min(player.vy+.26,7);
      moveBody(player,player.vx,player.vy);
      if(player.blocked)player.vx=0;
      if(player.grounded)player.canDoubleJump=player.hasDoubleJump;
      if(collision(player.x,player.y,12,15,'^')||player.y>190){safe=false;break;}
    }
    if(!safe)continue;
    const p={...player},actions=[...node.actions,{dir,jump}];
    if(distance(p)<10){Object.assign(player,original);particles=[];return actions;}
    const signature=[Math.round(p.x/3),Math.round(p.y/3),Math.round(p.vy),p.grounded?1:0,p.canDoubleJump?1:0,p.coyote>0?1:0].join(':');
    if(seen.has(signature))continue;seen.add(signature);
    candidates.push({p,actions,score:distance(p)+depth*.2});
  }
  candidates.sort((a,b)=>a.score-b.score);beam=candidates.slice(0,150);
  if(!beam.length)break;
 }
 Object.assign(player,original);particles=[];throw new Error('Ruta inalcanzable '+JSON.stringify(goal));
};
window.follow=function(goal){
 const hp=player.hp;const actions=plan(goal);
 for(const a of actions){keys.ArrowLeft=a.dir===-1;keys.ArrowRight=a.dir===1;if(a.jump)jumpTrigger();for(let n=0;n<6&&!gameWon;n++){if(paused)advanceDialog();update();}}
 clearInputs();if(paused&&!gameWon)advanceDialog();assert(player.hp>=hp,'ruta sin tocar pinchos');assert(Math.hypot(player.x-goal.x,(player.y-goal.y)*1.5)<18,'reproducción física '+JSON.stringify({goal,x:player.x,y:player.y}));
};
`);
run(
  `follow({x:992,y:145});follow({x:1278,y:145});follow({x:1456,y:145});assert(player.hasWeapon);updateChallenges();follow({x:1634,y:145});follow({x:1792,y:129});assert.equal(player.power,2);updateChallenges();`,
);
// Campaña continua: cada desafío se completa con su entrada real, antes de cruzar la puerta.
for (const room of [6, 7, 8, 9, 10, 11, 12, 13, 14]) {
  sandbox.targetRoom = room;
  run(`follow({x:targetRoom*320+34,y:145});`);
  const goals = {
    6: { x: 2112, y: 129 },
    7: { x: 2464, y: 145 },
    8: { x: 2736, y: 145 },
    9: { x: 3072, y: 129 },
    10: { x: 3392, y: 81 },
    11: { x: 3792, y: 145 },
    12: { x: 4032, y: 129 },
    13: { x: 4352, y: 129 },
    14: { x: 4736, y: 129 },
  };
  if (room === 8) run("player.hp=3;");
  sandbox.goal = goals[room];
  run("follow(goal);");
  if ([6, 9, 12].includes(room))
    run(
      `player.facingRight=true;cooldown=0;pulse();for(let i=0;i<20;i++){if(paused)advanceDialog();update();}assert(seals.has(targetRoom));`,
    );
  if (room === 13)
    run(
      `time=0;player.facingRight=true;cooldown=0;pulse();for(let i=0;i<20;i++){if(paused)advanceDialog();update();}assert(relays.has(13));`,
    );
  run("updateChallenges();");
}
run(
  `assert(gameWon);assert.equal(seals.size,3);assert(player.hasDoubleJump&&player.hasWeapon&&player.power===2);assert(collected.has(8)&&keyring.has(10)&&relays.has(11)&&relays.has(13));assert.equal(openedDoors.size,world.gateRooms.length);assert.equal(completed.size,15);`,
);
console.log(
  "OK: ruta física de las 15 escenas, recogidas elevadas, llave, receptor y final",
);
