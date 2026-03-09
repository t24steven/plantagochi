export default class WardrobePanel {
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
        const bg = this.scene.add.image(0, 0, 'wardrobe_bg')
            .setDisplaySize(W, H).setOrigin(0.5);
        this.container.add(bg);

        this._createTabs(W, H);

        this.itemsContainer = this.scene.add.container(0, 60);
        this.container.add(this.itemsContainer);

        this.emptyText = this.scene.add.text(0, 0, 'No items owned yet.\nVisit the Store!', {
            fontSize: '22px', color: '#888888',
            fontFamily: 'Arial', align: 'center'
        }).setOrigin(0.5).setVisible(false);
        this.container.add(this.emptyText);

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
            const tabBg = this.scene.add.rectangle(tx, -H / 2 + 110, 220, 48, 0xff9800)
                .setStrokeStyle(3, 0xe65100)
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

            this.container.add([tabBg, tabText]);
            this.tabBgs[key] = tabBg;
        });

        this._updateTabs();
    }

    _updateTabs() {
        Object.entries(this.tabBgs).forEach(([key, bg]) => {
            bg.setFillStyle(key === this.category ? 0xe65100 : 0xff9800);
        });
    }

    _getCategoryItems() {
        const all = {
            hats:      ['hat_1', 'hat_2', 'hat_3'],
            pots:      ['pot_1', 'pot_2', 'pot_3', 'pot_4'],
            waterings: ['watering_1', 'watering_2', 'watering_3'],
        };
        return all[this.category] || [];
    }

    _renderItems() {
        this.itemsContainer.removeAll(true);

        const owned    = this.scene.registry.get('ownedItems')    || {};
        const equipped = this.scene.registry.get('equippedItems') || {};
        const allItems = this._getCategoryItems();
        const myItems  = allItems.filter(id => owned[id]);

        if (myItems.length === 0) {
            this.emptyText.setVisible(true);
            return;
        }
        this.emptyText.setVisible(false);

        const spacing = 210;
        const startX  = -(spacing * (myItems.length - 1)) / 2;

        myItems.forEach((id, i) => {
            const x          = startX + i * spacing;
            const isEquipped = equipped[this.category] === id;

            const card = this.scene.add.rectangle(x, 0, 185, 250, isEquipped ? 0xffe0b2 : 0xffffff)
                .setStrokeStyle(4, isEquipped ? 0xff9800 : 0xdddddd)
                .setInteractive({ useHandCursor: true });

            const img = this.scene.add.image(x, -50, id)
                .setDisplaySize(120, 120);

            const badge = this.scene.add.text(x, 40, isEquipped ? '✅ EQUIPPED' : 'Tap to equip', {
                fontSize: '13px',
                color: isEquipped ? '#2e7d32' : '#888888',
                fontStyle: 'bold', fontFamily: 'Arial'
            }).setOrigin(0.5);

            const btn = this.scene.add.rectangle(x, 90, 150, 38, isEquipped ? 0x9e9e9e : 0xff9800)
                .setStrokeStyle(3, 0x333333);
            const btnText = this.scene.add.text(x, 90, isEquipped ? 'UNEQUIP' : 'EQUIP', {
                fontSize: '15px', color: '#ffffff',
                fontStyle: 'bold', fontFamily: 'Arial'
            }).setOrigin(0.5);

            card.on('pointerdown', () => this._equip(id));
            card.on('pointerover', () => { if (!isEquipped) card.setFillStyle(0xfff3e0); });
            card.on('pointerout',  () => { if (!isEquipped) card.setFillStyle(0xffffff); });

            this.itemsContainer.add([card, img, badge, btn, btnText]);
        });
    }

    _equip(id) {
        const equipped = this.scene.registry.get('equippedItems') || {};

        if (equipped[this.category] === id) {
            delete equipped[this.category];
        } else {
            equipped[this.category] = id;
        }

        this.scene.registry.set('equippedItems', equipped);
        this.scene.events.emit('equip-changed', equipped);
        this._renderItems();
    }

    show() {
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
