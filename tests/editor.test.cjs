const assert=require('node:assert/strict'),engine=require('./harness.cjs');
const storage={},studio=engine(storage);
studio.run(`
const profile=PixelScenes.blank();
profile.rooms[8].name='Bahía de pruebas';profile.rooms[8].theme='sky';
profile.rooms[8].patches=[[9,3,'R'],[9,4,'+'],[9,5,'Q'],[9,6,'B'],[9,7,'>'],[9,8,'h'],[9,9,'z'],[9,10,'e']];
PixelScenes.save(profile);
const rendered=PixelScenes.compose(world.generate(9),profile);
assert.equal(rendered[9][163],'R');assert.equal(rendered[9][170],'e');
const bad=PixelScenes.blank();bad.rooms[4].patches=[[9,11,'.']];
assert.throws(()=>PixelScenes.validate(bad),'no se borra el arma');
bad.rooms[4].patches=[[9,6,'e']];assert.throws(()=>PixelScenes.validate(bad),'sin enemigos antes del arma');
bad.rooms[4].patches=[];bad.rooms[8].patches=Array.from({length:9},(_,i)=>[9,i+3,'e']);
assert.throws(()=>PixelScenes.validate(bad),'máximo ocho enemigos');
`);
const game=engine(storage);
game.run(`
assert.equal(world.rooms[8].name,'Bahía de pruebas');assert.equal(world.rooms[8].theme,'sky');
startGame(false);spoken=new Set(world.rooms.map((_,i)=>i));
assert(enemies.some(e=>e.room===8&&e.type==='e'));
player.x=163*16;player.y=145;processPickups();assert.equal(player.shield,1);assert.equal(getTile(163,9),'.');
player.x=164*16;player.hp=3;processPickups();assert.equal(player.hp,5);
player.x=165*16;player.hasWeapon=true;processPickups();assert.equal(player.power,3);
assert.equal(bonusCollected.size,3);
player.invulnerable=0;const hp=player.hp;damagePlayer();assert.equal(player.hp,hp);assert.equal(player.shield,0);
enemies=[];player.x=166*16;player.y=145;player.grounded=true;player.vy=0;player.vx=0;update();assert(player.vy<0,'el muelle impulsa');
player.x=167*16;player.y=145;player.grounded=true;player.vy=0;player.vx=0;update();assert(player.x>167*16,'la cinta transporta');
player.x=168*16;player.y=145;player.grounded=true;player.vy=0;player.invulnerable=0;time=0;update();assert.equal(player.hp,hp-1,'el vapor daña cuando está activo');
assert(collision(169*16,145,12,15),'el cristal bloquea');
player.x=169*16-24;player.y=145;player.vx=0;player.grounded=true;player.facingRight=true;player.hasWeapon=true;
cooldown=0;pulse();for(let i=0;i<10;i++)update();assert.equal(getTile(169,9),'.','el cristal se rompe con un pulso');
player.suit=2;setCheckpoint(8);save();
`);
const resumed=engine(storage);
resumed.run(`startGame(true);assert.equal(player.power,3);assert.equal(player.suit,2);assert.equal(player.hp,4);assert.equal(getTile(163,9),'.');assert.equal(getTile(164,9),'.');assert.equal(getTile(165,9),'.');assert.equal(getTile(166,9),'B');assert.equal(checkpoint,8);`);
// Variedades básicas: el bruto resiste más, el dron persigue en el aire y la torreta dispara.
const variants=engine();variants.run(`startGame(false);const brute=enemies.find(e=>e.type==='b');const scout=enemies.find(e=>e.type==='e');const drone=enemies.find(e=>e.type==='f');const turret=enemies.find(e=>e.type==='F');assert(brute.maxHP>2&&scout.maxHP<2);assert(drone&&turret);player.x=drone.x-30;player.y=drone.y;const fx=drone.x;updateEnemy(drone);assert(drone.x<fx);player.x=turret.x-35;player.y=145;turret.fireCD=0;updateEnemy(turret);assert(hostileShots.length===1,'la torreta dispara con línea de visión');`);
console.log('OK: escenas editables, piezas protegidas, objetos, mecánicas, cinco enemigos y guardado de mejoras');
