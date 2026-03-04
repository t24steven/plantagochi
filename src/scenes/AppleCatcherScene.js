import Phaser from 'phaser';

const speedDown = 300;

export default class AppleCatcherScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AppleCatcherScene' });
        this.player = null;
        this.cursor = null;
        this.playerSpeed = speedDown + 50;
        this.target = null;
        this.points = 0;
        this.textScore = null;
        this.gameWidth = 500;
        this.gameHeight = 500;
    }

preload() {
    // Cargar assets del minijuego
    this.load.image("bg_apple", "/minigames/apple-catcher/bg.png");
    this.load.image("apple", "/minigames/apple-catcher/apple.png");
    this.load.image("basket", "/minigames/apple-catcher/basket.png");
}

    create() {
        const { width, height } = this.cameras.main;
        // origin scene (default GameScene) — provided when launched from MinigamesMenuScene
        this.originScene = this.sys.settings.data?.origin || 'GameScene';
        
        // Cambiar gravedad solo para esta escena
        this.physics.world.gravity.y = speedDown;
        
        // Fondo oscuro
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000);

        // Calcular offset para centrar
        const offsetX = (width - this.gameWidth) / 2;
        const offsetY = (height - this.gameHeight) / 2;

        // Fondo del juego
        const bg = this.add.image(offsetX + this.gameWidth / 2, offsetY + this.gameHeight / 2, 'bg_apple');
        bg.displayWidth = this.gameWidth;
        bg.displayHeight = this.gameHeight;

        // Configurar límites de física
        this.physics.world.setBounds(offsetX, offsetY, this.gameWidth, this.gameHeight);

        // Jugador (canasta)
        this.player = this.physics.add.image(
            offsetX + this.gameWidth / 2,
            offsetY + this.gameHeight - 80,
            'basket'
        );
        this.player.setCollideWorldBounds(true);
        this.player.body.allowGravity = false;
        this.player.setImmovable(true);
        this.player.setScale(0.8);

        // Manzana
        this.target = this.physics.add.image(
            offsetX + this.gameWidth / 2,
            offsetY + 50,
            'apple'
        );
        this.target.setScale(0.6);
        this.target.setBounce(0);
        this.target.setCollideWorldBounds(false);

        // Colisión
        this.physics.add.overlap(this.player, this.target, this.targetHit, null, this);

        // Controles
        this.cursor = this.input.keyboard.createCursorKeys();

        // UI
        this.textScore = this.add.text(offsetX + 15, offsetY + 15, 'Puntos: 0', {
            fontSize: '24px',
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        });

        this.coinsText = this.add.text(offsetX + 15, offsetY + 50, '💰 Monedas: 0', {
            fontSize: '20px',
            fill: '#ffeb3b',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 3
        });

        // Botón salir
        const exitBtn = this.add.text(
            offsetX + this.gameWidth - 90, 
            offsetY + 15, 
            '← Salir', 
            {
                fontSize: '20px',
                fill: '#fff',
                backgroundColor: '#d32f2f',
                padding: { x: 15, y: 8 },
                fontStyle: 'bold'
            }
        ).setInteractive();

        exitBtn.on('pointerdown', () => {
            const currentCoins = this.registry.get('coins') || 999;
            this.registry.set('coins', currentCoins + this.points);
            
            // Restaurar gravedad original
            this.physics.world.gravity.y = 0;
            
            this.scene.stop('AppleCatcherScene');
            // resume the scene that launched this minigame (GameScene or YardScene)
            this.scene.resume(this.originScene);
        });

        exitBtn.on('pointerover', () => exitBtn.setBackgroundColor('#f44336'));
        exitBtn.on('pointerout', () => exitBtn.setBackgroundColor('#d32f2f'));

        // Guardar offsets
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    update() {
        // Verificar si la manzana salió de la pantalla
        if (this.target.y >= this.offsetY + this.gameHeight + 50) {
            this.resetApple();
        }

        // Movimiento del jugador
        const { left, right } = this.cursor;
        
        if (left.isDown) {
            this.player.setVelocityX(-this.playerSpeed);
        } else if (right.isDown) {
            this.player.setVelocityX(this.playerSpeed);
        } else {
            this.player.setVelocityX(0);
        }
    }

    resetApple() {
        // Reposicionar la manzana arriba en posición aleatoria
        this.target.setY(this.offsetY + 20);
        this.target.setX(
            this.offsetX + 50 + Math.random() * (this.gameWidth - 100)
        );
        this.target.setVelocityY(0);
    }

    targetHit() {
        // Aumentar puntos
        this.points += 1;
        this.textScore.setText('Puntos: ' + this.points);
        this.coinsText.setText('💰 Monedas: ' + this.points);

        // Reposicionar manzana
        this.resetApple();

        // Efecto visual en la canasta
        this.tweens.add({
            targets: this.player,
            scaleX: 0.9,
            scaleY: 0.9,
            duration: 100,
            yoyo: true,
            ease: 'Quad.easeOut'
        });

        // Efecto de partículas
        this.createCatchEffect();
    }

    createCatchEffect() {
        // Crear efecto de estrellas al atrapar
        for (let i = 0; i < 5; i++) {
            const star = this.add.text(
                this.player.x + Phaser.Math.Between(-30, 30),
                this.player.y - 20,
                '⭐',
                { fontSize: '20px' }
            );

            this.tweens.add({
                targets: star,
                y: star.y - 50,
                alpha: 0,
                scale: 1.5,
                duration: 600,
                delay: i * 50,
                ease: 'Quad.easeOut',
                onComplete: () => star.destroy()
            });
        }
    }

    shutdown() {
        // Restaurar gravedad al salir de la escena
        this.physics.world.gravity.y = 0;
    }
}
