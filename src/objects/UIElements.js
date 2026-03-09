import Phaser from 'phaser';
import StorePanel    from './StorePanel';
import WardrobePanel from './WardrobePanel';
import NotebookPanel from './NotebookPanel';

export default class UIElements {
    constructor(scene) {
        this.scene    = scene;
        this.stats    = scene.registry.get('plantStats');
        this.coins    = scene.registry.get('coins') || 0;
        this.statBoxes = {};

        this.baseWidth  = 1200;
        this.baseHeight = 800;
        this.width  = scene.scale.width;
        this.height = scene.scale.height;

        scene.scale.on('resize', this.onResize, this);

        this.createBackground();
        this.createCoinsBar();
        this.createStatBars();
        this.createNotebookBtn();
        this.createSideButtons();
        this.createNotification();

        this.storePanel    = new StorePanel(scene);
        this.wardrobePanel = new WardrobePanel(scene);
        this.notebookPanel = new NotebookPanel(scene);
    }

    getX(v) { return v * (this.width  / this.baseWidth);  }
    getY(v) { return v * (this.height / this.baseHeight); }
    mark(obj) { obj.isUI = true; return obj; }

    onResize(gameSize) {
        this.width  = gameSize.width;
        this.height = gameSize.height;
        this.scene.children.list.filter(c => c.isUI).forEach(c => c.destroy());
        this.statBoxes = {};
        this.createBackground();
        this.createCoinsBar();
        this.createStatBars();
        this.createNotebookBtn();
        this.createSideButtons();
        this.createNotification();
    }

    createBackground() {
        const bg = this.scene.add.image(this.width / 2, this.height / 2, 'bg')
            .setDisplaySize(this.width, this.height)
            .setDepth(0);
        this.mark(bg);
    }

