import Phaser from 'phaser';

export default class CatchFertilizerScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CatchFertilizerScene' });
    }

    preload() {
        // Reutiliza assets que ya tienes cargados en el registry
        // Si no están, los carga aquí
        if (!this.textures.exists('bg_yard'))
            this.load.image('bg_yard', '/elements/bg/exterior.png');
        if (!this.textures.exists('icon_seeds'))
            this.load.image('icon_seeds', '/assets/ui/icon_seeds.png');
        if (!this.textures.exists('status_bar'))
            this.load.image('status_bar', '/assets/ui/status_bar.png');
        if (!this.textures.exists('coin'))
            this.load.image('coin', '/assets/ui/coin.png');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.score       = 0;
        this.lives       = 3;
        this.gameOver    = false;
        this.dropDelay   = 1200;   // ms entre caídas (va bajando)
        this.dropSpeed   = 280;    // velocidad de caída (va subiendo)
        this.bagGroup    = [];

        // ── Fondo ──────────────────────────────────────────────────────
        this.add.image(W / 2, H / 2, 'bg_yard').setDisplaySize(W, H).setDepth(0);

        // Oscurecer ligeramente el fondo para legibilidad
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.18).setDepth(1);

        // ── Canasta (jugador) ──────────────────────────────────────────
        this.basket = this.add.container(W / 2, H - 90).setDepth(10);

        const basketBody = this.add.rectangle(0, 0, 140, 60, 0x8B5E3C)
            .setStrokeStyle(4, 0x5c3a1e);
        const basketTop  = this.add.rectangle(0, -30, 160, 18, 0xa07040)
            .setStrokeStyle(3, 0x5c3a1e);
        const basketLine = this.add.rectangle(0, 5, 110, 6, 0x6b4226, 0.7);

        this.basket.add([basketBody, basketTop, basketLine]);

        // Zona de colisión de la canasta
        this.basketZone = this.add.rectangle(W / 2, H - 90, 140, 60)
            .setOrigin(0.5).setDepth(10);

        // ── Input: mouse/touch ─────────────────────────────────────────
        this.input.on('pointermove', (ptr) => {
            if (this.gameOver) return;
            const clampedX = Phaser.Math.Clamp(ptr.x, 80, W - 80);
            this.basket.x   = clampedX;
            this.basketZone.x = clampedX;
        });

        // Soporte teclado
        this.cursors = this.input.keyboard.createCursorKeys();

        // ── HUD ────────────────────────────────────────────────────────
        this.createHUD(W, H);

        // ── Temporizador de spawn ──────────────────────────────────────
        this.spawnTimer = this.time.addEvent({
            delay: this.dropDelay,
            loop: true,
            callback: this.spawnBag,
            callbackScope: this
        });

        // Cada 10 segundos aumenta dificultad
        this.time.addEvent({
            delay: 10000,
            loop: true,
            callback: this.increaseDifficulty,
            callbackScope: this
        });

        // Temporizador 60 segundos
        this.timeLeft = 60;
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.gameOver) return;
                this.timeLeft--;
                this.timerText.setText(`⏱ ${this.timeLeft}s`);
                if (this.timeLeft <= 0) this.endGame(true);
            }
        });
    }

    createHUD(W, H) {
        // Score bar top-left
        const barW = 240, barH = 62;
        this.add.image(barW / 2 + 20, 50, 'status_bar')
            .setDisplaySize(barW, barH).setDepth(20);
        this.add.image(38, 50, 'coin')
            .setDisplaySize(40, 40).setDepth(21);
        this.scoreText = this.add.text(barW / 2 + 30, 50, '0', {
            fontSize: '22px', color: '#7a5200',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(21);

        // Seeds bar top-center (decorativa, refleja puntuación)
        const bar2W = 270;
        this.add.image(W / 2, 50, 'status_bar')
            .setDisplaySize(bar2W, barH).setDepth(20);
        this.add.image(W / 2 - bar2W * 0.38, 50, 'icon_seeds')
            .setDisplaySize(40, 40).setDepth(21);
        this.seedsScoreText = this.add.text(W / 2 + 20, 50, 'x0 bolsas', {
            fontSize: '18px', color: '#7a5200',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(21);

        // Timer top-right
        const bar3W = 180;
        this.add.image(W - bar3W / 2 - 150, 50, 'status_bar')
            .setDisplaySize(bar3W, barH).setDepth(20);
        this.timerText = this.add.text(W - bar3W / 2 - 150, 50, '⏱ 60s', {
            fontSize: '20px', color: '#7a5200',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(21);

        // Libreta / back top-right
        const nbBg = this.add.image(W - 70, 50, 'status_bar')
            .setDisplaySize(90, 90).setDepth(20)
            .setInteractive({ useHandCursor: true });
        this.add.text(W - 70, 50, '✕', {
            fontSize: '28px', color: '#e53935',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.exitGame());

        // Vidas (corazones)
        this.heartsGroup = [];
        for (let i = 0; i < 3; i++) {
            const heart = this.add.text(W - 220 + i * 50, 50, '❤️', {
                fontSize: '28px'
            }).setOrigin(0.5).setDepth(21);
            this.heartsGroup.push(heart);
        }
    }

    spawnBag() {
        if (this.gameOver) return;
        const W = this.scale.width;

        const x = Phaser.Math.Between(60, W - 60);

        // Bolsa dibujada con graphics + icono
        const bag = this.add.container(x, -40).setDepth(15);

        const body = this.add.ellipse(0, 10, 72, 78, 0xc8a96e)
            .setStrokeStyle(3, 0x8B6914);
        const knot = this.add.ellipse(0, -28, 24, 18, 0x8B6914);
        const seedImg = this.add.image(0, 14, 'icon_seeds')
            .setDisplaySize(42, 42);

        bag.add([body, knot, seedImg]);
        bag._hits  = false;
        bag._speed = this.dropSpeed + Phaser.Math.Between(-40, 40);

        this.bagGroup.push(bag);
    }

    increaseDifficulty() {
        if (this.gameOver) return;
        this.dropDelay  = Math.max(400,  this.dropDelay  - 120);
        this.dropSpeed  = Math.min(600,  this.dropSpeed  + 40);

        // Reinicia el timer con el nuevo delay
        this.spawnTimer.remove();
        this.spawnTimer = this.time.addEvent({
            delay: this.dropDelay,
            loop: true,
            callback: this.spawnBag,
            callbackScope: this
        });
    }

    catchBag(bag) {
        if (bag._hits) return;
        bag._hits = true;

        this.score++;
        this.scoreText.setText(`${this.score}`);
        this.seedsScoreText.setText(`x${this.score} bolsas`);

        // Efecto de captura
        this.tweens.add({
            targets: bag,
            y: bag.y - 30,
            alpha: 0,
            scaleX: 1.4, scaleY: 1.4,
            duration: 250,
            onComplete: () => {
                bag.destroy();
                this.bagGroup = this.bagGroup.filter(b => b !== bag);
            }
        });

        // Feedback visual en canasta
        this.tweens.add({
            targets: this.basket,
            scaleX: 1.12, scaleY: 0.88,
            duration: 80, yoyo: true
        });

        // Texto flotante "+1"
        const plus = this.add.text(this.basket.x, this.basket.y - 50, '+1 🌿', {
            fontSize: '22px', color: '#2e7d32',
            fontStyle: 'bold', fontFamily: 'Arial',
            stroke: '#ffffff', strokeThickness: 3
        }).setOrigin(0.5).setDepth(25);

        this.tweens.add({
            targets: plus, y: plus.y - 55, alpha: 0, duration: 700,
            onComplete: () => plus.destroy()
        });
    }

    missedBag(bag) {
        if (bag._hits) return;
        bag._hits = true;

        this.lives--;
        this.updateHearts();

        // Flash rojo
        this.cameras.main.flash(250, 220, 50, 50);

        bag.destroy();
        this.bagGroup = this.bagGroup.filter(b => b !== bag);

        if (this.lives <= 0) this.endGame(false);
    }

    updateHearts() {
        this.heartsGroup.forEach((h, i) => {
            h.setAlpha(i < this.lives ? 1 : 0.2);
        });
    }

    endGame(timeUp) {
        if (this.gameOver) return;
        this.gameOver = true;
        this.spawnTimer.remove();

        // Destruye bolsas pendientes
        this.bagGroup.forEach(b => b.destroy());
        this.bagGroup = [];

        const W = this.scale.width;
        const H = this.scale.height;

        // Overlay
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(40);

        const title = timeUp ? '¡Tiempo!' : '💀 Game Over';
        this.add.text(W / 2, H / 2 - 120, title, {
            fontSize: '52px', color: '#ffffff',
            fontStyle: 'bold', fontFamily: 'Arial',
            stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(41);

        this.add.text(W / 2, H / 2 - 40, `Bolsas atrapadas: ${this.score}`, {
            fontSize: '32px', color: '#a5d6a7',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(41);

        // Calcular fertilizante ganado (1 punto = +2 happiness)
        const fertilBonus = this.score * 2;
        this.add.text(W / 2, H / 2 + 20, `+${fertilBonus} 🌿 fertilizante`, {
            fontSize: '26px', color: '#ffcc80',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(41);

        // Aplicar al registro
        const stats = this.registry.get('plantStats');
        if (stats) {
            stats.happiness = Math.min(100, stats.happiness + fertilBonus);
            stats.health    = Math.min(100, stats.health    + Math.floor(fertilBonus / 2));
        }

        // Botón volver
        const backBg = this.add.rectangle(W / 2, H / 2 + 110, 220, 60, 0x4caf50)
            .setStrokeStyle(4, 0x2e7d32).setDepth(41)
            .setInteractive({ useHandCursor: true });
        const backTxt = this.add.text(W / 2, H / 2 + 110, '🔙 Volver', {
            fontSize: '24px', color: '#ffffff',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(42);

        backBg.on('pointerdown', () => this.exitGame());
        backBg.on('pointerover', () => backBg.setFillStyle(0x66bb6a));
        backBg.on('pointerout',  () => backBg.setFillStyle(0x4caf50));

        // Botón reintentar
        const retryBg = this.add.rectangle(W / 2, H / 2 + 185, 220, 60, 0xff9800)
            .setStrokeStyle(4, 0xe65100).setDepth(41)
            .setInteractive({ useHandCursor: true });
        this.add.text(W / 2, H / 2 + 185, '🔄 Reintentar', {
            fontSize: '24px', color: '#ffffff',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(42);

        retryBg.on('pointerdown', () => this.scene.restart());
        retryBg.on('pointerover', () => retryBg.setFillStyle(0xffb74d));
        retryBg.on('pointerout',  () => retryBg.setFillStyle(0xff9800));
    }

    exitGame() {
        this.scene.stop('CatchFertilizerScene');
        this.scene.resume('YardScene');
        // Si viene de MinigamesMenuScene
        if (this.scene.isActive('MinigamesMenuScene')) {
            this.scene.stop('MinigamesMenuScene');
        }
    }

    update(time, delta) {
        if (this.gameOver) return;

        const W = this.scale.width;
        const H = this.scale.height;

        // Teclado
        if (this.cursors.left.isDown) {
            this.basket.x   = Math.max(80, this.basket.x - 7);
            this.basketZone.x = this.basket.x;
        } else if (this.cursors.right.isDown) {
            this.basket.x   = Math.min(W - 80, this.basket.x + 7);
            this.basketZone.x = this.basket.x;
        }

        // Mover bolsas y detectar colisión
        for (let i = this.bagGroup.length - 1; i >= 0; i--) {
            const bag = this.bagGroup[i];
            if (!bag || bag._hits) continue;

            bag.y += bag._speed * (delta / 1000);

            // Colisión simple con la canasta
            const dx = Math.abs(bag.x - this.basket.x);
            const dy = Math.abs(bag.y - this.basket.y);

            if (dx < 75 && dy < 50) {
                this.catchBag(bag);
            } else if (bag.y > H + 40) {
                this.missedBag(bag);
            }
        }
    }
}
