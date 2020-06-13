import config from './config';
import utils from './utils';

export default class Harvest {
    constructor(scene) {
        let self = this;

        this.harvestField = function(fieldIndex) {
            let field = scene.player.fields[fieldIndex];
            // figure out if we are harvesting or discarding and update dom text
            let harvestNumbers = config.CONSTANTS.BEAN_HARVESTING_NUMBERS_MAP[field.fieldType];
            if (harvestNumbers) {
                self.createDOMElements();
                if (harvestNumbers[field.cardCount]) {
                    self.updatePopupText(config.CONSTANTS.FLAGS.HARVEST_FLAG, field, harvestNumbers[field.cardCount], field.cardCount);
                    self.setYesButtonEventListener(() => self.discardCardsFromField(field, field.cardCount, harvestNumbers[field.cardCount], fieldIndex, true));
                } else {
                    if (field.cardCount < Object.keys(harvestNumbers)[0]) {
                        self.updatePopupText(config.CONSTANTS.FLAGS.DISCARD_FLAG, field);
                        self.setYesButtonEventListener(() => self.discardCardsFromField(field, field.cardCount, 0, fieldIndex, true));
                    } else {
                        let maxHarvest = -1;
                        for (let num in harvestNumbers) {
                            if (field.cardCount < num) {
                                break;
                            }
                            maxHarvest = num;
                        }
                        self.updatePopupText(config.CONSTANTS.FLAGS.HARVEST_FLAG, field, harvestNumbers[maxHarvest], maxHarvest);
                        self.setYesButtonEventListener(() => self.discardCardsFromField(field, maxHarvest, harvestNumbers[maxHarvest], fieldIndex, false));
                    }
                }
            } else {
                window.alert('Field is empty.');
                utils.resetHarvestFieldButtonDisplay(scene);
            }

            console.log('phase', scene.phase);
        }

        /**
         * @function createDOMElements
         * @description Creates DOM element for harvest popup and adds standard event listener for closing it.
         * @memberof harvest
         */
        this.createDOMElements = function() {
            if (scene.harvestPopup) scene.harvestPopup.destroy();
            scene.harvestPopup = scene.add.dom(scene.width / 2, scene.height / 2).setOrigin(0.5).createFromCache('harvestPopup');
            scene.harvestPopup.getChildByID('noButton').addEventListener('click', function() {
                scene.harvestPopup.destroy();
                utils.resetHarvestFieldButtonDisplay(scene);
            });            
        }

        /**
         * @function setYesButtonEventListener
         * @description Updates 'click' event listener for button in harvest popup.
         * @memberof harvest
         * @param {function} callback
         */
        this.setYesButtonEventListener = function(callback) {
            scene.harvestPopup.getChildByID('yesButton').addEventListener('click', function() {
                callback();
                scene.harvestPopup.destroy();
                utils.resetHarvestFieldButtonDisplay(scene);
            });
        }

        /**
         * @function discardCardsFromField
         * @description Discards cards in field and adds coins to coin counter if applicable.
         * @memberof harvest
         * @param {Object} field Field to be emptied
         * @param {number} coins Coins received after discarding cards in field
         */
        this.discardCardsFromField = function(field, cardsDiscarding, coins, fieldIndex, emptyField) {
            // use this method for both emptying field and just harvesting some of the cards
            for (let i = 0; i < cardsDiscarding; i++) {
                scene.turn.discardCard(field.cards[0], config.CONSTANTS.ENTRY_POINTS.FIELD, i < cardsDiscarding - coins, fieldIndex, emptyField);
                field.cards.splice(0, 1);
                field.cardCount--;
            }
            
            scene.player.coins += coins;
            scene.socket.emit('updateCoinStack', scene.player);
            
            scene.coinCount.setText(scene.player.coins);
            field.counterText.setText(field.cardCount);
            if (emptyField) {
                field.fieldType = config.CONSTANTS.EMPTY_FIELD;
            }
        }

        /**
         * @function updatePopupText
         * @description Updates inner text for harvest popup DOM element.
         * @memberof harvest
         * @param {string} discardHarvestFlag flag to determine which text is to be shown and updated
         * @param {Object} field field considering discarding
         * @param {number} coins number of coins to be received after discarding field
         */
        this.updatePopupText = function(discardHarvestFlag, field, coins = 0, cardsDiscarded) {
            if (discardHarvestFlag === config.CONSTANTS.FLAGS.HARVEST_FLAG) {
                utils.hideDOMElementsByIds(scene.harvestPopup, ['discardText']);
                let harvestText = scene.harvestPopup.getChildByID('harvestText');
                harvestText.innerText = harvestText.innerText.replace('NUM_BEANS', cardsDiscarded).replace('BEAN_TYPE', utils.getBeanNameFromField(field)).replace('NUM_COINS', coins);
            } else if (discardHarvestFlag == config.CONSTANTS.FLAGS.DISCARD_FLAG) {
                utils.hideDOMElementsByIds(scene.harvestPopup, ['harvestText']);
                let discardText = scene.harvestPopup.getChildByID('discardText');
                discardText.innerText = discardText.innerText.replace('NUM_BEANS', field.cardCount).replace('BEAN_TYPE', utils.getBeanNameFromField(field));
            }
            
        }
    }
}
