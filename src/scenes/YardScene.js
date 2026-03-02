import Phaser from 'phaser';
import Plant          from '../objects/Plant';
import NotebookPanel  from '../objects/NotebookPanel';

export default class YardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'YardScene' });
        this.plant      = null;
        this.ui         = null;
        this.stats      = null;
        this.deathVideo = null;
    }

    preload() {
        const data = localStorage.getItem('plantaSeleccionada');
        this.plantaData = data ? JSON.parse(data) : {
            key: 'nopal', body: 'assets/plants/nopal_2.png'
        };

        this.load.image('bg_yard',       'public/elements/bg/exterior.png');
        this.load.image('plant_default', this.plantaData.body);

        // UI
        this.load.image('coin',          'assets/ui/coin.png');
        this.load.image('icon_water',    'assets/ui/icon_water.png');
        this.load.image('icon_sun',      'assets/ui/icon_sun.png');
        this.load.image('icon_leaf',     'assets/ui/icon_leaf.png');
        this.load.image('icon_notebook', 'assets/ui/icon_notebook.png');
        this.load.image('icon_door',     'assets/ui/icon_door.png');
        this.load.image('icon_gamepad',  'assets/ui/icon_gamepad.png');
        this.load.image('icon_seeds',    'assets/ui/icon_seeds.png');

        // Macetas
        this.load.image('pot_basic',   'assets/pots/pot_basic.png');
        this.load.image('pot_fancy',   'assets/pots/pot_fancy.png');
        this.load.image('pot_ceramic', 'assets/pots/pot_ceramic.png');

        // Expresiones
        ['eye_normal','eye_happy','eye_sad','eye_surprised','eye_closed'].forEach(k =>
            this.load.image(k, `assets/plants/${k}.png`)
        );
        ['mouth_happy','mouth_sad','mouth_surprised','mouth_sleepy'].forEach(k =>
            this.load.image(k, `assets/plants/${k}.png`)
        );

        // Efectos
        ['blush','heart','water_drop','sun_ray','soil_particle'].forEach(k =>
            this.load.image(k, `assets/effects/${k}.png`)
        );

        // Notebooks
        this.load.image('notebook_cactus',    'assets/notebooks/notebook_cactus.png');
        this.load.image('notebook_snake',     'assets/notebooks/notebook_snake.png');
        this.load.image('notebook_sunflower', 'assets/notebooks/notebook_sunflower.png');

        // Video muerte
        this.load.video('plant_die', [
            'public/animation/plant_die.mp4',
            'public/animation/plant_die.webm'
        ]);
    }

    create() {
        this.stats = this.registry.get('plantStats');

        this.ui    = new YardUIElements(this);
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2 + this.scale.height * 0.06;
        this.plant = new Plant(this, cx, cy, 'plant_default');

        this.scale.on('resize', (gameSize) => {
            if (this.plant) {
                this.plant.setPosition(gameSize.width/2, gameSize.height/2 + gameSize.height*0.06);
            }
        });

        // Incrementar sol al estar en el patio
        this.time.addEvent({
            delay: 5000,
            loop: true,
            callback: () => {
                this.stats.sun = Math.min(100, this.stats.sun + 3);
            }
        });

        this.setupEvents();
        this.startStatsDecay();
    }

    setupEvents() {
        this.events.on('water-plant',    () => this.waterPlant());
        this.events.on('give-sun',       () => this.giveSun());
        this.events.on('change-soil',    () => this.changeSoil());
        this.events.on('plant-petted',   () => this.petPlant());
        this.events.on('die-plant',      () => this.diePlant());
        this.events.on('go-inside',      () => this.scene.start('GameScene'));
        this.events.on('open-minigames', () => {
            this.scene.pause('YardScene');
            this.scene.launch('MinigamesMenuScene');
        });
        this.events.on('reset-plant', () => {
            this.stats.water     = 50;
            this.stats.sun       = 50;
            this.stats.health    = 50;
            this.stats.happiness = 50;
            if (this.plant) this.plant.resetAppearance();
            this.ui.showNotification('¡Plantagochi ha sido reseteado! 🔄');
        });
    }

    waterPlant() {
        if (this.stats.water < 100) {
            this.stats.water     = Math.min(100, this.stats.water + 20);
            this.stats.health    = Math.min(100, this.stats.health + 5);
            this.stats.happiness = Math.min(100, this.stats.happiness + 5);
            this.plant?.showWaterEffect();
            this.ui.showNotification('¡Plantagochi está feliz! 💧');
        } else {
            this.ui.showNotification('¡Ya tiene suficiente agua!');
        }
    }

    giveSun() {
        if (this.stats.sun < 100) {
            this.stats.sun    = Math.min(100, this.stats.sun + 15);
            this.stats.health = Math.min(100, this.stats.health + 3);
            this.plant?.showSunEffect();
            this.ui.showNotification('¡Le encanta el sol! ☀️');
        } else {
            this.ui.showNotification('¡Ya tiene suficiente luz!');
        }
    }

    changeSoil() {
        this.stats.health = Math.min(100, this.stats.health + 10);
        this.stats.growth = Math.min(10,  this.stats.growth + 1);
        this.plant?.changeSoil();
        this.ui.showNotification('¡Fresh grow! 🌱');
    }

    petPlant() {
        this.stats.happiness = Math.min(100, this.stats.happiness + 3);
        this.ui.showNotification('¡A Plantagochi le gusta eso! ❤️');
    }

    diePlant() {
        if (this.stats.health > 0 && !(this.stats.water <= 0 && this.stats.sun <= 0)) return;
        if (this.deathVideo) return;

        this.time.removeAllEvents();
        this.plant?.setVisible(false);

        this.deathVideo = this.add.video(this.scale.width/2, this.scale.height/2, 'plant_die')
            .setOrigin(0.5).setDepth(50);
        this.deathVideo.play();
        this.ui.showNotification('😢 Tu Plantagochi ha muerto...');

        this.deathVideo.on('complete', () => {
            this.deathVideo = null;
            this.scene.restart();
        });
        this.deathVideo.on('error',    () => {
            this.deathVideo = null;
            this.scene.restart();
        });
        this.time.delayedCall(10000,   () => {
            if (this.scene.isActive('YardScene')) {
                this.deathVideo = null;
                this.scene.restart();
            }
        });
    }

    startStatsDecay() {
        this.time.addEvent({
            delay: 3000,
            loop: true,
            callback: () => {
                this.stats.water = Math.max(0, this.stats.water - 1);
                this.stats.sun   = Math.max(0, this.stats.sun   - 0.5);
                this.stats.health = Math.round(
                    (this.stats.water + this.stats.sun + this.stats.happiness) / 3
                );
                if (this.stats.water < 30 || this.stats.sun < 30) {
                    this.stats.happiness = Math.max(0, this.stats.happiness - 1);
                }
                this.diePlant();
            }
        });
    }

    update() {
        this.ui?.update();
        this.plant?.update();
    }
}

