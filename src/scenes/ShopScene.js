import Phaser from 'phaser';

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }
    getX(orig) { return orig * (this.scale.width / 1200); }
    getY(orig) { return orig * (this.scale.height / 800); }
    
    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        // Fondo (cubrir la pantalla)
        const bg = this.add.rectangle(W/2, H/2, W*0.8, H*0.75, 0xfff8e1);
        // Título
        this.add.text(W/2, this.getY(50), '🛒 Tienda de Yopleu', {
            fontSize: `${this.getY(32)}px`, // scale font
            color: '#7fb89a',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        // Mensaje
        this.add.text(W/2, H/2, 'Próximamente...', {
            fontSize: `${this.getY(24)}px`, color: '#666666'
        }).setOrigin(0.5);
        // Botón de regreso
        const backBtn = this.add.rectangle(W/2, this.getY(500), this.getX(200), this.getY(50), 0x7fb89a);
        const backText = this.add.text(W/2, this.getY(500), 'Regresar', {
            fontSize: `${this.getY(20)}px`,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        backBtn.setInteractive();
        backBtn.on('pointerdown', () => this.scene.start('GameScene'));
        backBtn.on('pointerover', () => backBtn.setFillStyle(0x8fcc9f));
        backBtn.on('pointerout', () => backBtn.setFillStyle(0x7fb89a));
    }
}
