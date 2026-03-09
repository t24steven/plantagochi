import Phaser from 'phaser';
import { CONFIG, PLANT_STATS } from './config';
import GameScene from './scenes/GameScene';
import ShopScene from './scenes/ShopScene';
import MinigamesMenuScene from './scenes/MinigamesMenuScene';
import CatchFertilizerScene from './scenes/CatchFertilizerScene';
import KillTheBugsScene from './scenes/KillTheBugsScene';
import YardScene from './scenes/YardScene';
import BugDefenseScene from './scenes/BugDefenseScene';

class Game extends Phaser.Game {
    constructor() {
        const config = {
            ...CONFIG,
            scene: [
                GameScene,
                YardScene,
                ShopScene,
                MinigamesMenuScene,
                CatchFertilizerScene,
                BugDefenseScene
            ]
        };
        
        super(config);
        
        // Registrar estadísticas globales
        this.registry.set('plantStats', PLANT_STATS);
        this.registry.set('coins', 0); // Para ganar monedas en minijuegos
    }
}

window.addEventListener('load', () => {
    new Game();
});