// ── UI DEL PATIO ─────────────────────────────────────────────────────────────
class YardUIElements {
    constructor(scene) {
        this.scene     = scene;
        this.stats     = scene.registry.get('plantStats');
        this.coins     = scene.registry.get('coins') || 0;
        this.statBoxes = {};

        this.baseWidth  = 1200;
        this.baseHeight = 800;
        this.width  = scene.scale.width;
        this.height = scene.scale.height;

        scene.scale.on('resize', this.onResize, this);

        this.createBackground();
        this.createCoins();
        this.createTopIcons();
        this.createHealthBar();
        this.createSideButtons();
        this.createStatsPanel();
        this.createNotification();

        this.notebookPanel = new NotebookPanel(scene);
    }

    getX(orig) { return orig * (this.width / this.baseWidth); }
    getY(orig) { return orig * (this.height / this.baseHeight); }

    mark(obj) { obj.isUI = true; return obj; }

    onResize(gameSize) {
        this.width  = gameSize.width;
        this.height = gameSize.height;
        this.scene.children.list.filter(c => c.isUI).forEach(c => c.destroy());
        this.statBoxes = {};
        this.createBackground();
        this.createCoins();
        this.createTopIcons();
        this.createHealthBar();
        this.createSideButtons();
        this.createStatsPanel();
        this.createNotification();
    }

