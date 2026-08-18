// game.js の中身
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = { 
    x: 192, y: 380, normalSpeed: 4.5, slowSpeed: 2, 
    radius: 3, lives: 5, bombs: 3, score: 0, graze: 0, power: 1.00, invincible: 0 
};

let bullets = [];
let enemyBullets = [];
let items = [];
let enemies = [{ x: 192, y: 70, radius: 20, hp: 60, shootTimer: 0 }];
let keys = {};
let shootInterval = 0;
let gameOver = false;

window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

function resetPlayer() {
    player.x = 192;
    player.y = 380;
    player.invincible = 120;
}

function dropItems(x, y) {
    for (let i = 0; i < 2; i++) {
        items.push({ x: x + (Math.random()-0.5)*30, y: y, vx: (Math.random()-0.5)*1.5, vy: -2 - Math.random()*2, type: 'P' });
    }
    for (let i = 0; i < 3; i++) {
        items.push({ x: x + (Math.random()-0.5)*30, y: y, vx: (Math.random()-0.5)*1.5, vy: -2 - Math.random()*2, type: 'point' });
    }
}

function update() {
    if (gameOver) return;
    if (player.invincible > 0) player.invincible--;

    let isSlow = keys['shift'];
    let spd = isSlow ? player.slowSpeed : player.normalSpeed;
    if ((keys['arrowleft'] || keys['a']) && player.x > 12) player.x -= spd;
    if ((keys['arrowright'] || keys['d']) && player.x < canvas.width - 12) player.x += spd;
    if ((keys['arrowup'] || keys['w']) && player.y > 12) player.y -= spd;
    if ((keys['arrowdown'] || keys['s']) && player.y < canvas.height - 12) player.y += spd;

    if (keys['z']) {
        shootInterval++;
        let threshold = isSlow ? 3 : 5;
        if (shootInterval >= threshold) {
            if (isSlow) {
                bullets.push({ x: player.x - 3, y: player.y - 10, vy: -16 });
                bullets.push({ x: player.x + 3, y: player.y - 10, vy: -16 });
                if (player.power >= 2.0) bullets.push({ x: player.x, y: player.y - 12, vy: -18 });
            } else {
                let off = player.power >= 2.0 ? 12 : 8;
                bullets.push({ x: player.x - off, y: player.y - 10, vy: -15 });
                bullets.push({ x: player.x + off, y: player.y - 10, vy: -15 });
                if (player.power >= 2.0) bullets.push({ x: player.x, y: player.y - 10, vy: -15 });
            }
            shootInterval = 0;
        }
    } else {
        shootInterval = 0;
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.y += b.vy;
        if (b.y < 0) { bullets.splice(i, 1); continue; }
        for (let j = enemies.length - 1; j >= 0; j--) {
            let e = enemies[j];
            if (Math.hypot(e.x - b.x, e.y - b.y) < e.radius + 4) {
                e.hp -= 1;
                bullets.splice(i, 1);
                if (e.hp <= 0) {
                    dropItems(e.x, e.y);
                    enemies.splice(j, 1);
                    player.score += 500;
                }
                break;
            }
        }
    }

    enemies.forEach(e => {
        e.shootTimer++;
        if (e.shootTimer > 28) {
            let angle = Math.atan2(player.y - e.y, player.x - e.x);
            for (let i = -1; i <= 1; i++) {
                enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle + i * 0.22) * 3.5, vy: Math.sin(angle + i * 0.22) * 3.5, grazed: false });
            }
            e.shootTimer = 0;
        }
    });

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        let eb = enemyBullets[i];
        eb.x += eb.vx; eb.y += eb.vy;
        if (eb.x < 0 || eb.x > canvas.width || eb.y < 0 || eb.y > canvas.height) { enemyBullets.splice(i, 1); continue; }
        let d = Math.hypot(player.x - eb.x, player.y - eb.y);
        if (!eb.grazed && d < 16 && d >= 4) { player.graze++; player.score += 50; eb.grazed = true; }
        if (player.invincible === 0 && d < 4) {
            player.lives--;
            enemyBullets.splice(i, 1);
            if (player.lives <= 0) gameOver = true; else resetPlayer();
            break;
        }
    }

    for (let i = items.length - 1; i >= 0; i--) {
        let it = items[i];
        it.vy += 0.03; it.x += it.vx; it.y += it.vy;
        if (it.y > canvas.height + 20) { items.splice(i, 1); continue; }
        let d = Math.hypot(player.x - it.x, player.y - it.y);
        if (player.y < 80 || d < 40) {
            let angle = Math.atan2(player.y - it.y, player.x - it.x);
            it.x += Math.cos(angle) * 12; it.y += Math.sin(angle) * 12;
        }
        if (Math.hypot(player.x - it.x, player.y - it.y) < 10) {
            if (it.type === 'P') player.power = Math.min(4.00, player.power + 0.05);
            else player.score += 1000;
            items.splice(i, 1);
        }
    }

    if (enemies.length === 0) {
        player.score += 2000;
        enemies.push({ x: 192, y: 70, radius: 20, hp: 80, shootTimer: 0 });
    }

    document.getElementById('score-val').innerText = String(player.score).padStart(8, '0');
    document.getElementById('graze-val').innerText = player.graze;
    document.getElementById('lives-val').innerText = gameOver ? 'DEAD' : '★'.repeat(Math.max(0, player.lives));
    document.getElementById('bombs-val').innerText = '★'.repeat(Math.max(0, player.bombs));
    document.getElementById('power-val').innerText = player.power.toFixed(2);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, 80); ctx.lineTo(canvas.width, 80); ctx.stroke();
    ctx.setLineDash([]);

    if (enemies.length > 0) {
        let e = enemies[0];
        ctx.fillStyle = '#cc44ff';
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'white'; ctx.font = '10px sans-serif';
        ctx.fillText(`HP:${e.hp}`, e.x - 12, e.y - 24);
    }

    items.forEach(it => {
        ctx.beginPath();
        if (it.type === 'P') {
            ctx.fillStyle = '#ffff00'; ctx.arc(it.x, it.y, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000000'; ctx.font = 'bold 9px sans-serif'; ctx.fillText('P', it.x - 3, it.y + 3);
        } else {
            ctx.fillStyle = '#00aaff'; ctx.arc(it.x, it.y, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 8px sans-serif'; ctx.fillText('点', it.x - 5, it.y + 3);
        }
    });

    ctx.fillStyle = '#00ffcc';
    bullets.forEach(b => ctx.fillRect(b.x - 2, b.y - 5, 4, 10));

    ctx.fillStyle = '#ff5555';
    enemyBullets.forEach(eb => {
        ctx.beginPath(); ctx.arc(eb.x, eb.y, 4, 0, Math.PI * 2); ctx.fill();
    });

    if (player.invincible === 0 || Math.floor(player.invincible / 4) % 2 === 0) {
        ctx.fillStyle = '#ff3333';
        ctx.beginPath(); ctx.arc(player.x, player.y, 5, 0, Math.PI * 2); ctx.fill();

        if (keys['shift']) {
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(player.x, player.y, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(player.x, player.y, 16, 0, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = '#00ffff';
            ctx.beginPath(); ctx.arc(player.x, player.y, 10, 0, Math.PI * 2); ctx.stroke();
        } else {
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(player.x, player.y, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    }

    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = 'white'; ctx.font = '14px sans-serif';
        ctx.fillText('F5キーでリトライ', canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'left';
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
