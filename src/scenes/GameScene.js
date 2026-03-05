import Phaser from 'phaser';
import Plant from '../objects/Plant';
import UIElements from '../objects/UIElements';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.plant     = null;
        this.ui        = null;
        this.stats     = null;
        this.deathVideo = null;
    }

    preload() {
        const data = localStorage.getItem('plantaSeleccionada');
        this.plantaData = data ? JSON.parse(data) : {
            key: 'plant1',
            body: 'assets/plants/plant1.png'  // fallback = primera planta
        };

        // Fondo
        this.load.image('bg', 'public/elements/bg/interior.png');

        // Planta seleccionada — path sin / inicial para Vite
        this.load.image('plant_default', this.plantaData.body);

        // Moneda
        this.load.image('coin', 'assets/ui/coin.png');

        // Iconos top
        this.load.image('icon_water',    'assets/ui/icon_water.png');
        this.load.image('icon_sun',      'assets/ui/icon_sun.png');
        this.load.image('icon_leaf',     'assets/ui/icon_leaf.png');
        this.load.image('icon_notebook', 'assets/ui/icon_notebook.png');

        // Botones laterales
        this.load.image('icon_door',     'assets/ui/icon_door.png');
        this.load.image('icon_watering', 'assets/ui/icon_watering.png');
        this.load.image('icon_cabinet',  'assets/ui/icon_cabinet.png');
        this.load.image('icon_bag',      'assets/ui/icon_bag.png');

        // Macetas
        this.load.image('pot_basic',   'assets/pots/pot_basic.png');
        this.load.image('pot_fancy',   'assets/pots/pot_fancy.png');
        this.load.image('pot_ceramic', 'assets/pots/pot_ceramic.png');
        this.load.image('pot_1', 'assets/pots/pot_1.png');
        this.load.image('pot_2', 'assets/pots/pot_2.png');
        this.load.image('pot_3', 'assets/pots/pot_3.png');
        this.load.image('pot_4', 'assets/pots/pot_4.png');

        // Expresiones — ojos
        this.load.image('eye_normal',    'assets/plants/eye_normal.png');
        this.load.image('eye_happy',     'assets/plants/eye_happy.png');
        this.load.image('eye_sad',       'assets/plants/eye_sad.png');
        this.load.image('eye_surprised', 'assets/plants/eye_surprised.png');
        this.load.image('eye_closed',    'assets/plants/eye_closed.png');

        // Expresiones — bocas
        this.load.image('mouth_happy',     'assets/plants/mouth_happy.png');
        this.load.image('mouth_sad',       'assets/plants/mouth_sad.png');
        this.load.image('mouth_surprised', 'assets/plants/mouth_surprised.png');
        this.load.image('mouth_sleepy',    'assets/plants/mouth_sleepy.png');

        // Efectos
        this.load.image('blush',          'assets/effects/blush.png');
        this.load.image('heart',          'assets/effects/heart.png');
        this.load.image('water_drop',     'assets/effects/water_drop.png');
        this.load.image('sun_ray',        'assets/effects/sun_ray.png');
        this.load.image('soil_particle',  'assets/effects/soil_particle.png');

        // Sombreros
        this.load.image('hat_1', 'assets/hats/hat_1.png');
        this.load.image('hat_2', 'assets/hats/hat_2.png');
        this.load.image('hat_3', 'assets/hats/hat_3.png');

        // Regaderas
        this.load.image('watering_1', 'assets/waterings/watering_1.png');
        this.load.image('watering_2', 'assets/waterings/watering_2.png');
        this.load.image('watering_3', 'assets/waterings/watering_3.png');

        // Libretas
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

        // 1. UI primero → el fondo queda atrás
        this.ui = new UIElements(this);

        // 2. Planta después → queda encima del fondo; siempre centrada
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2 + this.scale.height * 0.06; // slight drop below center
        this.plant = new Plant(this, cx, cy, 'plant_default');

        this.scale.on('resize', (gameSize) => {
            if (this.plant) {
                this.plant.setPosition(gameSize.width/2, gameSize.height/2 + gameSize.height*0.06);
            }
        });

        // reposition death video target later if needed


        this.setupEvents();
        this.startStatsDecay();
        // Una sola vez al iniciar
        if (!this.registry.get('ownedItems'))    this.registry.set('ownedItems', {});
        if (!this.registry.get('equippedItems')) this.registry.set('equippedItems', {});

    }

    setupEvents() {
        this.events.on('water-plant',    () => this.waterPlant());
        this.events.on('give-sun',       () => this.giveSun());
        this.events.on('change-soil',    () => this.changeSoil());
        this.events.on('change-clothes', () => this.changeClothes());
        this.events.on('plant-petted',   () => this.petPlant());
        this.events.on('die-plant',      () => this.diePlant());

        this.events.on('reset-plant', () => {
            this.stats.water     = 50;
            this.stats.sun       = 50;
            this.stats.health    = 50;
            this.stats.happiness = 50;
            if (this.plant) this.plant.resetAppearance();
            this.ui.showNotification('¡Plantagochi ha sido reseteado! 🔄');
        });
        this.events.on('equip-changed', (equipped) => {
            this.plant.applyEquipment(equipped);
        });

        }

    diePlant() {
        if (this.stats.health <= 0 ||
            (this.stats.water <= 0 && this.stats.sun <= 0)) {

            if (this.deathVideo) return;

            this.time.removeAllEvents();

            if (this.plant) this.plant.setVisible(false);

            this.deathVideo = this.add.video(this.scale.width/2, this.scale.height/2, 'plant_die')
                .setOrigin(0.5)
                .setDepth(50);
            this.deathVideo.play();

            this.ui.showNotification('😢 Tu Plantagochi ha muerto...');

            this.deathVideo.on('complete', () => {
                this.deathVideo = null;
                this.scene.restart();
            });
            this.deathVideo.on('error', () => {
                this.deathVideo = null;
                this.scene.restart();
            });
            this.time.delayedCall(10000, () => {
                if (this.scene.isActive('GameScene')) {
                    this.deathVideo = null;
                    this.scene.restart();
                }
            });
        }
    }

    waterPlant() {
        if (this.stats.water < 100) {
            this.stats.water     = Math.min(100, this.stats.water + 20);
            this.stats.health    = Math.min(100, this.stats.health + 5);
            this.stats.happiness = Math.min(100, this.stats.happiness + 5);
            if (this.plant) this.plant.showWaterEffect();
            this.ui.showNotification('¡Plantagochi its happy! 💧');
        } else {
            this.ui.showNotification('¡Ya tiene suficiente agua!');
        }
    }

    giveSun() {
        if (this.stats.sun < 100) {
            this.stats.sun    = Math.min(100, this.stats.sun + 15);
            this.stats.health = Math.min(100, this.stats.health + 3);
            if (this.plant) this.plant.showSunEffect();
            this.ui.showNotification('¡like the sun! ☀️');
        } else {
            this.ui.showNotification('¡Ya tiene suficiente luz!');
        }
    }

    changeSoil() {
        this.stats.health = Math.min(100, this.stats.health + 10);
        this.stats.growth = Math.min(10, this.stats.growth + 1);
        if (this.plant) this.plant.changeSoil();
        this.ui.showNotification('¡Fresh grow! 🌱');
    }

    changeClothes() {
        // Abrir el panel de armario si existe el UI
        if (this.ui && this.ui.wardrobePanel) {
            this.ui.wardrobePanel.show();
        }
    }

    petPlant() {
        this.stats.happiness = Math.min(100, this.stats.happiness + 3);
        this.ui.showNotification('Plantagochi like it! ❤️');
    }

    startStatsDecay() {
        this.time.addEvent({
            delay: 3000,
            loop: true,
            callback: () => {
                this.stats.water = Math.max(0, this.stats.water - 1);
                this.stats.sun   = Math.max(0, this.stats.sun - 0.5);
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
        if (this.ui)    this.ui.update();
        if (this.plant) this.plant.update();
    }
}