    createCoinsBar() {
        const pillW = this.getX(260);
        const pillH = this.getY(68);
        const x     = this.getX(48) + pillW / 2;
        const y     = this.getY(52);

        const pill = this.scene.add.image(x, y, 'coin')
            .setDisplaySize(pillW, pillH)
            .setDepth(5);
        this.mark(pill);

        this.coinText = this.scene.add.text(x + this.getX(40), y, `${this.coins}`, {
            fontSize: '24px', color: '#7a5200',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(6);
        this.mark(this.coinText);
    }

    createStatBars() {
        const barW   = this.getX(280);
        const barH   = this.getY(80);
        const x      = this.getX(48) + barW / 2;
        const startY = this.getY(160);
        const gap    = this.getY(18);

        const barDefs = [
            { key: 'icon_water', stat: 'water',    fill: 0x29b6f6 },
            { key: 'icon_sun',   stat: 'sun',       fill: 0xfdd835 },
            { key: 'icon_leaf',  stat: 'happiness', fill: 0x66bb6a },
        ];

        barDefs.forEach(({ key, stat, fill }, i) => {
            const y = startY + i * (barH + gap);

            const barBg = this.scene.add.image(x, y, 'status_bar')
                .setDisplaySize(barW, barH)
                .setDepth(5);
            this.mark(barBg);

            const iconSize = barH * 0.78;
            const icon = this.scene.add.image(
                x - barW / 2 + iconSize * 0.58, y, key
            ).setDisplaySize(iconSize, iconSize).setDepth(7);
            this.mark(icon);

            const railLeft  = x - barW / 2 + iconSize * 1.1;
            const railRight = x + barW / 2 - this.getX(16);
            const railW     = railRight - railLeft;
            const railH     = barH * 0.34;
            const railX     = railLeft + railW / 2;

            const railBg = this.scene.add.rectangle(railX, y, railW, railH, 0x00000033)
                .setDepth(6);
            this.mark(railBg);

            const gfx = this.scene.add.graphics().setDepth(7);
            this.mark(gfx);

            const pct = this.scene.add.text(railX, y + barH * 0.30, '0%', {
                fontSize: '12px', color: '#5a3e1b',
                fontStyle: 'bold', fontFamily: 'Arial'
            }).setOrigin(0.5).setDepth(8);
            this.mark(pct);

            this.statBoxes[stat] = {
                gfx, pct,
                railX: railLeft, railY: y - railH / 2,
                railW, railH, fill
            };
        });
    }

    updateStatBoxes() {
        const stats = this.scene.registry.get('plantStats');
        if (!stats || !this.statBoxes) return;

        Object.entries(this.statBoxes).forEach(([stat, data]) => {
            const { gfx, pct, railX, railY, railW, railH, fill } = data;
            const value = Phaser.Math.Clamp(stats[stat] ?? 0, 0, 100);
            const fillW = Math.max((value / 100) * railW, 3);
            const color =
                value < 30 ? 0xe53935 :
                value < 60 ? 0xffa726 : fill;

            gfx.clear();
            gfx.fillStyle(color, 0.85);
            gfx.fillRoundedRect(railX, railY, fillW, railH, 6);
            gfx.fillStyle(0xffffff, 0.2);
            gfx.fillRoundedRect(railX, railY, fillW, railH * 0.4, 4);

            pct.setText(`${Math.round(value)}%`);
        });
    }

    createNotebookBtn() {
        const size = this.getX(100);
        const x    = this.width - this.getX(60) - size / 2;
        const y    = this.getY(60);

        const nb = this.scene.add.image(x, y, 'icon_notebook')
            .setDisplaySize(size, size)
            .setDepth(5)
            .setInteractive({ useHandCursor: true });
        this.mark(nb);

        nb.on('pointerdown', () => {
            this.notebookPanel.show();
            this.scene.tweens.add({ targets: nb, scaleX: 0.88, scaleY: 0.88, duration: 80, yoyo: true });
        });
        nb.on('pointerover', () => nb.setTint(0xdddddd));
        nb.on('pointerout',  () => nb.clearTint());
    }

    createSideButtons() {
        const size   = this.getX(110);
        const leftX  = this.getX(60) + size / 2;
        const rightX = this.width - this.getX(60) - size / 2;
        const y1     = this.height - this.getY(240);
        const y2     = this.height - this.getY(110);

        this.makeAssetBtn(leftX,  y1, 'icon_cabinet',  size, () => this.wardrobePanel.show());
        this.makeAssetBtn(leftX,  y2, 'icon_bag',      size, () => this.storePanel.show());
        this.makeAssetBtn(rightX, y1, 'icon_watering', size, () => this.scene.events.emit('water-plant'));
        this.makeAssetBtn(rightX, y2, 'icon_door',     size, () => this.scene.scene.start('YardScene'));
    }

    makeAssetBtn(x, y, key, size, callback) {
        const btn = this.scene.add.image(x, y, key)
            .setDisplaySize(size, size)
            .setDepth(5)
            .setInteractive({ useHandCursor: true });
        this.mark(btn);

        btn.on('pointerdown', () => {
            callback();
            this.scene.tweens.add({ targets: btn, scaleX: 0.88, scaleY: 0.88, duration: 70, yoyo: true });
        });
        btn.on('pointerover', () => btn.setTint(0xdddddd));
        btn.on('pointerout',  () => btn.clearTint());
    }

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

    updateCoins(amount) {
        this.coins += amount;
        this.scene.registry.set('coins', this.coins);
        this.coinText.setText(`${this.coins}`);
        this.scene.tweens.add({ targets: this.coinText, scaleX: 1.3, scaleY: 1.3, duration: 120, yoyo: true });
    }

    update() {
        this.stats = this.scene.registry.get('plantStats');
        const registryCoins = this.scene.registry.get('coins') || 0;
        if (registryCoins !== this.coins) {
            this.coins = registryCoins;
            this.coinText.setText(`${this.coins}`);
            this.scene.tweens.add({ targets: this.coinText, scaleX: 1.3, scaleY: 1.3, duration: 120, yoyo: true });
        }
        this.updateStatBoxes();
    }
}
