import Phaser from 'phaser';
import StorePanel    from './StorePanel';
import WardrobePanel from './WardrobePanel';
import NotebookPanel from './NotebookPanel';


export default class UIElements {
    constructor(scene) {
        this.scene     = scene;
        this.stats     = scene.registry.get('plantStats');
        this.coins     = scene.registry.get('coins') || 0;
        this.statBoxes = {};

        // Reference design size used for the original coordinates
        this.baseWidth  = 1200;
        this.baseHeight = 800;
        this.width  = scene.scale.width;
        this.height = scene.scale.height;

        // Rebuild on resize
        scene.scale.on('resize', this.onResize, this);

        this.createBackground();
        this.createCoins();
        this.createTopIcons();
        this.createHealthBar();
        this.createSideButtons();
        this.createStatsPanel();
        this.createNotification();

        // Paneles overlay — van AL FINAL del constructor
        this.storePanel    = new StorePanel(scene);
        this.wardrobePanel = new WardrobePanel(scene);
        this.notebookPanel = new NotebookPanel(scene);
    }

    getX(origX) {
        return origX * (this.width / this.baseWidth);
    }
    getY(origY) {
        return origY * (this.height / this.baseHeight);
    }

    mark(obj) {
        obj.isUI = true;
        return obj;
    }

    onResize(gameSize) {
        this.width  = gameSize.width;
        this.height = gameSize.height;
        // destroy existing UI objects (not panels)
        this.scene.children.list.filter(c => c.isUI).forEach(c => c.destroy());
        this.statBoxes = {};
        // recreate
        this.createBackground();
        this.createCoins();
        this.createTopIcons();
        this.createHealthBar();
        this.createSideButtons();
        this.createStatsPanel();
        this.createNotification();
    }

    // ── FONDO ────────────────────────────────────────────────
    createBackground() {
        const bg = this.scene.add.image(this.width/2, this.height/2, 'bg')
            .setDisplaySize(this.width, this.height)
            .setDepth(0);
        this.mark(bg);
    }

