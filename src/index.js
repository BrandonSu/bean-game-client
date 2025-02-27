import Phaser from "phaser";
import Game from "./scenes/game";

const config = {
  type: Phaser.AUTO,
  width: 1300,
  height: 650,
  scene: [
    Game
  ],
  parent: 'parentDiv',
  dom: {
    createContainer: true
  }
};

const game = new Phaser.Game(config);