    createBackground() {
        const bg = this.scene.add.image(this.width/2, this.height/2, 'bg_yard')
            .setDisplaySize(this.width, this.height).setDepth(0);
        this.mark(bg);
    }

    createCoins() {
        const x = this.getX(70);
        const y = this.getY(75);
        const coinImg = this.scene.add.image(x, y, 'coin')
            .setDisplaySize(this.getX(65), this.getY(65)).setDepth(5);
        this.mark(coinImg);

        this.coinText = this.scene.add.text(x, this.getY(122), `$${this.coins}`, {
            fontSize: '24px', color: '#b8860b',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(5);
        this.mark(this.coinText);
    }

    createTopIcons() {
        const centerX = this.width / 2;
        const iconSpacing = this.getX(130);
        const icons = [
            { key: 'icon_water', x: centerX - iconSpacing, fillColor: 0x29b6f6, darkColor: 0x0277bd, stat: 'water',     label: 'Agua'      },
            { key: 'icon_sun',   x: centerX,                fillColor: 0xfdd835, darkColor: 0xf9a825, stat: 'sun',       label: 'Sol'       },
            { key: 'icon_leaf',  x: centerX + iconSpacing, fillColor: 0x66bb6a, darkColor: 0x388e3c, stat: 'happiness', label: 'Felicidad' },
        ];

        const BOX       = this.getX(108);
        const boxY      = this.getY(108);
        const barW      = BOX - this.getX(16);
        const barH      = BOX - this.getY(16);
        const barTop    = boxY - barH / 2;
        const barBottom = boxY + barH / 2;

        icons.forEach(({ key, x, fillColor, darkColor, stat, label }) => {
            const rect1 = this.scene.add.rectangle(x + this.getX(3), boxY + this.getY(5), BOX, BOX, 0x000000, 0.2).setDepth(4);
            this.mark(rect1);

            const box = this.scene.add.rectangle(x, boxY, BOX, BOX, 0x388e3c)
                .setStrokeStyle(5, 0x1b5e20).setDepth(5);
            this.mark(box);

            const rect2 = this.scene.add.rectangle(x, boxY, barW, barH, darkColor, 0.4).setDepth(6);
            this.mark(rect2);

            const gfx = this.scene.add.graphics().setDepth(7);
            this.mark(gfx);

            const rect3 = this.scene.add.rectangle(x, boxY - BOX / 2 + this.getY(10), barW, this.getY(8), 0xffffff, 0.15).setDepth(8);
            this.mark(rect3);

            const img = this.scene.add.image(x, boxY - this.getY(8), key)
                .setDisplaySize(this.getX(54), this.getY(54)).setTint(0xffffff).setDepth(9);
            this.mark(img);

            const pct = this.scene.add.text(x, boxY + BOX / 2 - this.getY(14), '0%', {
                fontSize: '13px', color: '#ffffff',
                fontStyle: 'bold', fontFamily: 'Arial',
                stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(10);
            this.mark(pct);

            const tooltip = this.scene.add.text(x, boxY - BOX / 2 - this.getY(18), label, {
                fontSize: '12px', color: '#ffffff',
                backgroundColor: '#00000099',
                padding: { x: 6, y: 3 }, fontFamily: 'Arial'
            }).setOrigin(0.5).setDepth(15).setVisible(false);
            this.mark(tooltip);

            const zone = this.scene.add.zone(x, boxY, BOX, BOX)
                .setInteractive({ useHandCursor: false }).setDepth(11);
            this.mark(zone);

            zone.on('pointerover', () => { tooltip.setVisible(true);  box.setAlpha(0.85); });
            zone.on('pointerout',  () => { tooltip.setVisible(false); box.setAlpha(1);    });

            this.statBoxes[stat] = { gfx, pct, barW, barH, barTop, barBottom, fillColor, x };
        });

        // Libreta
        const nbBg = this.scene.add.rectangle(this.width - this.getX(70), boxY, BOX, BOX, 0x388e3c)
            .setStrokeStyle(5, 0x1b5e20).setDepth(5);
        this.mark(nbBg);
        const nbRect = this.scene.add.rectangle(this.width - this.getX(70), boxY - BOX / 2 + this.getY(10), BOX - this.getX(16), this.getY(8), 0xffffff, 0.15).setDepth(8);
        this.mark(nbRect);

        const nb = this.scene.add.image(this.width - this.getX(70), boxY, 'icon_notebook')
            .setDisplaySize(this.getX(65), this.getY(65)).setDepth(6)
            .setInteractive({ useHandCursor: true });
        this.mark(nb);

        nb.on('pointerdown', () => {
            this.notebookPanel.show();
            this.scene.tweens.add({
                targets: [nbBg, nb],
                scaleX: 0.92, scaleY: 0.92,
                duration: 80, yoyo: true
            });
        });
        nb.on('pointerover', () => nbBg.setAlpha(0.8));
        nb.on('pointerout',  () => nbBg.setAlpha(1));
    }

    createHealthBar() {
        const barX = this.width / 2;
        const barY = this.getY(235);
        const barW = this.getX(520);
        const barH = this.getY(26);

        const bg = this.scene.add.rectangle(barX, barY, barW, barH, 0x333333)
            .setStrokeStyle(2, 0x111111).setDepth(5);
        this.mark(bg);

        this.healthBar = this.scene.add.rectangle(barX - barW/2 + this.getX(2), barY, 1, barH - this.getY(4), 0x66bb6a)
            .setOrigin(0, 0.5).setDepth(6);
        this.mark(this.healthBar);

        const overlay = this.scene.add.rectangle(barX, barY - this.getY(6), barW - this.getX(4), this.getY(6), 0xffffff, 0.1).setDepth(7);
        this.mark(overlay);

        this.healthText = this.scene.add.text(barX, barY, '100%', {
            fontSize: '13px', color: '#ffffff',
            fontStyle: 'bold', fontFamily: 'Arial',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(7);
        this.mark(this.healthText);

        this.updateHealthBar();
    }

    updateHealthBar() {
        const { health } = this.scene.registry.get('plantStats');
        const color =
            health < 30 ? 0xe53935 :
            health < 60 ? 0xffa726 : 0x66bb6a;

        this.healthBar.setFillStyle(color);
        this.scene.tweens.add({
            targets: this.healthBar,
            width: (health / 100) * 516,
            duration: 400, ease: 'Sine.easeOut'
        });
        this.healthText?.setText(`${Math.round(health)}%`);
    }

    updateStatBoxes() {
        const stats = this.scene.registry.get('plantStats');
        if (!stats || !this.statBoxes) return;

        Object.entries(this.statBoxes).forEach(([stat, data]) => {
            const { gfx, pct, barW, barH, barTop, barBottom, fillColor, x } = data;
            const value  = Phaser.Math.Clamp(stats[stat] ?? 0, 0, 100);
            const fillH  = Math.max((value / 100) * barH, 2);
            const color  =
                value < 30 ? 0xe53935 :
                value < 60 ? 0xffa726 : fillColor;

            gfx.clear();
            gfx.fillStyle(color, 1);
            gfx.fillRect(x - barW / 2, barBottom - fillH, barW, fillH);

            pct.setText(`${Math.round(value)}%`);
        });
    }

    createSideButtons() {
        this.makeSideBtn(130,  430, 'icon_door',    'Interior',   () => this.scene.events.emit('go-inside'));
        this.makeSideBtn(130,  640, 'icon_gamepad', 'Minijuegos', () => this.scene.events.emit('open-minigames'));
        this.makeSideBtn(1070, 640, 'icon_seeds',   'Tierra',     () => this.scene.events.emit('change-soil'));
    }

    makeSideBtn(x, y, key, label, callback) {
        const size = 130;

        const bg = this.scene.add.rectangle(x, y, size, size, 0xd0eeff, 0.9)
            .setStrokeStyle(3, 0x90caf9).setDepth(5);

        this.scene.add.rectangle(x + 3, y + 4, size, size, 0x000000, 0.15).setDepth(4);

        const icon = this.scene.add.image(x, y - 8, key)
            .setDisplaySize(size * 0.58, size * 0.58)
            .setDepth(6).setInteractive({ useHandCursor: true });

        this.scene.add.text(x, y + size * 0.28, label, {
            fontSize: '12px', color: '#1565c0',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(6);

        icon.on('pointerdown', () => {
            callback();
            this.scene.tweens.add({
                targets: [bg, icon],
                scaleX: 0.96, scaleY: 0.96,
                duration: 60, yoyo: true
            });
        });
        icon.on('pointerover', () => bg.setFillStyle(0xa8d8ff, 0.95));
        icon.on('pointerout',  () => bg.setFillStyle(0xd0eeff, 0.9));
    }

    createStatsPanel() {
        const panelX = this.getX(860);
        const panelY = this.getY(410);
        this.statsPanel = this.scene.add.container(panelX, panelY).setDepth(25).setVisible(false);

        const shadow = this.scene.add.rectangle(6, 6, 320, 290, 0x000000, 0.3);
        const bg     = this.scene.add.rectangle(0, 0, 320, 290, 0xf1f8e9, 0.97)
            .setStrokeStyle(4, 0x388e3c);
        const title  = this.scene.add.text(0, -118, '🌿 PLANT STATS', {
            fontSize: '19px', color: '#2e7d32',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5);
        const line   = this.scene.add.rectangle(0, -98, 280, 2, 0x388e3c, 0.4);

        const textStyle = { fontSize: '15px', color: '#2d2d2d', fontFamily: 'Arial' };
        this.sPanelTexts = {
            water:     this.scene.add.text(-140, -78, '', textStyle),
            sun:       this.scene.add.text(-140, -45, '', textStyle),
            happiness: this.scene.add.text(-140, -12, '', textStyle),
            growth:    this.scene.add.text(-140,  22, '', textStyle),
            health:    this.scene.add.text(-140,  55, '', textStyle),
        };

        const closeBtn = this.scene.add.text(130, -118, '✕', {
            fontSize: '18px', color: '#e53935',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => this.statsPanel.setVisible(false));
        closeBtn.on('pointerover', () => closeBtn.setColor('#ff1744'));
        closeBtn.on('pointerout',  () => closeBtn.setColor('#e53935'));

        this.statsPanel.add([
            shadow, bg, title, line, closeBtn,
            ...Object.values(this.sPanelTexts)
        ]);

        this.updateStatsPanel();
    }

    updateStatsPanel() {
        const s = this.scene.registry.get('plantStats');
        if (!s) return;
        this.sPanelTexts.water.setText(`💧 Agua:        ${Math.round(s.water)}%`);
        this.sPanelTexts.sun.setText(`☀️  Sol:         ${Math.round(s.sun)}%`);
        this.sPanelTexts.happiness.setText(`❤️  Felicidad:   ${Math.round(s.happiness)}%`);
        this.sPanelTexts.growth.setText(`🌱 Crecimiento: Lv ${s.growth}`);
        this.sPanelTexts.health.setText(`🩺 Salud:       ${Math.round(s.health)}%`);
    }

    toggleStats() {
        this.statsPanel.setVisible(!this.statsPanel.visible);
        if (this.statsPanel.visible) this.updateStatsPanel();
    }

    createNotification() {
        const x = this.width / 2;
        const y = this.getY(255);
        this.notification = this.scene.add.text(x, y, '', {
            fontSize: '18px', color: '#ffffff',
            backgroundColor: '#1b5e20dd',
            padding: { x: this.getX(18), y: this.getY(9) }, fontFamily: 'Arial',
            stroke: '#000', strokeThickness: 1
        }).setOrigin(0.5).setAlpha(0).setVisible(false).setDepth(30);
        this.mark(this.notification);
    }

    showNotification(message) {
        this.notification.setText(message).setVisible(true).setAlpha(0).setY(265);
        this.scene.tweens.add({
            targets: this.notification, alpha: 1, y: 255, duration: 180,
            onComplete: () => {
                this.scene.time.delayedCall(2200, () => {
                    this.scene.tweens.add({
                        targets: this.notification, alpha: 0, y: 245, duration: 220,
                        onComplete: () => this.notification.setVisible(false)
                    });
                });
            }
        });
    }

    update() {
        const registryCoins = this.scene.registry.get('coins') || 0;
        if (registryCoins !== this.coins) {
            this.coins = registryCoins;
            this.coinText.setText(`$${this.coins}`);
        }
        this.updateHealthBar();
        this.updateStatBoxes();
        if (this.statsPanel.visible) this.updateStatsPanel();
    }
}
