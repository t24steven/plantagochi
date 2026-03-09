import Phaser from 'phaser';
import Plant         from '../objects/Plant.js';
import NotebookPanel from '../objects/NotebookPanel.js';

// ── UI DEL PATIO ──────────────────────────────────────────────────────────────
class YardUIElements {
    constructor(scene) {
        this.scene  = scene;
        this.coins  = scene.registry.get('coins') || 0;

        this.baseWidth  = 1200;
        this.baseHeight = 800;
        this.width  = scene.scale.width;
        this.height = scene.scale.height;

        scene.scale.on('resize', this.onResize, this);

        this.createBackground();
        this.createCoins();
        this.createSeedsBar();
        this.createStatsLeft();
        this.createRightButtons();
        this.createLeftButtons();
        this.createNotebookBtn();
        this.createNotification();

        this.notebookPanel = new NotebookPanel(scene);
    }

    getX(orig) { return orig * (this.width  / this.baseWidth);  }
    getY(orig) { return orig * (this.height / this.baseHeight); }
    mark(obj)  { obj.isUI = true; return obj; }

    onResize(gameSize) {
        this.width  = gameSize.width;
        this.height = gameSize.height;
        this.scene.children.list.filter(c => c.isUI).forEach(c => c.destroy());
        this.createBackground();
        this.createCoins();
        this.createSeedsBar();
        this.createStatsLeft();
        this.createRightButtons();
        this.createLeftButtons();
        this.createNotebookBtn();
        this.createNotification();
    }

    createBackground() {
        const bg = this.scene.add.image(this.width / 2, this.height / 2, 'bg_yard')
            .setDisplaySize(this.width, this.height).setDepth(0);
        this.mark(bg);
    }

