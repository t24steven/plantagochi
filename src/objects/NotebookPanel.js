export default class NotebookPanel {
    constructor(scene) {
        this.scene   = scene;
        this.visible = false;
        this.container = null;
        this._create();
    }

    _getNotebookKey() {
    // Lee de localStorage igual que GameScene
    const data = localStorage.getItem('plantaSeleccionada');
    if (!data) return 'notebook_cactus';

    const planta = JSON.parse(data);

    const map = {
        nopal:   'notebook_cactus',
        lengua:  'notebook_snake',
        girasol: 'notebook_sunflower',
    };

    return map[planta.key] ?? 'notebook_cactus';
}


    _create() {
        const cx = this.scene.scale.width / 2;
        const cy = this.scene.scale.height / 2;
        this.container = this.scene.add.container(cx, cy).setDepth(60).setVisible(false);
        this.scene.scale.on('resize', ({width,height}) => {
            this.container.setPosition(width/2, height/2);
        });

        // Bloqueador de fondo
        const blocker = this.scene.add.rectangle(0, 0, 1200, 800, 0x000000, 0.6)
            .setInteractive();
        blocker.on('pointerdown', () => this.hide());
        this.container.add(blocker);

        // Imagen de la libreta — se asigna al hacer show()
        this.notebookImg = this.scene.add.image(0, 0, 'notebook_cactus')
            .setDisplaySize(420, 560)
            .setDepth(61);
        this.container.add(this.notebookImg);

        // Botón cerrar encima
        const closeBtn = this.scene.add.text(185, -265, '✕', {
            fontSize: '28px', color: '#e53935',
            fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(62);

        closeBtn.on('pointerdown', () => this.hide());
        closeBtn.on('pointerover', () => closeBtn.setColor('#ff1744'));
        closeBtn.on('pointerout',  () => closeBtn.setColor('#e53935'));
        this.container.add(closeBtn);
    }

    show() {
        // Actualiza la imagen según la planta seleccionada
        const key = this._getNotebookKey();
        this.notebookImg.setTexture(key);

        this.container.setVisible(true).setScale(0.8).setAlpha(0);
        this.visible = true;

        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1, scaleY: 1, alpha: 1,
            duration: 200, ease: 'Back.easeOut'
        });
    }

    hide() {
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 0.85, scaleY: 0.85, alpha: 0,
            duration: 150, ease: 'Sine.easeIn',
            onComplete: () => {
                this.container.setVisible(false);
                this.visible = false;
            }
        });
    }
}
