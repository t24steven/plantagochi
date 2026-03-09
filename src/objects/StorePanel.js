export default class StorePanel {
    constructor(scene) {
        this.scene    = scene;
        this.visible  = false;
        this.category = 'hats';
        this.container = null;
        this._create();
    }

    _create() {
        const W = 900, H = 580;
        const cx = this.scene.scale.width  / 2;
        const cy = this.scene.scale.height / 2;

        this.container = this.scene.add.container(cx, cy).setDepth(50).setVisible(false);
        this.scene.scale.on('resize', ({width, height}) => {
            this.container.setPosition(width / 2, height / 2);
        });

        const blocker = this.scene.add.rectangle(0, 0, 1200, 800, 0x000000, 0.55)
            .setInteractive();
        this.container.add(blocker);

        // ── ÚNICO CAMBIO: imagen en lugar de rectángulo ──
        const bg = this.scene.add.image(0, 0, 'shop_bg')
            .setDisplaySize(W, H).setOrigin(0.5);
        this.container.add(bg);

        this.coinsText = this.scene.add.text(-W / 2 + 30, -H / 2 + 30, '$0', {
            fontSize: '24px', color: '#b8860b',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0, 0.5);
        this.container.add(this.coinsText);

        this._createTabs(W, H);

        this.itemsContainer = this.scene.add.container(0, 60);
        this.container.add(this.itemsContainer);

        this._renderItems();
    }

    _createTabs(W, H) {
        const tabs = [
            { key: 'hats',      label: 'HATS'          },
            { key: 'pots',      label: 'POTS'          },
            { key: 'waterings', label: 'WATERING CANS' },
        ];

        this.tabBgs = {};
        tabs.forEach(({ key, label }, i) => {
            const tx = -260 + i * 260;
            const tabBg = this.scene.add.rectangle(tx, -H / 2 + 110, 220, 48, 0x4caf50)
                .setStrokeStyle(3, 0x2e7d32)
                .setInteractive({ useHandCursor: true });

            const tabText = this.scene.add.text(tx, -H / 2 + 110, label, {
                fontSize: '16px', color: '#ffffff',
                fontStyle: 'bold', fontFamily: 'Arial'
            }).setOrigin(0.5);

            tabBg.on('pointerdown', () => {
                this.category = key;
                this._updateTabs();
                this._renderItems();
            });
            tabBg.on('pointerover', () => { if (this.category !== key) tabBg.setFillStyle(0x66bb6a); });
            tabBg.on('pointerout',  () => { if (this.category !== key) tabBg.setFillStyle(0x4caf50); });

            this.container.add([tabBg, tabText]);
            this.tabBgs[key] = tabBg;
        });

        this._updateTabs();
    }

    _updateTabs() {
        Object.entries(this.tabBgs).forEach(([key, bg]) => {
            bg.setFillStyle(key === this.category ? 0x2e7d32 : 0x4caf50);
        });
    }

    _getCatalog() {
        const catalog = {
            hats: [
                { id: 'hat_1', label: 'Hat 1', price: 50  },
                { id: 'hat_2', label: 'Hat 2', price: 80  },
                { id: 'hat_3', label: 'Hat 3', price: 120 },
            ],
            pots: [
                { id: 'pot_1', label: 'Pot 1', price: 40  },
                { id: 'pot_2', label: 'Pot 2', price: 70  },
                { id: 'pot_3', label: 'Pot 3', price: 100 },
                { id: 'pot_4', label: 'Pot 4', price: 150 },
            ],
            waterings: [
                { id: 'watering_1', label: 'Can 1', price: 60  },
                { id: 'watering_2', label: 'Can 2', price: 90  },
                { id: 'watering_3', label: 'Can 3', price: 130 },
            ],
        };
        return catalog[this.category] || [];
    }

    _renderItems() {
        this.itemsContainer.removeAll(true);

        const items   = this._getCatalog();
        const owned   = this.scene.registry.get('ownedItems') || {};
        const spacing = 220;
        const startX  = -(spacing * (items.length - 1)) / 2;

        items.forEach((item, i) => {
            const x       = startX + i * spacing;
            const isOwned = !!owned[item.id];

            const card = this.scene.add.rectangle(x, 0, 190, 260, isOwned ? 0xd4edda : 0xe3f2fd)
                .setStrokeStyle(4, isOwned ? 0x4caf50 : 0x90caf9)
                .setInteractive({ useHandCursor: true });

            const img = this.scene.add.image(x, -60, item.id)
                .setDisplaySize(130, 130);

            const nameText = this.scene.add.text(x, 55, item.label, {
                fontSize: '15px', color: '#1a1a1a',
                fontStyle: 'bold', fontFamily: 'Arial'
            }).setOrigin(0.5);

            const btnColor = isOwned ? 0x9e9e9e : 0x4caf50;
            const btnLabel = isOwned ? 'OWNED' : `$${item.price}`;
            const btn = this.scene.add.rectangle(x, 100, 150, 38, btnColor)
                .setStrokeStyle(3, 0x333333);
            const btnText = this.scene.add.text(x, 100, btnLabel, {
                fontSize: '15px', color: '#ffffff',
                fontStyle: 'bold', fontFamily: 'Arial'
            }).setOrigin(0.5);

            if (!isOwned) {
                card.on('pointerdown', () => this._buy(item));
                card.on('pointerover', () => card.setFillStyle(0xbbdefb));
                card.on('pointerout',  () => card.setFillStyle(0xe3f2fd));
            }

            this.itemsContainer.add([card, img, nameText, btn, btnText]);
        });
    }

    _buy(item) {
        const coins = this.scene.registry.get('coins') || 0;
        if (coins < item.price) {
            this.scene.tweens.add({
                targets: this.coinsText,
                x: this.coinsText.x + 6, duration: 40,
                yoyo: true, repeat: 3
            });
            return;
        }

        this.scene.registry.set('coins', coins - item.price);
        const owned = this.scene.registry.get('ownedItems') || {};
        owned[item.id] = true;
        this.scene.registry.set('ownedItems', owned);

        this._renderItems();
        this._updateCoinsText();
    }

    _updateCoinsText() {
        const coins = this.scene.registry.get('coins') || 0;
        this.coinsText.setText(`$${coins}`);
    }

    show() {
        this._updateCoinsText();
        this._renderItems();
        this.container.setVisible(true);
        this.visible = true;
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1, scaleY: 1,
            from: 0.85, duration: 180, ease: 'Back.easeOut'
        });
    }

    hide() {
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 0.85, scaleY: 0.85,
            duration: 120, ease: 'Sine.easeIn',
            onComplete: () => {
                this.container.setVisible(false);
                this.visible = false;
            }
        });
    }
}