    // ── COINS (top-left) ──────────────────────────────────────────────────
    createCoins() {
        const barW = this.getX(260);
        const barH = this.getY(68);
        const x    = this.getX(155);
        const y    = this.getY(72);

        const bar = this.scene.add.image(x, y, 'status_bar')
            .setDisplaySize(barW, barH).setDepth(5);
        this.mark(bar);

        const coinIcon = this.scene.add.image(x - barW * 0.36, y, 'coin')
            .setDisplaySize(this.getX(46), this.getY(46)).setDepth(6);
        this.mark(coinIcon);

        this.coinText = this.scene.add.text(x + barW * 0.05, y, `${this.coins}`, {
            fontSize: '20px', color: '#7a5200',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(6);
        this.mark(this.coinText);
    }

    // ── SEEDS BAR (top-center) ────────────────────────────────────────────
    createSeedsBar() {
        const barW = this.getX(280);
        const barH = this.getY(68);
        const x    = this.width / 2 - this.getX(20);
        const y    = this.getY(72);

        const bar = this.scene.add.image(x, y, 'status_bar')
            .setDisplaySize(barW, barH).setDepth(5);
        this.mark(bar);

        const seedIcon = this.scene.add.image(x - barW * 0.36, y, 'icon_seeds')
            .setDisplaySize(this.getX(46), this.getY(46)).setDepth(6);
        this.mark(seedIcon);
    }

    // ── STATS IZQUIERDA (agua, sol, felicidad) ────────────────────────────
    createStatsLeft() {
        const barW  = this.getX(310);
        const barH  = this.getY(64);
        const iconS = this.getX(50);
        const x     = this.getX(205);

        const stats = [
            { key: 'icon_water', stat: 'water',     fillColor: 0x29b6f6, y: this.getY(220) },
            { key: 'icon_sun',   stat: 'sun',        fillColor: 0xfdd835, y: this.getY(305) },
            { key: 'icon_leaf',  stat: 'happiness',  fillColor: 0x66bb6a, y: this.getY(390) },
        ];

        this.statBars = {};

        stats.forEach(({ key, stat, fillColor, y }) => {
            const barBg = this.scene.add.image(x, y, 'status_bar')
                .setDisplaySize(barW, barH).setDepth(5);
            this.mark(barBg);

            const fillMaxW = barW * 0.55;
            const fillX    = x + barW * 0.08;

            const fillBg = this.scene.add.rectangle(fillX, y, fillMaxW, barH * 0.36, 0xcccccc, 0.5)
                .setOrigin(0, 0.5).setDepth(6);
            this.mark(fillBg);

            const fill = this.scene.add.rectangle(fillX, y, fillMaxW, barH * 0.36, fillColor)
                .setOrigin(0, 0.5).setDepth(7);
            this.mark(fill);

            const icon = this.scene.add.image(x - barW * 0.39, y, key)
                .setDisplaySize(iconS, iconS).setDepth(8);
            this.mark(icon);

            const pct = this.scene.add.text(x + barW * 0.40, y, '0%', {
                fontSize: '13px', color: '#555555',
                fontStyle: 'bold', fontFamily: 'Arial'
            }).setOrigin(0.5).setDepth(8);
            this.mark(pct);

            this.statBars[stat] = { fill, pct, fillMaxW, fillColor };
        });
    }

    // ── BOTONES DERECHA (seeds/tierra, door) ──────────────────────────────
    createRightButtons() {
        const rx = this.width - this.getX(70);
        this.makeIconBtn(rx, this.getY(650), 'icon_seeds', 'change-soil', false);
        this.makeIconBtn(rx, this.getY(770), 'icon_door',  'go-inside',   false);
    }

    // ── BOTÓN IZQUIERDA (gamepad) ─────────────────────────────────────────
    createLeftButtons() {
        this.makeIconBtn(this.getX(70), this.getY(770), 'icon_gamepad', 'open-minigames', true);
    }

    makeIconBtn(x, y, iconKey, event, isGreen) {
        const size = this.getX(100);

        let bg;
        if (isGreen) {
            bg = this.scene.add.rectangle(x, y, size, size, 0x5cb85c)
                .setStrokeStyle(3, 0x3a7a3a).setDepth(5);
        } else {
            bg = this.scene.add.image(x, y, 'status_bar')
                .setDisplaySize(size, size).setDepth(5);
        }
        this.mark(bg);

        const icon = this.scene.add.image(x, y, iconKey)
            .setDisplaySize(size * 0.60, size * 0.60)
            .setDepth(6).setInteractive({ useHandCursor: true });
        this.mark(icon);

        icon.on('pointerdown', () => {
            this.scene.events.emit(event);
            this.scene.tweens.add({ targets: [bg, icon], scaleX: 0.90, scaleY: 0.90, duration: 70, yoyo: true });
        });
        icon.on('pointerover', () => icon.setTint(0xdddddd));
        icon.on('pointerout',  () => icon.clearTint());
    }

    // ── LIBRETA (top-right) ───────────────────────────────────────────────
    createNotebookBtn() {
        const size = this.getX(100);
        const x    = this.width - this.getX(70);
        const y    = this.getY(72);

        const bg = this.scene.add.image(x, y, 'status_bar')
            .setDisplaySize(size, size).setDepth(5);
        this.mark(bg);

        const nb = this.scene.add.image(x, y, 'icon_notebook')
            .setDisplaySize(size * 0.65, size * 0.65)
            .setDepth(6).setInteractive({ useHandCursor: true });
        this.mark(nb);

        nb.on('pointerdown', () => {
            this.notebookPanel.show();
            this.scene.tweens.add({ targets: [bg, nb], scaleX: 0.90, scaleY: 0.90, duration: 70, yoyo: true });
        });
        nb.on('pointerover', () => nb.setTint(0xdddddd));
        nb.on('pointerout',  () => nb.clearTint());
    }

    // ── NOTIFICACIÓN ──────────────────────────────────────────────────────
    createNotification() {
        const x = this.width / 2;
        const y = this.getY(255);
        this.notification = this.scene.add.text(x, y, '', {
            fontSize: '18px', color: '#ffffff',
            backgroundColor: '#1b5e20dd',
            padding: { x: this.getX(18), y: this.getY(9) },
            fontFamily: 'Arial',
            stroke: '#000', strokeThickness: 1
        }).setOrigin(0.5).setAlpha(0).setVisible(false).setDepth(30);
        this.mark(this.notification);
    }

    showNotification(message) {
        this.notification.setText(message).setVisible(true).setAlpha(0).setY(this.getY(265));
        this.scene.tweens.add({
            targets: this.notification, alpha: 1, y: this.getY(255), duration: 180,
            onComplete: () => {
                this.scene.time.delayedCall(2200, () => {
                    this.scene.tweens.add({
                        targets: this.notification, alpha: 0, y: this.getY(245), duration: 220,
                        onComplete: () => this.notification.setVisible(false)
                    });
                });
            }
        });
    }

    // ── UPDATE ────────────────────────────────────────────────────────────
    update() {
        const registryCoins = this.scene.registry.get('coins') || 0;
        if (registryCoins !== this.coins) {
            this.coins = registryCoins;
            this.coinText?.setText(`${this.coins}`);
        }

        const stats = this.scene.registry.get('plantStats');
        if (!stats || !this.statBars) return;

        Object.entries(this.statBars).forEach(([stat, data]) => {
            const { fill, pct, fillMaxW, fillColor } = data;
            const value = Phaser.Math.Clamp(stats[stat] || 0, 0, 100);
            const color = value < 30 ? 0xe53935 : value < 60 ? 0xffa726 : fillColor;

            fill.setFillStyle(color);
            this.scene.tweens.add({
                targets: fill,
                width: (value / 100) * fillMaxW,
                duration: 400, ease: 'Sine.easeOut'
            });
            pct.setText(`${Math.round(value)}%`);
        });
    }
}

// ── ESCENA ────────────────────────────────────────────────────────────────────
export default class YardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'YardScene' });
        this.plant = null;
        this.ui    = null;
    }

    init() {
        // Limpia textura previa por si viene de otra planta
        if (this.textures.exists('plant_yard')) {
            this.textures.remove('plant_yard');
        }
    }

    preload() {
        this.load.image('bg_yard',       '/elements/bg/exterior.png');
        this.load.image('status_bar',    '/assets/ui/status_bar.png');
        this.load.image('coin',          '/assets/ui/coin.png');
        this.load.image('icon_water',    '/assets/ui/water_bar.png');
        this.load.image('icon_sun',      '/assets/ui/sun_bar.png');
        this.load.image('icon_leaf',     '/assets/ui/fer_bar.png');
        this.load.image('icon_notebook', '/assets/ui/icon_notebook.png');
        this.load.image('icon_seeds',    '/assets/ui/icon_seeds.png');
        this.load.image('icon_door',     '/assets/ui/icon_door.png');
        this.load.image('icon_gamepad',  '/assets/ui/icon_gamepad.png');

        // Macetas
        this.load.image('pot_basic',   '/assets/pots/pot_basic.png');
        this.load.image('pot_fancy',   '/assets/pots/pot_fancy.png');
        this.load.image('pot_ceramic', '/assets/pots/pot_ceramic.png');
        this.load.image('pot_1',       '/assets/pots/pot_1.png');
        this.load.image('pot_2',       '/assets/pots/pot_2.png');
        this.load.image('pot_3',       '/assets/pots/pot_3.png');
        this.load.image('pot_4',       '/assets/pots/pot_4.png');

        // Cara
        this.load.image('face_happy',     '/assets/plants/face_happy.png');
        this.load.image('face_sad',       '/assets/plants/face_sad.png');
        this.load.image('face_surprised', '/assets/plants/face_surprised.png');
        this.load.image('face_sleepy',    '/assets/plants/face_sleepy.png');
        this.load.image('face_normal',    '/assets/plants/face_normal.png');

        // Efectos
        this.load.image('heart',         '/assets/effects/heart.png');
        this.load.image('water_drop',    '/assets/effects/water_drop.png');
        this.load.image('sun_ray',       '/assets/effects/sun_ray.png');
        this.load.image('soil_particle', '/assets/effects/soil_particle.png');

        // Sombreros
        this.load.image('hat_1', '/assets/hats/hat_1.png');
        this.load.image('hat_2', '/assets/hats/hat_2.png');
        this.load.image('hat_3', '/assets/hats/hat_3.png');

        // Notebooks
        this.load.image('notebook_cactus',    '/assets/notebooks/notebook_cactus.png');
        this.load.image('notebook_snake',     '/assets/notebooks/notebook_snake.png');
        this.load.image('notebook_sunflower', '/assets/notebooks/notebook_sunflower.png');

        // Planta seleccionada
        const data = localStorage.getItem('plantaSeleccionada');
        this.plantaData = data ? JSON.parse(data) : {
            key: 'plant1',
            body:     '/assets/plants/plantsC/plant1.png',
            bodyGame: '/assets/plants/plantsC/plant1.png'
        };
        this.load.image('plant_yard', this.plantaData.bodyGame || this.plantaData.body);
    }

    create() {
        if (!this.registry.get('ownedItems'))    this.registry.set('ownedItems', {});
        if (!this.registry.get('equippedItems')) this.registry.set('equippedItems', {});

        this.ui = new YardUIElements(this);

        // Planta con clase Plant (igual que GameScene)
        const cx = this.scale.width  / 2;
        const cy = this.scale.height / 2 + this.scale.height * 0.06;
        this.plant = new Plant(this, cx, cy, 'plant_yard');

        // Aplica items equipados
        const equipped = this.registry.get('equippedItems') || {};
        if (Object.keys(equipped).length) this.plant.applyEquipment(equipped);

        this.scale.on('resize', (gameSize) => {
            if (this.plant) {
                this.plant.setPosition(
                    gameSize.width  / 2,
                    gameSize.height / 2 + gameSize.height * 0.06
                );
            }
        });

        this.setupEvents();

        // Sol extra por estar en el patio
        this.time.addEvent({
            delay: 5000, loop: true,
            callback: () => {
                const stats = this.registry.get('plantStats');
                if (stats) stats.sun = Math.min(100, stats.sun + 3);
            }
        });
    }

    setupEvents() {
        this.events.on('change-soil', () => {
            const stats = this.registry.get('plantStats');
            if (stats) {
                stats.health = Math.min(100, stats.health + 10);
                stats.growth = Math.min(10,  (stats.growth || 0) + 1);
            }
            this.plant?.changeSoil();
            this.ui.showNotification('¡Tierra nueva! 🌱');
        });

        this.events.on('go-inside', () => this.scene.start('GameScene'));

        this.events.on('open-minigames', () => {
            this.scene.pause('YardScene');
            this.scene.launch('MinigamesMenuScene');
        });

        this.events.on('plant-petted', () => {
            const stats = this.registry.get('plantStats');
            if (stats) stats.happiness = Math.min(100, stats.happiness + 3);
            this.ui.showNotification('¡A Plantagochi le gusta eso! ❤️');
        });

        this.events.on('equip-changed', (equipped) => {
            this.plant?.applyEquipment(equipped);
        });
    }

    update() {
        this.ui?.update();
        this.plant?.update();
    }
}
