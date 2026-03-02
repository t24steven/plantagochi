import Phaser from 'phaser';

export const CONFIG = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#e8f5e9',
    // match the CSS viewport size but render using device pixels
    width: window.innerWidth,
    height: window.innerHeight,
    resolution: window.devicePixelRatio,       // ensure high‑DPI canvas
    pixelArt: false,                           // set to true if using pixel‑art assets
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    }
};

export const PLANT_STATS = {
    water: 75,
    sun: 80,
    happiness: 85,
    growth: 1,
    health: 75
};
