import Phaser from 'phaser';

export default class MinigamesMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MinigamesMenuScene' });
    }

    preload() {
        this.load.image('bg_yard',         '/elements/bg/exterior.png');
        this.load.image('icon_bug',        '/assets/ui/icon_bug.png');
        this.load.image('icon_fertilizer', '/assets/ui/icon_fertilizer.png');
        this.load.image('coin',            '/assets/ui/coin.png');
        this.load.image('icon_notebook',   '/assets/ui/icon_notebook.png');
        this.load.image('icon_water',      '/assets/ui/icon_water.png');
        this.load.image('icon_sun',        '/assets/ui/icon_sun.png');
        this.load.image('icon_leaf',       '/assets/ui/icon_leaf.png');

        // Notebooks para el panel
        this.load.image('notebook_cactus',    '/assets/notebooks/notebook_cactus.png');
        this.load.image('notebook_snake',     '/assets/notebooks/notebook_snake.png');
        this.load.image('notebook_sunflower', '/assets/notebooks/notebook_sunflower.png');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // ── FONDO ─────────────────────────────────────────────
        this.add.image(W / 2, H / 2, 'bg_yard')
            .setDisplaySize(W, H).setDepth(0);

        // ── helpers para coordenadas originales 1200×800
        const getX = v => v * (W / 1200);
        const getY = v => v * (H / 800);
        this._localX = getX; this._localY = getY; // store for other helpers

        // ── UI SUPERIOR (stats + monedas + libreta) ───────────
        this._createTopBar(W);

        // ── TÍTULO ────────────────────────────────────────────
        this.add.text(W / 2, getY(100), 'Games', {
            fontSize: `${getY(72)}px`, color: '#4caf50',
            fontStyle: 'bold', fontFamily: 'Arial',
            stroke: '#2e7d32', strokeThickness: 5
        }).setOrigin(0.5).setDepth(5);

        // ── TARJETAS DE JUEGOS ────────────────────────────────
        // determine origin (which scene paused us)
        const origin = this.scene.manager.getScene('YardScene')?.sys.isPaused() ? 'YardScene' : 'GameScene';

        this._createGameCard(getX(370), getY(400), 'icon_bug', 'KILL THE BUGS', () => {
            this.scene.stop('MinigamesMenuScene');
            this.scene.start('BugDefenseScene');
        });

        this._createGameCard(getX(830), getY(400), 'icon_fertilizer', 'CATCH THE\nFERTILIZER', () => {
            this.scene.stop('MinigamesMenuScene');
            this.scene.start('CatchFertilizerScene');
        });

        // ── BOTÓN VOLVER ──────────────────────────────────────
        const backBg = this.add.circle(getX(120), getY(755), getX(45), 0x4db6e8)
            .setStrokeStyle(4, 0x0288d1).setDepth(5).setInteractive({ useHandCursor: true });

        const backArrow = this.add.text(getX(120), getY(755), '←', {
            fontSize: `${getY(32)}px`, color: '#ffffff',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(6);

        backBg.on('pointerdown', () => {
            this.scene.stop('MinigamesMenuScene');
            // resume whoever is paused (prefer YardScene)
            const yard = this.scene.manager.getScene('YardScene');
            if (yard && yard.sys.isPaused()) {
                this.scene.resume('YardScene');
            } else {
                this.scene.resume('GameScene');
            }
        });
        backBg.on('pointerover', () => backBg.setFillStyle(0x29b6f6));
        backBg.on('pointerout',  () => backBg.setFillStyle(0x4db6e8));
    }

    _createTopBar(W) {
        const getX = this._localX; const getY = this._localY;
        const BOX  = getX(90);
        const boxY = getY(90);
        const coins = this.registry.get('coins') || 0;
        const stats = this.registry.get('plantStats') || {};

        // Monedas
        this.add.image(getX(70), getY(75), 'coin').setDisplaySize(getX(65), getY(65)).setDepth(5);
        this.add.text(getX(70), getY(122), `$${coins}`, {
            fontSize: `${getY(24)}px`, color: '#b8860b',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(5);

        // Libreta
        const nbBg = this.add.rectangle(W - getX(70), boxY, BOX, BOX, 0x388e3c)
            .setStrokeStyle(4, 0x1b5e20).setDepth(5).setInteractive({ useHandCursor: true });
        this.add.image(W - getX(70), boxY, 'icon_notebook')
            .setDisplaySize(getX(58), getY(58)).setDepth(6).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                if (!this.notebookPanel) {
                    const { NotebookPanel } = require('../objects/NotebookPanel');
                    this.notebookPanel = new (require('../objects/NotebookPanel').default)(this);
                }
                this.notebookPanel?.show();
            });
        nbBg.on('pointerover', () => nbBg.setAlpha(0.8));
        nbBg.on('pointerout',  () => nbBg.setAlpha(1));
    }

    _createGameCard(x, y, iconKey, label, callback) {
        const getX = this._localX; const getY = this._localY;
        const cardW = getX(300), cardH = getY(300);

        // Sombra
        this.add.rectangle(x + getX(5), y + getY(6), cardW, cardH, 0x000000, 0.2)
            .setDepth(4);

        // Tarjeta con gradiente simulado
        const card = this.add.rectangle(x, y, cardW, cardH, 0xd0eeff, 0.92)
            .setStrokeStyle(5, 0x90caf9).setDepth(5)
            .setInteractive({ useHandCursor: true });

        // Brillo superior
        this.add.rectangle(x, y - cardH / 2 + getY(18), cardW - getX(10), getY(20), 0xffffff, 0.25)
            .setDepth(6);

        // Imagen del juego
        const img = this.add.image(x, y - getY(30), iconKey)
            .setDisplaySize(getX(200), getY(200)).setDepth(7);

        // Etiqueta debajo
        const txt = this.add.text(x, y + cardH / 2 + getY(28), label, {
            fontSize: `${getY(22)}px`, color: '#2e7d32',
            fontStyle: 'bold', fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5).setDepth(7);

        // Hover y click
        card.on('pointerover', () => {
            this.tweens.add({
                targets: [card, img, txt],
                scaleX: 1.05, scaleY: 1.05,
                duration: 100, ease: 'Sine.easeOut'
            });
            card.setFillStyle(0xbbdefb, 0.95);
        });
        card.on('pointerout', () => {
            this.tweens.add({
                targets: [card, img, txt],
                scaleX: 1, scaleY: 1,
                duration: 100, ease: 'Sine.easeOut'
            });
            card.setFillStyle(0xd0eeff, 0.92);
        });
        card.on('pointerdown', () => {
            this.tweens.add({
                targets: [card, img],
                scaleX: 0.96, scaleY: 0.96,
                duration: 60, yoyo: true,
                onComplete: callback
            });
        });
    }
}
