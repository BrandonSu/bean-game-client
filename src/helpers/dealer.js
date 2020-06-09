import Card from './card';
import utils from './utils';
import config from './config';

export default class Dealer {
    constructor(scene) {
        this.dealCards = function(deck) {
            let beanName;
            for (let i = 0; i < 5; i++) {
                beanName = deck[0];
                deck.splice(0, 1);

                let playerCard = new Card(scene);
                scene.player.hand.push(playerCard.render(50 + i * 120, scene.height - 100, beanName, 0, 0.5));
            }
            scene.socket.emit('updateDeck', deck);
        }

        this.setup = function(deck, playerOrder) {
            scene.playerCountText.destroy();
            scene.startText.destroy();

            // add start here for player
            scene.startHere = scene.add.image(0, scene.height - 100, 'startHere').setOrigin(0, 0.5).setScale(0.5).disableInteractive();

            scene.deck = scene.add.image(scene.width / 2 - 200, scene.height / 2, 'deck').setOrigin(0, 0.5).setScale(0.25).disableInteractive();
            
            // middle deck
            scene.add.image(scene.width / 2 - 60, scene.height / 2, 'drawnFirst').setOrigin(0, 0.5).setScale(0.25).setInteractive();
            scene.add.image(scene.width / 2 + 60, scene.height / 2, 'drawnSecond').setOrigin(0, 0.5).setScale(0.25).setInteractive();
            scene.discardPile = {
                image: scene.add.image(scene.width / 2 + 200, scene.height / 2, 'discardPile').setOrigin(0, 0.5).setScale(0.25),
                dropZone: scene.zone.renderZone(scene.width / 2 + 260, scene.height / 2, 150, 215, 'discardZone'),
                list: []
            };

            // player fields
            scene.add.image(50, scene.height / 2, 'field').setOrigin(0, 0.5).setScale(0.25).setInteractive();
            scene.player.fields[0].counterText = scene.add.text(108, scene.height / 2 + 105, [scene.player.fields[0].cardCount]).setOrigin(0.5).setFontSize(25).setFontFamily('Bodoni Highlight').setColor('#fad550');
            scene.add.image(175, scene.height / 2, 'field').setOrigin(0, 0.5).setScale(0.25).setInteractive();
            scene.player.fields[1].counterText = scene.add.text(233, scene.height / 2 + 105, [scene.player.fields[1].cardCount]).setOrigin(0.5).setFontSize(25).setFontFamily('Bodoni Highlight').setColor('#fad550');

            // player name + coins
            scene.add.text(scene.width - 130, 35, [scene.player.name]).setOrigin(0.5).setFontSize(25).setFontFamily('Bodoni Highlight').setColor('#fad550');
            scene.add.image(scene.width - 158, 75, 'coin').setOrigin(0, 0).setScale(0.15);
            scene.coinCount = scene.add.text(scene.width - 125, 150, [scene.player.coins]).setOrigin(0.5).setFontSize(25).setFontFamily('Bodoni Highlight').setColor('#fad550');

            scene.dashboard = scene.add.dom(scene.width - 150, scene.height / 2).setOrigin(0.5).createFromCache('dashboard');
            utils.toggleDisplay(scene.dashboard.getChildByID('endGameButton'));

            scene.dashboard.getChildByID('harvestFieldButton').addEventListener('click', function() {
                utils.resetHarvestFieldButtonDisplay(scene);
            });

            scene.dashboard.getChildByID('leftFieldButton').addEventListener('click', function() {
                scene.harvest.harvestField(config.CONSTANTS.FIELD_INDEX.LEFT_FIELD);
            });

            scene.dashboard.getChildByID('rightFieldButton').addEventListener('click', function() {
                scene.harvest.harvestField(config.CONSTANTS.FIELD_INDEX.RIGHT_FIELD);
            });
            
            scene.placementConfig = utils.getPlacementVariables(Object.keys(scene.otherPlayers).length);

            // other players' fields
            let i = 0;
            // player is each playerId
            for (let player in scene.otherPlayers) {
                if (player != scene.player.id) {
                    scene.add.text(
                        scene.placementConfig.nameOffset.x + scene.placementConfig.distanceBetweenFields * i, 
                        scene.placementConfig.nameOffset.y, [scene.otherPlayers[player].name]
                    ).setOrigin(0.5).setFontSize(18).setFontFamily('Bodoni Highlight').setColor('#fad550');
                    scene.otherPlayers[player].coinStack = {
                        x: scene.placementConfig.nameOffset.x + scene.placementConfig.distanceBetweenFields * i - 45,
                        y: scene.placementConfig.nameOffset.y
                    }

                    scene.otherPlayers[player].fields[0].placemat = scene.add.image(
                        scene.placementConfig.cardOffset.x + scene.placementConfig.distanceBetweenFields * i, 
                        scene.placementConfig.cardOffset.y, 'field'
                    ).setOrigin(0, 0).setScale(scene.placementConfig.scale).setInteractive();
                    
                    scene.otherPlayers[player].fields[1].placemat = scene.add.image(
                        125 + scene.placementConfig.distanceBetweenFields * i, 
                        scene.placementConfig.cardOffset.y, 'field'
                    ).setOrigin(0, 0).setScale(scene.placementConfig.scale).setInteractive();

                    scene.otherPlayers[player].fields[0].x = scene.placementConfig.cardOffset.x + scene.placementConfig.distanceBetweenFields * i;
                    scene.otherPlayers[player].fields[0].y = scene.placementConfig.cardOffset.y;
                    scene.otherPlayers[player].fields[0].cards = [];
                    scene.otherPlayers[player].fields[0].counterText = scene.add.text(
                        83 - scene.placementConfig.counterOffset.x + scene.placementConfig.distanceBetweenFields * i, 
                        scene.placementConfig.counterOffset.y + scene.placementConfig.cardOffset.y, 
                        [scene.otherPlayers[player].fields[0].cardCount]
                    ).setOrigin(0.5).setFontSize(18).setFontFamily('Bodoni Highlight').setColor('#fad550');
                    
                    
                    scene.otherPlayers[player].fields[1].x = 125 + scene.placementConfig.distanceBetweenFields * i;
                    scene.otherPlayers[player].fields[1].y = scene.placementConfig.cardOffset.y;
                    scene.otherPlayers[player].fields[1].cards = [];
                    scene.otherPlayers[player].fields[1].counterText = scene.add.text(
                        160 + scene.placementConfig.counterOffset.x + scene.placementConfig.distanceBetweenFields * i, 
                        scene.placementConfig.counterOffset.y + scene.placementConfig.cardOffset.y, 
                        [scene.otherPlayers[player].fields[1].cardCount]
                    ).setOrigin(0.5).setFontSize(18).setFontFamily('Bodoni Highlight').setColor('#fad550');

                    scene.otherPlayers[player].fieldZone = scene.zone.renderZone(120 + scene.placementConfig.distanceBetweenFields * i, 95, 175, 175, player);
                }
                i++;
            }
        }

        this.flipCards = function(deck) {
            scene.openCards.forEach(function(card) { card.destroy(); });
            scene.openCards = [];
            deck.splice(0, 2).forEach(function(card, i) {
                scene.openCards.push(new Card(scene).render(scene.width / 2 - 60 + (120 * i), scene.height / 2, card, 0, 0.5));
            })
            scene.openCards.forEach(function(card) {
                if (!card.scene) card.scene = scene;
                card.setInteractive();
                scene.input.setDraggable(card);
            });
            scene.deck.disableInteractive();
            scene.socket.emit('updateDeck', deck);
            scene.socket.emit('updateOpenCards', scene.openCards);
            scene.socket.emit('disableFlipCards');
        }

        this.updateOpenCards = function(openCards) {
            scene.openCards.forEach(card => card.destroy());
            openCards.forEach((card) => {
                scene.openCards.push(new Card(scene).render(card.x, card.y, card.textureKey, card.origin.x, card.origin.y));
            });
        }

        this.takeThree = function(deck) {
            let numOfCardsHand = scene.player.hand.length;
            for (let i = 0; i < 3; i++) {
                scene.player.hand.push(new Card(scene).render(50 + (numOfCardsHand + i) * 120, scene.height - 100, deck[i], 0, 0.5).disableInteractive());
            }
            deck.splice(0, 3);
            scene.deck.disableInteractive();
            scene.deck.removeAllListeners();
            scene.socket.emit('updateDeck', deck);
            // disable everyone's cards so they can't trade them anymore

            // emit that it's next player's turn
            scene.socket.emit('endTurn', scene.player.order);
        }

        this.shiftHandUp = function(startingIndex, spots) {
            for (let i = startingIndex; i < scene.player.hand.length; i++) {
                scene.player.hand[i].x -= (120 * spots);
            }
        }

        this.shiftHandDown = function(startingIndex, spots) {
            for (let i = startingIndex; i < scene.player.hand.length; i++) {
                scene.player.hand[i].x += (120 * spots);
            }
        }
    }
}
