import Phaser from 'phaser';

export default class Plant extends Phaser.GameObjects.Container {
    constructor(scene, x, y, textureKey = 'plant_default') {
        super(scene, x, y);

        this.plantType  = textureKey;
        this.currentPot = 'basic';

        scene.add.existing(this);
        this.setDepth(10);

        this.createPlant();
        this.setupAnimations();
        this.setupInteractivity();
    }

    createPlant() {
        // Maceta
        this.pot = this.scene.add.image(0, 90, 'pot_basic')
            .setOrigin(0.5)
            .setDisplaySize(160, 130);
        this.add(this.pot);

        // Cuerpo de la planta
        this.plantBody = this.scene.add.image(0, -80, this.plantType)
            .setOrigin(0.5)
            .setDisplaySize(280, 280);
        this.add(this.plantBody);

        // Cara — una sola imagen centrada en el cuerpo
        this.face = this.scene.add.image(0, -85, 'face_happy')
            .setOrigin(0.5)
            .setDisplaySize(160, 80);
        this.add(this.face);

        // Sombrero — oculto por defecto
        this.hat = this.scene.add.image(0, -150, 'hat_1')
            .setOrigin(0.5)
            .setScale(0.9)
            .setDepth(15)
            .setVisible(false);
        this.add(this.hat);
    }

    applyEquipment(equipped) {
        try {
            if (!equipped) return;
            const pot = equipped.pots || equipped.pot;
            if (pot) this.changePot(pot);

            const hat = equipped.hats || equipped.hat;
            if (hat) {
                this.setHat(hat);
            } else if (this.hat) {
                this.hat.setVisible(false);
            }
        } catch (e) {
            console.warn('applyEquipment error', e);
        }
    }

    setHat(hatKey) {
        try {
            if (!hatKey) { this.hat?.setVisible(false); return; }
            this.hat.setTexture(hatKey);
            this.hat.setVisible(true);
        } catch (e) {
            console.warn('setHat error', e);
            this.hat?.setVisible(false);
        }
    }

    setupAnimations() {
        this.scene.tweens.add({
            targets: this,
            y: this.y - 8,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.scene.time.addEvent({
            delay: Phaser.Math.Between(3000, 6000),
            callback: () => this.blink(),
            loop: true
        });
    }

    setupInteractivity() {
        this.setSize(200, 350);
        this.setInteractive(
            new Phaser.Geom.Rectangle(-100, -175, 200, 350),
            Phaser.Geom.Rectangle.Contains
        );
        this.on('pointerdown', () => this.onPet());
        this.on('pointerover', () => this.scene.input.setDefaultCursor('pointer'));
        this.on('pointerout',  () => this.scene.input.setDefaultCursor('default'));
    }

    // Parpadeo: cambia temporalmente a face_normal (ojos cerrados)
    blink() {
        const current = this.face.texture.key;
        this.face.setTexture('face_normal');
        this.scene.time.delayedCall(150, () => {
            this.face.setTexture(current); // restaura la cara que tenía
        });
    }

    onPet() {
        this.showHappiness();
        this.scene.events.emit('plant-petted');
    }

    showHappiness() {
        this.setEmotion('happy');

        this.scene.tweens.add({
            targets: this,
            y: this.y - 20,
            duration: 150,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.scene.time.delayedCall(1000, () => {
                    this.face.setTexture('face_happy');
                });
            }
        });

        this.createHeartParticles();
    }

    createHeartParticles() {
        for (let i = 0; i < 3; i++) {
            const heart = this.scene.add.image(
                this.x + Phaser.Math.Between(-20, 20),
                this.y - 80,
                'heart'
            ).setScale(0.5).setAlpha(0).setDepth(20);

            this.scene.tweens.add({
                targets: heart,
                y: heart.y - 60,
                alpha: 1,
                scale: 0.8,
                duration: 1000,
                delay: i * 200,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: heart,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => heart.destroy()
                    });
                }
            });
        }
    }

    showWaterEffect() {
        for (let i = 0; i < 10; i++) {
            const drop = this.scene.add.image(
                this.x + Phaser.Math.Between(-30, 30),
                this.y - 120,
                'water_drop'
            ).setScale(0.5).setAlpha(0.8).setDepth(20);

            this.scene.tweens.add({
                targets: drop,
                y: this.y + 50,
                alpha: 0,
                angle: Phaser.Math.Between(-45, 45),
                duration: 800,
                delay: i * 50,
                ease: 'Quad.easeIn',
                onComplete: () => drop.destroy()
            });
        }

        this.scene.tweens.add({
            targets: this.plantBody,
            tint: 0x64b5f6,
            duration: 300,
            yoyo: true,
            onComplete: () => this.plantBody.clearTint()
        });

        this.showHappiness();
    }

    showSunEffect() {
        for (let i = 0; i < 8; i++) {
            const ray = this.scene.add.image(this.x, this.y - 150, 'sun_ray')
                .setOrigin(0.5, 0)
                .setAngle(i * 45)
                .setAlpha(0.8)
                .setScale(0.5)
                .setDepth(20);

            this.scene.tweens.add({
                targets: ray,
                scaleY: 1.5,
                alpha: 0,
                duration: 600,
                onComplete: () => ray.destroy()
            });
        }

        this.scene.tweens.add({
            targets: this.plantBody,
            tint: 0xffd54f,
            duration: 300,
            yoyo: true,
            onComplete: () => this.plantBody.clearTint()
        });

        this.showHappiness();
    }

    changeSoil() {
        for (let i = 0; i < 15; i++) {
            const p = this.scene.add.image(
                this.x + Phaser.Math.Between(-60, 60),
                this.y + 140,
                'soil_particle'
            ).setScale(Phaser.Math.FloatBetween(0.3, 0.8)).setAlpha(0.8).setDepth(20);

            this.scene.tweens.add({
                targets: p,
                y: p.y - Phaser.Math.Between(20, 50),
                x: p.x + Phaser.Math.Between(-20, 20),
                alpha: 0,
                angle: Phaser.Math.Between(-180, 180),
                duration: 800,
                delay: i * 30,
                ease: 'Quad.easeOut',
                onComplete: () => p.destroy()
            });
        }
        this.showHappiness();
    }

    changePot(potType) {
        this.currentPot = potType;
        this.pot.setTexture(potType);
        this.showHappiness();
    }

    changeColor(color) {
        this.scene.tweens.add({
            targets: this.plantBody,
            tint: color,
            duration: 500
        });
        this.showHappiness();
    }

    setEmotion(emotion) {
        const map = {
            happy:     'face_happy',
            sad:       'face_sad',
            surprised: 'face_surprised',
            sleepy:    'face_sleepy',
            normal:    'face_normal',
        };
        this.face.setTexture(map[emotion] || 'face_happy');
    }

    resetAppearance() {
        this.plantBody.clearTint();
        this.setEmotion('happy');
        if (this.hat) this.hat.setVisible(false);
    }

    update() {}
}
