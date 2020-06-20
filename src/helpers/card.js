export default class Card {
    constructor(scene) {
        this.render = (x, y, sprite, originX, originY) => {
            let card = scene.add.image(x, y, sprite).setOrigin(originX, originY).disableInteractive();
            return card;
        };
    };
}
