import Phaser from 'phaser';

export default class KillTheBugsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'KillTheBugsScene' });
    }

    init(data) {
        this.origin = data.origin || 'GameScene';
    }

    preload() {
        this.load.image('bg_yard', '/assets/elements/bg/exterior.png');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Fondo
        this.add.image(W / 2, H / 2, 'bg_yard')
            .setDisplaySize(W, H).setDepth(0);

        // Título
        this.add.text(W / 2, H / 2 - 100, 'Kill the Bugs - Coming Soon!', {
            fontSize: '32px',
            color: '#4caf50',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Botón de regreso
        const backBtn = this.add.rectangle(W / 2, H / 2 + 100, 200, 50, 0x4db6e8)
            .setInteractive();
        const backText = this.add.text(W / 2, H / 2 + 100, 'Back', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        backBtn.on('pointerdown', () => {
            this.scene.stop('KillTheBugsScene');
            this.scene.resume(this.origin);
        });
    }
}