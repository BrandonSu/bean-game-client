import Card from './card';
import config from "./config";
import utils from "./utils";

let cardsPlayed = 0;
let deck = [];

export default class Turn {
    constructor(scene) {
        let self = this;

        scene.input.on('dragstart', function(pointer, gameObject) {
            gameObject.setTint(0x7a7a7a);
            scene.children.bringToTop(gameObject);
        });

        scene.input.on('dragend', function(pointer, gameObject, dropped) {
            gameObject.setTint();
            if (!dropped) {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        });

        scene.input.on('drag', function(pointer, gameObject, dragX, dragY) {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.removeFromOpenCards = function(gameObject) {
            let index = scene.openCards.findIndex( card => (card === gameObject));
            if (index !== -1) {
                scene.openCards.splice(index, 1);
                scene.socket.emit('updateOpenCards', scene.openCards);
            }
            return index;
        }

        this.requestTrade = function(gameObject, fromPlayer, fromDeck, fromHand, index) {
            if (scene.tradePopup) scene.tradePopup.destroy();
            scene.tradePopup = scene.add.dom(scene.width / 2, scene.height / 2).setOrigin(0.5).createFromCache('tradePopup');

            let tradeRequestText = scene.tradePopup.getChildByID('tradeRequestText');
            tradeRequestText.innerText = tradeRequestText.innerText.replace('PLAYER_NAME', scene.otherPlayers[fromPlayer].name).replace('BEAN_TYPE', utils.getBeanNameFromBeanType(utils.getAssetNameWithoutSize(gameObject.textureKey)));

            utils.hideDOMElementsByIds(scene.tradePopup, ['tradeRejectedText', 'okButton']);

            scene.tradePopup.getChildByID('yesButton').addEventListener('click', function() {
                scene.tradePopup.destroy();
                scene.socket.emit('acceptTrade', scene.player.id, gameObject);
            });

            scene.tradePopup.getChildByID('noButton').addEventListener('click', function() {
                scene.tradePopup.destroy();
                scene.socket.emit('rejectTrade', scene.player.id, fromPlayer, gameObject, fromDeck, fromHand, index);
            });
        }

        this.handleRejectedTrade = function(playerRejectingTrade, gameObject, fromDeck, fromHand, index) {
            if (scene.tradePopup) scene.tradePopup.destroy();
            scene.tradePopup = scene.add.dom(scene.width / 2, scene.height / 2).setOrigin(0.5).createFromCache('tradePopup');

            let tradeRejectedText = scene.tradePopup.getChildByID('tradeRejectedText');
            tradeRejectedText.innerText = tradeRejectedText.innerText.replace('PLAYER_NAME', scene.otherPlayers[playerRejectingTrade].name);

            utils.hideDOMElementsByIds(scene.tradePopup, ['tradeRequestText', 'yesButton', 'noButton']);

            scene.tradePopup.getChildByID('okButton').addEventListener('click', function() {
                scene.tradePopup.destroy();
                if (fromDeck && index !== null && index > -1) {
                    scene.openCards.splice(index, 0, new Card(scene).render(scene.width / 2 - 60 + (120 * index), scene.height / 2, utils.adjustAssetSize(gameObject.textureKey, config.CONSTANTS.ASSET_SIZE.LARGE), 0, 0.5));
                    scene.openCards[index].setInteractive();
                    scene.input.setDraggable(scene.openCards[index]);
                    if (scene.phase !== 1) {
                        scene.phase = 1;
                    }

                    if (scene.openCards.length === 2) {
                        // we need to disable trades
                    }
                    scene.socket.emit('updateOpenCards', scene.openCards);
                } else if (fromHand && index !== null && index > -1) {
                    let cardCoords = {x: scene.player.hand[index].x, y: scene.player.hand[index].y};
                    scene.dealer.shiftHandDown(index, 1);
                    scene.player.hand.splice(index, 0, new Card(scene).render(cardCoords.x, cardCoords.y, utils.adjustAssetSize(gameObject.textureKey, config.CONSTANTS.ASSET_SIZE.LARGE), 0, 0.5));
                    scene.player.hand[index].setInteractive();
                    scene.input.setDraggable(scene.player.hand[index]);
                }
            });
        }
        
        this.dropOnField = function(gameObject, traded) {
            let fieldTypes = scene.player.fields.map( field => field.fieldType );
            let cardPlanted = utils.getAssetNameWithoutSize(traded ? gameObject.textureKey : gameObject.texture.key);

            let fieldToBePlanted = utils.getAvailableField(scene.player.fields, cardPlanted);

            if (fieldToBePlanted) {
                fieldToBePlanted.cardCount++;
                fieldToBePlanted.counterText.setText(fieldToBePlanted.cardCount);
                if (utils.isFieldEmpty(fieldToBePlanted)) {
                    fieldToBePlanted.fieldType = cardPlanted;
                }
                if (traded) {
                    fieldToBePlanted.cards.push(scene.add.image(fieldToBePlanted.x, fieldToBePlanted.y, utils.adjustAssetSize(cardPlanted, config.CONSTANTS.ASSET_SIZE.LARGE)).setOrigin(0, 0.5));
                } else if (scene.phase < 2) {
                    fieldToBePlanted.cards.push(gameObject);
                    gameObject.x = fieldToBePlanted.x;
                    gameObject.y = fieldToBePlanted.y;
                    gameObject.disableInteractive();
                    if (scene.phase === 0) {
                        cardsPlayed++;
                        utils.toggleDisplay(scene.fieldText.getChildByID('plantAnotherText'));
                        utils.hideDOMElements([scene.fieldText.getChildByID('plantFirstText')]);
                        scene.player.hand.splice(0, 1);
                        scene.dealer.shiftHandUp(0, 1);
            
                        let nextCard = scene.player.hand[0];
                        if (nextCard) {
                            // smarter check, fieldTypes is an array of length 2
                            let plantNext = fieldTypes.findIndex( fieldType => (fieldType === utils.getAssetNameWithoutSize(nextCard.texture.key) || fieldType === config.CONSTANTS.EMPTY_FIELD)) != -1
                            if (plantNext && cardsPlayed < 2) {
                                nextCard.setInteractive();
                                scene.input.setDraggable(nextCard);
                            } else {
                                scene.phase++;
                            }
                        } else {
                            scene.phase++;
                        }
                        
                        scene.socket.emit('enableFlipCards');
                    } else if (scene.phase === 1) {
                        // delete from scene.openCards
                        self.removeFromOpenCards(gameObject);
            
                        // if you click "trade" button OR scene.openCards === 0 then increment phase
                        if (scene.openCards.length === 0) {
                            scene.phase++;
                        }
                    }
                }
                scene.socket.emit('cardPlayed', gameObject, scene.player);

                if (scene.phase === 2) {
                    scene.socket.emit('enableTrades', scene.player.id);
                    scene.socket.emit('enableTakeThree');
                    scene.phase++;
                }
            } else {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        }
        
        this.dropOnDiscard = function(gameObject) {
            let allowed = false;
            let playerFields = scene.player.fields;

            for (let field in playerFields) {
                if (scene.phase === 1 && utils.isFieldEmpty(playerFields[field]) && playerFields[field].cardCount === 0) {
                    allowed = true;
                    break;
                }
            }
        
            if (allowed) {
                self.discardCard(gameObject, config.CONSTANTS.ENTRY_POINTS.OPEN_CARDS, true, null, false);
            } else {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        }

        this.discardCard = function(gameObject, entryPoint = null, addToDiscardPile = true, fieldIndex = null, emptyField = false) {
            gameObject.disableInteractive();
            let cardDiscarded = utils.getAssetNameWithoutSize(gameObject.texture.key);
            if (addToDiscardPile) {
                gameObject.x = scene.discardPile.image.x;
                gameObject.y = scene.discardPile.image.y;
                scene.children.bringToTop(gameObject);
                // scene.discardPile.list.push(gameObject);
            }
            if (entryPoint === config.CONSTANTS.ENTRY_POINTS.OPEN_CARDS) {
                self.removeFromOpenCards(gameObject);
                scene.discardPile.list.push(gameObject);

                if (scene.openCards.length === 0) {
                    scene.phase++;
                }                
            } else if (entryPoint === config.CONSTANTS.ENTRY_POINTS.FIELD) {
                if (!addToDiscardPile) {
                    gameObject.destroy();
                } else {
                    scene.discardPile.list.push(gameObject);
                }
                // change field settings
                // this is where i need to destroy gameObject if not addToDiscardPile
            }

            // need to add it to discard pile array and emit to update it for everyone
            scene.socket.emit('cardDiscarded', cardDiscarded, scene.player, entryPoint, addToDiscardPile, fieldIndex, emptyField);

            if (scene.phase === 2) {
                scene.socket.emit('enableTrades', scene.player.id);
                scene.socket.emit('enableTakeThree');
                scene.phase++;
            }
        }
        
        this.dropToTradeFromDeck = function(gameObject, player) {
            // check if it can be traded with that player
            let availableField = utils.getAvailableField(scene.otherPlayers[player].fields, gameObject.texture.key);
            if (availableField) {
                if (scene.phase === 1) {
                    let index = self.removeFromOpenCards(gameObject);
                    scene.socket.emit('tradeCard', gameObject, scene.player.id, player, true, false, index);
                    if (scene.openCards.length === 0) {
                        scene.phase++;
                    }
                    gameObject.destroy();
                    
                    if (scene.phase === 2) {
                        scene.socket.emit('enableTrades', scene.player.id);
                        scene.socket.emit('enableTakeThree');
                        scene.phase++;
                    }
                }
            } else {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        }

        this.dropToTradeFromHand = function(gameObject, player) {
            // check if it can be traded with that player
            let availableField = utils.getAvailableField(scene.otherPlayers[player].fields, utils.getAssetNameWithoutSize(gameObject.texture.key));
            if (availableField) {
                let index = scene.player.hand.indexOf(gameObject);
                scene.socket.emit('tradeCard', gameObject, scene.player.id, player, false, true, index);
                scene.player.hand.splice(index, 1);
                scene.dealer.shiftHandUp(index, 1);
                gameObject.destroy();
            } else {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        }

        scene.input.on('drop', function(pointer, gameObject, dropZone) {
            if (scene.phase < 2 && dropZone.name === scene.player.fieldZone.name) {
                self.dropOnField(gameObject, false);
            } else if (scene.phase === 1 && dropZone.name === scene.discardPile.dropZone.name) {
                self.dropOnDiscard(gameObject);
            } else if (scene.phase === 1 && scene.otherPlayers[dropZone.name]){
                self.dropToTradeFromDeck(gameObject, dropZone.name);
            } else if (scene.phase === 3 && dropZone.name === scene.playerTurn.id) {
                self.dropToTradeFromHand(gameObject, dropZone.name);
            } else {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        });

        this.plant = function() {
            utils.showDOMElementsByIds(scene.fieldText, ['plantFirstText']);
            utils.hideDOMElementsByIds(scene.fieldText, ['plantAnotherText']);
            cardsPlayed = 0;
            let firstCard = scene.player.hand[0];
            if (firstCard) {
                firstCard.setInteractive();
                scene.input.setDraggable(firstCard);
            } else {
                scene.phase++;
                scene.socket.emit('enableFlipCards');
            }
        }

        this.flipCards = function(deckToFlip) {
            utils.showDOMElementsByIds(scene.deckText, ['flipCardsText']);
            utils.hideDOMElementsByIds(scene.deckText, ['takeThreeText']);
            scene.deck.setInteractive();
            scene.deck.on('pointerdown', function() {
                utils.hideDOMElementsByIds(scene.deckText, ['flipCardsText']);
                utils.hideDOMElementsByIds(scene.fieldText,['plantAnotherText']);
                if (scene.phase === 0) scene.phase++;
                if (scene.player.hand.length) scene.player.hand[0].disableInteractive();
                deck = deckToFlip;
                scene.dealer.flipCards(deck);
            });
        }

        this.disableFlipCards = function() {
            scene.deck.disableInteractive();
            scene.deck.removeAllListeners();
        }

        this.enableTradeFromHand = function() {
            scene.phase = 3;
            scene.player.hand.forEach( function(card) {
                card.setInteractive();
                scene.input.setDraggable(card);
            });
        }

        this.disableTradeFromHand = function() {
            scene.player.hand.forEach( function(card) {
                card.disableInteractive();
            });
        }

        this.takeThree = function(deck) {
            utils.hideDOMElementsByIds(scene.deckText, ['flipCardsText']);
            utils.showDOMElementsByIds(scene.deckText, ['takeThreeText']);
            scene.deck.setInteractive();
            scene.deck.on('pointerdown', function() {
                utils.hideDOMElementsByIds(scene.deckText, ['takeThreeText']);
                scene.socket.emit('disableTrades');
                scene.dealer.takeThree(deck);
            });
        }
    };
}