    // ── MONEDAS ──────────────────────────────────────────────
    createCoins() {
        const x = this.getX(70);
        const y = this.getY(75);
        const coinImg = this.scene.add.image(x, y, 'coin')
            .setDisplaySize(this.getX(65), this.getY(65))
            .setDepth(5);
        this.mark(coinImg);

        this.coinText = this.scene.add.text(x, this.getY(122), `$${this.coins}`, {
            fontSize: '24px', color: '#b8860b',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(5);
        this.mark(this.coinText);
    }

    updateCoins(amount) {
        this.coins += amount;
        this.scene.registry.set('coins', this.coins);
        this.coinText.setText(`$${this.coins}`);
        this.scene.tweens.add({
            targets: this.coinText,
            scaleX: 1.3, scaleY: 1.3,
            duration: 120, yoyo: true
        });
    }

    // ── ÍCONOS SUPERIORES ESTILO POU ─────────────────────────
    createTopIcons() {
        // calcular posiciones relativas cada vez
        const centerX = this.width / 2;
        const iconSpacing = this.getX(150);
        const icons = [
            { key: 'icon_water', x: centerX - iconSpacing, fillColor: 0x29b6f6, darkColor: 0x0277bd, stat: 'water',     label: 'Agua'      },
            { key: 'icon_sun',   x: centerX,               fillColor: 0xfdd835, darkColor: 0xf9a825, stat: 'sun',       label: 'Sol'       },
            { key: 'icon_leaf',  x: centerX + iconSpacing, fillColor: 0x66bb6a, darkColor: 0x388e3c, stat: 'happiness', label: 'Felicidad' },
        ];

        const BOX   = this.getX(108);
        const boxY  = this.getY(108);
        const barW  = BOX - this.getX(16);
        const barH  = BOX - this.getY(16);
        const barTop    = boxY - barH / 2;
        const barBottom = boxY + barH / 2;

        icons.forEach(({ key, x, fillColor, darkColor, stat, label }) => {
            const rect1 = this.scene.add.rectangle(x + this.getX(3), boxY + this.getY(5), BOX, BOX, 0x000000, 0.2)
                .setDepth(4);
            this.mark(rect1);

            const box = this.scene.add.rectangle(x, boxY, BOX, BOX, 0x388e3c)
                .setStrokeStyle(5, 0x1b5e20)
                .setDepth(5);
            this.mark(box);

            const rect2 = this.scene.add.rectangle(x, boxY, barW, barH, darkColor, 0.4)
                .setDepth(6);
            this.mark(rect2);

            // Graphics para relleno que sube desde la base
            const gfx = this.scene.add.graphics().setDepth(7);
            this.mark(gfx);

            const rect3 = this.scene.add.rectangle(x, boxY - BOX / 2 + this.getY(10), barW, this.getY(8), 0xffffff, 0.15)
                .setDepth(8);
            this.mark(rect3);

            const img = this.scene.add.image(x, boxY - this.getY(8), key)
                .setDisplaySize(this.getX(54), this.getY(54))
                .setTint(0xffffff)
                .setDepth(9);
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
                .setInteractive({ useHandCursor: false })
                .setDepth(11);
            this.mark(zone);

            zone.on('pointerover', () => { tooltip.setVisible(true);  box.setAlpha(0.85); });
            zone.on('pointerout',  () => { tooltip.setVisible(false); box.setAlpha(1);    });

            this.statBoxes[stat] = { gfx, pct, barW, barH, barTop, barBottom, fillColor, x };
        });

        // Libreta
        const nbBg = this.scene.add.rectangle(this.width - this.getX(170), boxY, BOX, BOX, 0x388e3c)
            .setStrokeStyle(5, 0x1b5e20)
            .setDepth(5);
        this.mark(nbBg);

        const nbRect = this.scene.add.rectangle(this.width - this.getX(170), boxY - BOX / 2 + this.getY(10), BOX - this.getX(16), this.getY(8), 0xffffff, 0.15)
            .setDepth(8);
        this.mark(nbRect);

        const nb = this.scene.add.image(this.width - this.getX(170), boxY, 'icon_notebook')
            .setDisplaySize(this.getX(65), this.getY(65))
            .setDepth(6)
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
    }
    // ── BARRA DE SALUD ───────────────────────────────────────
    createHealthBar() {
        const barX = this.width / 2;
        const barY = this.getY(235);
        const barW = this.getX(820);
        const barH = this.getY(30);

        const bg = this.scene.add.rectangle(barX, barY, barW, barH, 0x333333)
            .setStrokeStyle(2, 0x111111)
            .setDepth(5);
        this.mark(bg);

        this.healthBar = this.scene.add.rectangle(barX - barW / 2 + this.getX(2), barY, 1, barH - this.getY(4), 0x66bb6a)
            .setOrigin(0, 0.5)
            .setDepth(6);
        this.mark(this.healthBar);

        const overlay = this.scene.add.rectangle(barX, barY - this.getY(6), barW - this.getX(4), this.getY(6), 0xffffff, 0.1)
            .setDepth(7);
        this.mark(overlay);

        this.healthText = this.scene.add.text(barX, barY, '100%', {
            fontSize: '13px', color: '#ffffff',
            fontStyle: 'bold', fontFamily: 'Arial',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(7);
        this.mark(this.healthText);

        // Store max width for smooth updates
        this.healthBarMaxWidth = barW - this.getX(4);

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
            width: Math.max(2, (health / 100) * (this.healthBarMaxWidth || 516)),
            duration: 400, ease: 'Sine.easeOut'
        });
        this.healthText?.setText(`${Math.round(health)}%`);
    }

    // ── ACTUALIZAR RECUADROS DE STAT ─────────────────────────
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
            gfx.fillRect(
                x - barW / 2,      // x izquierda absoluta
                barBottom - fillH, // y desde arriba (sube desde la base)
                barW,
                fillH
            );

            pct.setText(`${Math.round(value)}%`);
        });
    }

    // ── BOTONES LATERALES ────────────────────────────────────
    createSideButtons() {
        const leftX  = this.getX(130);
        const rightX = this.width - this.getX(250);
        const y1      = this.getY(430);
        const y2      = this.getY(640);
        this.makeSideBtn(leftX,  y1, 'icon_door',     'Patio',   () => this.scene.scene.start('YardScene'));
        this.makeSideBtn(leftX,  y2, 'icon_watering', 'Regar',   () => this.scene.events.emit('water-plant'));
        this.makeSideBtn(rightX, y1, 'icon_cabinet',  'Armario', () => this.wardrobePanel.show());
        this.makeSideBtn(rightX, y2, 'icon_bag',      'Tienda',  () => this.storePanel.show());
    }

    makeSideBtn(x, y, key, tooltipText, callback) {
        const size = this.getX(130);

        const bg = this.scene.add.rectangle(x, y, size, size, 0xd0eeff, 0.9)
            .setStrokeStyle(3, 0x90caf9)
            .setDepth(5);
        this.mark(bg);

        const shadow = this.scene.add.rectangle(x + this.getX(3), y + this.getY(4), size, size, 0x000000, 0.15)
            .setDepth(4);
        this.mark(shadow);

        const icon = this.scene.add.image(x, y - this.getY(8), key)
            .setDisplaySize(size * 0.58, size * 0.58)
            .setDepth(6)
            .setInteractive({ useHandCursor: true });
        this.mark(icon);

        const tip = this.scene.add.text(x, y + size * 0.28, tooltipText, {
            fontSize: '12px', color: '#1565c0',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(6);
        this.mark(tip);

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

    // ── PANEL DE STATS ───────────────────────────────────────
    createStatsPanel() {
        const panelX = this.getX(860);
        const panelY = this.getY(410);
        this.statsPanel = this.scene.add.container(panelX, panelY).setDepth(25).setVisible(false);

        const shadow = this.scene.add.rectangle(this.getX(6), this.getY(6), this.getX(320), this.getY(290), 0x000000, 0.3);
        const bg     = this.scene.add.rectangle(0, 0, this.getX(320), this.getY(290), 0xf1f8e9, 0.97)
            .setStrokeStyle(4, 0x388e3c);

        const title = this.scene.add.text(0, -118, '🌿 PLANT STATS', {
            fontSize: '19px', color: '#2e7d32',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5);

        const line = this.scene.add.rectangle(0, -98, 280, 2, 0x388e3c, 0.4);

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
        // mark all children so they get cleared on resize
        this.statsPanel.each(c => this.mark(c));

        this.updateStatsPanel();
    }

    updateStatsPanel() {
        const s = this.scene.registry.get('plantStats');
        if (!s) return;
        const { water, sun, happiness, growth, health } = s;
        this.sPanelTexts.water.setText(`💧 Agua:        ${Math.round(water)}%`);
        this.sPanelTexts.sun.setText(`☀️  Sol:         ${Math.round(sun)}%`);
        this.sPanelTexts.happiness.setText(`❤️  Felicidad:   ${Math.round(happiness)}%`);
        this.sPanelTexts.growth.setText(`🌱 Crecimiento: Lv ${growth}`);
        this.sPanelTexts.health.setText(`🩺 Salud:       ${Math.round(health)}%`);
    }

    toggleStats() {
        this.statsPanel.setVisible(!this.statsPanel.visible);
        if (this.statsPanel.visible) this.updateStatsPanel();
    }

    // ── NOTIFICACIONES ───────────────────────────────────────
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

    // ── UPDATE ───────────────────────────────────────────────
    update() {
        this.stats = this.scene.registry.get('plantStats');

        const registryCoins = this.scene.registry.get('coins') || 0;
        if (registryCoins !== this.coins) {
            this.coins = registryCoins;
            this.coinText.setText(`$${this.coins}`);
            this.scene.tweens.add({
                targets: this.coinText,
                scaleX: 1.3, scaleY: 1.3,
                duration: 120, yoyo: true
            });
        }

        this.updateHealthBar();
        this.updateStatBoxes();
        if (this.statsPanel.visible) this.updateStatsPanel();
    }
}
