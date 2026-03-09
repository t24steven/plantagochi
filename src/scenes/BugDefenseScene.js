import Phaser from 'phaser';

export default class BugDefenseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BugDefenseScene' });
    }

    preload() {
        if (!this.textures.exists('bg_yard'))
            this.load.image('bg_yard', 'public/elements/bg/exterior.png');
        if (!this.textures.exists('status_bar'))
            this.load.image('status_bar', 'assets/ui/status_bar.png');
        if (!this.textures.exists('coin'))
            this.load.image('coin', 'assets/ui/coin.png');
        if (!this.textures.exists('plant_yard'))
            this.load.image('plant_yard', 'assets/plants/plantsC/plant1.png');

        // Asset del bicho — ajusta el path si es diferente
        this.load.image('bug', 'assets/minigames/bug.png');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.score      = 0;
        this.lives      = 3;
        this.gameOver   = false;
        this.bugs       = [];
        this.spawnDelay = 2000;
        this.bugSpeed   = 55;
        this.paused     = false;

        // ── Fondo ──────────────────────────────────────────────────────
        this.add.image(W / 2, H / 2, 'bg_yard').setDisplaySize(W, H).setDepth(0);
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.15).setDepth(1);

        // ── Planta en el centro (objetivo a defender) ──────────────────
        const data = localStorage.getItem('plantaSeleccionada');
        const plantaData = data ? JSON.parse(data) : { bodyGame: 'assets/plants/plantsC/plant1.png' };
        const plantKey = this.textures.exists('plant_yard') ? 'plant_yard' : 'plant_default';

        this.plantSprite = this.add.image(W / 2, H / 2 + 60, plantKey)
            .setDisplaySize(220, 220).setDepth(10);

        // Maceta
        this.add.rectangle(W / 2, H / 2 + 180, 140, 100, 0xffffff)
            .setStrokeStyle(3, 0xcccccc).setDepth(9);

        // Zona de colisión de la planta (radio)
        this.plantRadius = 100;

        // ── HUD ────────────────────────────────────────────────────────
        this.createHUD(W, H);

        // ── Timers ────────────────────────────────────────────────────
        this.spawnTimer = this.time.addEvent({
            delay: this.spawnDelay,
            loop: true,
            callback: this.spawnBug,
            callbackScope: this
        });

        // Dificultad creciente cada 12s
        this.time.addEvent({
            delay: 12000,
            loop: true,
            callback: this.increaseDifficulty,
            callbackScope: this
        });

        // Timer 60s
        this.timeLeft = 60;
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.gameOver || this.paused) return;
                this.timeLeft--;
                this.timerText.setText(`⏱ ${this.timeLeft}s`);
                if (this.timeLeft <= 0) this.endGame(true);
            }
        });
    }

    createHUD(W, H) {
        const barH = 62;

        // Coins top-left
        const barW1 = 230;
        this.add.image(barW1 / 2 + 20, 50, 'status_bar')
            .setDisplaySize(barW1, barH).setDepth(20);
        this.add.image(38, 50, 'coin').setDisplaySize(40, 40).setDepth(21);
        this.scoreText = this.add.text(barW1 / 2 + 30, 50, '0', {
            fontSize: '22px', color: '#7a5200',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(21);

        // Corazones top-center (en barra beige)
        const barW2 = 260;
        this.add.image(W / 2 - 60, 50, 'status_bar')
            .setDisplaySize(barW2, barH).setDepth(20);

        this.heartsGroup = [];
        const heartX = [W / 2 - 140, W / 2 - 70, W / 2];
        for (let i = 0; i < 3; i++) {
            const h = this.add.text(heartX[i], 50, '❤️', {
                fontSize: '30px'
            }).setOrigin(0.5).setDepth(21);
            this.heartsGroup.push(h);
        }

        // Corazón flotante extra (como en la imagen)
        this.add.text(W / 2 + 60, 50, '❤️', {
            fontSize: '30px'
        }).setOrigin(0.5).setDepth(21);

        // Timer
        const barW3 = 160;
        this.add.image(W - barW3 - 230, 50, 'status_bar')
            .setDisplaySize(barW3, barH).setDepth(20);
        this.timerText = this.add.text(W - barW3 - 230, 50, '⏱ 60s', {
            fontSize: '18px', color: '#7a5200',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(21);

        // Pausa (top-right)
        const pauseBg = this.add.image(W - 170, 50, 'status_bar')
            .setDisplaySize(90, 90).setDepth(20)
            .setInteractive({ useHandCursor: true });
        this.pauseIcon = this.add.text(W - 170, 50, '⏸', {
            fontSize: '32px'
        }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

        this.pauseIcon.on('pointerdown', () => this.togglePause());
        pauseBg.on('pointerdown', () => this.togglePause());

        // Libreta / salir (top-right)
        const exitBg = this.add.image(W - 65, 50, 'status_bar')
            .setDisplaySize(90, 90).setDepth(20)
            .setInteractive({ useHandCursor: true });
        this.add.text(W - 65, 50, '✕', {
            fontSize: '28px', color: '#e53935',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.exitGame());

        exitBg.on('pointerdown', () => this.exitGame());

        // Overlay de pausa (oculto)
        this.pauseOverlay = this.add.container(W / 2, H / 2).setDepth(50).setVisible(false);
        const pauseBg2 = this.add.rectangle(0, 0, W, H, 0x000000, 0.6);
        const pauseTxt = this.add.text(0, -40, '⏸ PAUSA', {
            fontSize: '52px', color: '#ffffff',
            fontStyle: 'bold', fontFamily: 'Arial',
            stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5);
        const resumeTxt = this.add.text(0, 50, 'Toca para continuar', {
            fontSize: '26px', color: '#a5d6a7',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        resumeTxt.on('pointerdown', () => this.togglePause());
        this.pauseOverlay.add([pauseBg2, pauseTxt, resumeTxt]);
    }

    spawnBug() {
        if (this.gameOver || this.paused) return;
        const W = this.scale.width;
        const H = this.scale.height;

        // Spawn desde los 4 bordes aleatoriamente
        const side = Phaser.Math.Between(0, 3);
        let x, y, angle;

        switch (side) {
            case 0: x = Phaser.Math.Between(40, W - 40); y = -40;      break; // top
            case 1: x = W + 40;  y = Phaser.Math.Between(100, H - 40); break; // right
            case 2: x = Phaser.Math.Between(40, W - 40); y = H + 40;   break; // bottom
            case 3: x = -40;     y = Phaser.Math.Between(100, H - 40); break; // left
        }

        const bug = this.add.container(x, y).setDepth(15);
        bug._dead  = false;
        bug._speed = this.bugSpeed + Phaser.Math.Between(-15, 15);

        // Sprite del bicho
        const img = this.add.image(0, 0, 'bug').setDisplaySize(72, 72);
        bug.add(img);
        bug._img = img;

        // Apunta hacia la planta desde el inicio
        const dx = this.scale.width  / 2 - x;
        const dy = this.scale.height / 2 + 60 - y;
        bug._angle = Math.atan2(dy, dx);
        img.setRotation(bug._angle + Math.PI / 2);

        // Click/tap para matar
        img.setInteractive({ useHandCursor: true });
        img.on('pointerdown', () => this.killBug(bug));
        img.on('pointerover', () => img.setTint(0xff6666));
        img.on('pointerout',  () => img.clearTint());

        this.bugs.push(bug);
    }

    killBug(bug) {
        if (bug._dead || this.gameOver) return;
        bug._dead = true;

        this.score++;
        this.scoreText.setText(`${this.score}`);

        // Efecto muerte — gira y desaparece
        this.tweens.add({
            targets: bug,
            scaleX: 0, scaleY: 0,
            angle: 360,
            alpha: 0,
            duration: 300,
            ease: 'Quad.easeIn',
            onComplete: () => {
                bug.destroy();
                this.bugs = this.bugs.filter(b => b !== bug);
            }
        });

        // Partícula de impacto
        const splat = this.add.text(bug.x, bug.y, '💥', {
            fontSize: '28px'
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({
            targets: splat, alpha: 0, y: splat.y - 40,
            duration: 400,
            onComplete: () => splat.destroy()
        });

        // Texto flotante +1
        const plus = this.add.text(bug.x, bug.y - 30, '+1', {
            fontSize: '22px', color: '#4caf50',
            fontStyle: 'bold', fontFamily: 'Arial',
            stroke: '#fff', strokeThickness: 3
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({
            targets: plus, y: plus.y - 50, alpha: 0, duration: 600,
            onComplete: () => plus.destroy()
        });
    }

    bugReachesPlant(bug) {
        if (bug._dead) return;
        bug._dead = true;

        this.lives--;
        this.updateHearts();

        // Flash + shake
        this.cameras.main.shake(300, 0.012);
        this.cameras.main.flash(200, 200, 50, 50);

        // Planta tiembla
        this.tweens.add({
            targets: this.plantSprite,
            x: this.plantSprite.x + 8,
            duration: 60, yoyo: true, repeat: 3,
            onComplete: () => this.plantSprite.setX(this.scale.width / 2)
        });

        // Texto de daño
        const dmg = this.add.text(this.scale.width / 2, this.scale.height / 2 - 80, '-1 ❤️', {
            fontSize: '28px', color: '#e53935',
            fontStyle: 'bold', fontFamily: 'Arial',
            stroke: '#fff', strokeThickness: 3
        }).setOrigin(0.5).setDepth(25);
        this.tweens.add({
            targets: dmg, y: dmg.y - 60, alpha: 0, duration: 700,
            onComplete: () => dmg.destroy()
        });

        bug.destroy();
        this.bugs = this.bugs.filter(b => b !== bug);

        if (this.lives <= 0) this.endGame(false);
    }

    updateHearts() {
        this.heartsGroup.forEach((h, i) => {
            h.setAlpha(i < this.lives ? 1 : 0.2);
        });
    }

    increaseDifficulty() {
        if (this.gameOver) return;
        this.spawnDelay = Math.max(600,  this.spawnDelay - 200);
        this.bugSpeed   = Math.min(140,  this.bugSpeed   + 12);

        this.spawnTimer.remove();
        this.spawnTimer = this.time.addEvent({
            delay: this.spawnDelay,
            loop: true,
            callback: this.spawnBug,
            callbackScope: this
        });
    }

    togglePause() {
        this.paused = !this.paused;
        this.pauseOverlay.setVisible(this.paused);
        this.pauseIcon.setText(this.paused ? '▶️' : '⏸');

        if (this.paused) {
            this.spawnTimer.paused = true;
        } else {
            this.spawnTimer.paused = false;
        }
    }

    endGame(timeUp) {
        if (this.gameOver) return;
        this.gameOver = true;
        this.spawnTimer.remove();

        this.bugs.forEach(b => b.destroy());
        this.bugs = [];

        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setDepth(40);

        const title = timeUp ? '🎉 ¡Sobreviviste!' : '💀 ¡La planta fue atacada!';
        this.add.text(W / 2, H / 2 - 130, title, {
            fontSize: '44px', color: '#ffffff',
            fontStyle: 'bold', fontFamily: 'Arial',
            stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(41);

        this.add.text(W / 2, H / 2 - 50, `Bichos eliminados: ${this.score}`, {
            fontSize: '30px', color: '#a5d6a7',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(41);

        // Recompensa: cada bicho = +2 health
        const healthBonus = this.score * 2;
        this.add.text(W / 2, H / 2 + 15, `+${healthBonus} 🩺 salud`, {
            fontSize: '26px', color: '#ffcc80',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(41);

        // Aplicar al registro
        const stats = this.registry.get('plantStats');
        if (stats) {
            stats.health    = Math.min(100, stats.health    + healthBonus);
            stats.happiness = Math.min(100, stats.happiness + Math.floor(healthBonus / 2));
        }

        // Botón Volver
        const backBg = this.add.rectangle(W / 2 - 130, H / 2 + 110, 210, 58, 0x4caf50)
            .setStrokeStyle(4, 0x2e7d32).setDepth(41)
            .setInteractive({ useHandCursor: true });
        this.add.text(W / 2 - 130, H / 2 + 110, '🔙 Volver', {
            fontSize: '22px', color: '#fff',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(42);
        backBg.on('pointerdown', () => this.exitGame());
        backBg.on('pointerover', () => backBg.setFillStyle(0x66bb6a));
        backBg.on('pointerout',  () => backBg.setFillStyle(0x4caf50));

        // Botón Reintentar
        const retryBg = this.add.rectangle(W / 2 + 130, H / 2 + 110, 210, 58, 0xff9800)
            .setStrokeStyle(4, 0xe65100).setDepth(41)
            .setInteractive({ useHandCursor: true });
        this.add.text(W / 2 + 130, H / 2 + 110, '🔄 Reintentar', {
            fontSize: '22px', color: '#fff',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(42);
        retryBg.on('pointerdown', () => this.scene.restart());
        retryBg.on('pointerover', () => retryBg.setFillStyle(0xffb74d));
        retryBg.on('pointerout',  () => retryBg.setFillStyle(0xff9800));
    }

    exitGame() {
        this.scene.stop('BugDefenseScene');
        if (this.scene.isActive('MinigamesMenuScene'))
            this.scene.stop('MinigamesMenuScene');
        this.scene.resume('YardScene');
    }

    update(time, delta) {
        if (this.gameOver || this.paused) return;

        const plantX = this.scale.width  / 2;
        const plantY = this.scale.height / 2 + 60;

        for (let i = this.bugs.length - 1; i >= 0; i--) {
            const bug = this.bugs[i];
            if (!bug || bug._dead) continue;

            // Mover hacia la planta
            const dx = plantX - bug.x;
            const dy = plantY - bug.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.plantRadius) {
                this.bugReachesPlant(bug);
                continue;
            }

            // Velocidad normalizada
            const speed = bug._speed * (delta / 1000);
            bug.x += (dx / dist) * speed;
            bug.y += (dy / dist) * speed;

            // Rotar hacia la planta en tiempo real
            bug._img?.setRotation(Math.atan2(dy, dx) + Math.PI / 2);
        }
    }
}
