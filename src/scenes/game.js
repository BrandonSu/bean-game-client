import Zone from "../helpers/zone";
import Dealer from "../helpers/dealer";
import Turn from "../helpers/turn";
import Harvest from "../helpers/harvest";
import config from "../helpers/config";
import utils from "../helpers/utils";
import io from "socket.io-client";

export default class Game extends Phaser.Scene {
  constructor() {
    super({
      key: "Game",
    });
  }

  preload() {
    this.load.image("cocoaBeanSmall", "src/assets/images/4-cocoa_small.png");
    this.load.image("gardenBeanSmall", "src/assets/images/6-garden_small.png");
    this.load.image("redBeanSmall", "src/assets/images/8-red_small.png");
    this.load.image(
      "blackEyedBeanSmall",
      "src/assets/images/10-black-eyed_small.png"
    );
    this.load.image("soyBeanSmall", "src/assets/images/12-soy_small.png");
    this.load.image("greenBeanSmall", "src/assets/images/14-green_small.png");
    this.load.image("stinkBeanSmall", "src/assets/images/16-stink_small.png");
    this.load.image("chiliBeanSmall", "src/assets/images/18-chili_small.png");
    this.load.image("blueBeanSmall", "src/assets/images/20-blue_small.png");
    this.load.image("waxBeanSmall", "src/assets/images/22-wax_small.png");
    this.load.image("coffeeBeanSmall", "src/assets/images/24-coffee_small.png");

    this.load.image("cocoaBeanLarge", "src/assets/images/4-cocoa_large.png");
    this.load.image("gardenBeanLarge", "src/assets/images/6-garden_large.png");
    this.load.image("redBeanLarge", "src/assets/images/8-red_large.png");
    this.load.image(
      "blackEyedBeanLarge",
      "src/assets/images/10-black-eyed_large.png"
    );
    this.load.image("soyBeanLarge", "src/assets/images/12-soy_large.png");
    this.load.image("greenBeanLarge", "src/assets/images/14-green_large.png");
    this.load.image("stinkBeanLarge", "src/assets/images/16-stink_large.png");
    this.load.image("chiliBeanLarge", "src/assets/images/18-chili_large.png");
    this.load.image("blueBeanLarge", "src/assets/images/20-blue_large.png");
    this.load.image("waxBeanLarge", "src/assets/images/22-wax_large.png");
    this.load.image("coffeeBeanLarge", "src/assets/images/24-coffee_large.png");

    this.load.image("fieldLarge", "src/assets/images/field_large.png");
    this.load.image("fieldSmall", "src/assets/images/field_small.png");
    this.load.image("coin", "src/assets/images/coin.png");
    this.load.image("drawnFirst", "src/assets/images/1st-drawn_large.png");
    this.load.image("drawnSecond", "src/assets/images/2nd-drawn_large.png");
    this.load.image("discardPile", "src/assets/images/discard-pile_large.png");
    this.load.image("startHere", "src/assets/images/start-here.png");
    this.load.image("deck", "src/assets/images/deck_large.png");
    this.load.image("table", "src/assets/images/table.jpg");

    this.load.html("nameform", "src/assets/html/name-form.html");
    this.load.html("deckText", "src/assets/html/deck-text.html");
    this.load.html("fieldText", "src/assets/html/field-text.html");
    this.load.html("dashboard", "src/assets/html/dashboard.html");
    this.load.html("harvestPopup", "src/assets/html/harvest-popup.html");
    this.load.html("tradePopup", "src/assets/html/trade-popup.html");
    this.load.html("playerName", "src/assets/html/player-name.html");
  }

  create() {
    let self = this;
    this.add.image(0, 0, "table").disableInteractive();
    for (let i = 1; i < 8; i++) {
      this["isPlayer" + i] = false;
    }
    this.height = 650;
    this.width = 1300;

    this.zone = new Zone(this);
    this.dealer = new Dealer(this);
    this.turn = new Turn(this);
    this.harvest = new Harvest(this);

    this.player = {
      name: "",
      id: "",
      coins: 0,
      hand: [],
      fieldZone: self.zone.renderZone(
        170,
        self.height / 2,
        330,
        240,
        "fieldZone"
      ),
      fields: [
        {
          fieldType: config.CONSTANTS.EMPTY_FIELD,
          cardCount: 0,
          x: 50,
          y: self.height / 2,
          counterText: null,
          cards: [],
        },
        {
          fieldType: config.CONSTANTS.EMPTY_FIELD,
          cardCount: 0,
          x: 175,
          y: self.height / 2,
          counterText: null,
          cards: [],
        },
      ],
      order: 0,
    };

    this.rounds = 0;
    this.numberOfPlayers = 0;
    this.otherPlayers = {};
    this.openCards = [];
    this.playerTurn;
    this.phase = 0;

    this.playerCountText = this.add
      .text(self.width / 2, self.height / 2 - 25, [
        self.numberOfPlayers + " players ready",
      ])
      .setOrigin(0.5)
      .setFontSize(25)
      .setFontFamily("Bodoni Highlight")
      .setColor("#fad550")
      .setInteractive()
      .setVisible(false);
    this.startText = this.add
      .text(self.width / 2, self.height / 2 + 25, ["START GAME"])
      .setOrigin(0.5)
      .setFontSize(25)
      .setFontFamily("Bodoni Highlight")
      .setColor("#fad550")
      .setInteractive()
      .setVisible(false);

    // SOCKET STUFF
    // env vars don't get passed in from server.js

    process.env.SERVER = "https://b11f64c6f1ab.ngrok.io";

    this.socket = io(process.env.SERVER || "http://localhost:2000/");
    this.socket.on("connect", function () {
      console.log("Connected: " + self.socket.id);
      self.player.id = self.socket.id;
    });

    // LANDING PAGE
    let nameForm = this.add
      .dom(self.width / 2, self.height / 2 - 25)
      .createFromCache("nameform");
    document.getElementById("goButton").addEventListener("click", function () {
      let name = document.getElementById("nameField").value;
      if (name.length > 0) {
        self.player.name = name;
        self.playerCountText.setVisible(true);
        // if (self.numberOfPlayers === 1) {
        self.startText.setVisible(true);
        // }
        nameForm.destroy();
        self.socket.emit("newPlayerName", self.socket.id, self.player);
      } else {
        document.querySelector("#inputContainer h1").style.color = "#dc201f";
      }
    });

    this.startText.on("pointerdown", function () {
      self.socket.emit("startGame");
    });

    this.startText.on("pointerover", function () {
      self.startText.setColor("#dc201f");
    });

    this.startText.on("pointerout", function () {
      self.startText.setColor("#fad550");
    });

    this.socket.on("newPlayer", function (playerNumber) {
      self["isPlayer" + playerNumber] = true;
      self.player.order = playerNumber;
    });

    this.socket.on("playerChange", function (numberOfPlayers, playersObject) {
      self.numberOfPlayers = numberOfPlayers;
      self.playerCountText.setText(self.numberOfPlayers + " players ready");
      self.otherPlayers = utils.getPlayersExcept(playersObject, self.socket.id);
    });

    this.socket.on("enableFlipCards", function (deck) {
      self.turn.flipCards(deck);
    });

    this.socket.on("disableFlipCards", function () {
      self.turn.disableFlipCards();
    });

    this.socket.on("enableTakeThree", function (deck) {
      self.turn.takeThree(deck);
    });

    this.socket.on("updateOpenCards", function (openCards) {
      self.dealer.updateOpenCards(openCards);
    });

    this.socket.on("startGame", function (deck) {
      self.dealer.setup(deck, 0);
    });

    this.socket.on("dealCards", function (deck, nextPlayerIndex) {
      self.dealer.dealCards(deck);
      self.socket.emit("dealNextPlayer", nextPlayerIndex);
    });

    this.socket.on("startTurn", function (nextPlayerIndex) {
      self.turn.plant();
    });

    this.socket.on("updatePlayerTurn", function (playerId) {
      self.phase = 0;
      Object.keys(self.otherPlayers).forEach(
        (id) =>
          (self.otherPlayers[id].nameElement.getChildByID("name").style.color =
            "#ffffff")
      );
      if (self.otherPlayers[playerId]) {
        self.playerTurn = self.otherPlayers[playerId];
        self.otherPlayers[playerId].nameElement.getChildByID(
          "name"
        ).style.color = "#fad550";
        utils.hideDOMElementsByIds(self.dashboard, ["yourTurn"]);
        if (
          utils.checkPlayerTurnNext(
            self.player,
            self.playerTurn,
            self.otherPlayers
          )
        ) {
          utils.showDOMElementsByIds(self.dashboard, ["yourTurnNext"]);
        }
      } else {
        self.playerTurn = self.player;
        utils.showDOMElementsByIds(self.dashboard, ["yourTurn"]);
        utils.hideDOMElementsByIds(self.dashboard, ["yourTurnNext"]);
      }
    });

    this.socket.on("updateCoinStack", function (playerId, assetSrc) {
      self.otherPlayers[playerId].nameElement.getChildByID(
        "coinstack"
      ).src = assetSrc;
    });

    this.socket.on("cardPlayed", function (gameObject, player) {
      let cardPlayed = utils.getAssetNameWithoutSize(gameObject.textureKey);
      if (player.id !== self.player.id) {
        let field = utils.getAvailableField(
          self.otherPlayers[player.id].fields,
          cardPlayed
        );
        if (field) {
          field.cardCount++;
          field.counterText.setText(field.cardCount);
          if (utils.isFieldEmpty(field)) {
            field.fieldType = cardPlayed;
            field.cards.push(
              self.add
                .image(
                  field.x,
                  field.y,
                  utils.adjustAssetSize(
                    cardPlayed,
                    config.CONSTANTS.ASSET_SIZE.SMALL
                  )
                )
                .setOrigin(0, 0)
            );
          }
        }
      }
    });

    // need event to update view for other players when fields are harvested (similar to cardPlayed)
    this.socket.on("cardDiscarded", function (
      cardDiscarded,
      player,
      entryPoint,
      addToDiscardPile,
      fieldIndex,
      emptyField
    ) {
      // adding to discardPile list so we can destroy images when we shuffle
      if (player.id !== self.player.id) {
        if (addToDiscardPile) {
          self.discardPile.list.push(
            self.add
              .image(
                self.width / 2 + 200,
                self.height / 2,
                utils.adjustAssetSize(
                  cardDiscarded,
                  config.CONSTANTS.ASSET_SIZE.LARGE
                )
              )
              .setOrigin(0, 0.5)
          );
        }

        if (entryPoint === config.CONSTANTS.ENTRY_POINTS.FIELD) {
          // need to broadcast to other players that your field has changed
          // remove gameObject from your field
          // this is where we discard the fields for other players
          let field = self.otherPlayers[player.id].fields[fieldIndex];
          if (field) {
            field.cardCount--;
            field.counterText.setText(field.cardCount);

            if (emptyField) {
              let cardDeleted = field.cards.splice(0, 1)[0];
              if (cardDeleted) cardDeleted.destroy();
            }

            if (field.cardCount === 0) {
              field.fieldType = config.CONSTANTS.EMPTY_FIELD;
            }
          }
        }
      }
    });

    this.socket.on("cardTraded", function (gameObject) {
      self.turn.dropOnField(gameObject, true);
    });

    this.socket.on("requestTrade", function (
      gameObject,
      fromPlayer,
      fromDeck,
      fromHand,
      index
    ) {
      self.turn.requestTrade(gameObject, fromPlayer, fromDeck, fromHand, index);
    });

    this.socket.on("tradeRejected", function (
      playerRejectingTrade,
      gameObject,
      fromDeck,
      fromHand,
      index
    ) {
      self.turn.handleRejectedTrade(
        playerRejectingTrade,
        gameObject,
        fromDeck,
        fromHand,
        index
      );
    });

    this.socket.on("enableTradingWithPlayer", function (player) {
      self.turn.enableTradeFromHand(player);
    });

    this.socket.on("disableTradingWithPlayer", function () {
      self.turn.disableTradeFromHand();
    });

    this.socket.on("reshuffleWarning", function () {
      window.alert(config.CONSTANTS.ALERT_MESSAGES.RESHUFFLE_WARNING);
    });

    this.socket.on("reshuffleSuccess", function (roundsRemaining) {
      let replaceText;
      if (roundsRemaining === 1) {
        replaceText = "1 round remaining";
      } else if (roundsRemaining === 0) {
        replaceText = "last round";
      }

      window.alert(
        config.CONSTANTS.ALERT_MESSAGES.RESHUFFLE_SUCCESS.replace(
          "REPLACE_TEXT",
          replaceText
        )
      );
      self.discardPile.list.forEach((discardedCard) => discardedCard.destroy());
      self.discardPile.list = [];
    });

    this.socket.on("gameEndingWarning", function () {
      window.alert(config.CONSTANTS.ALERT_MESSAGES.GAME_ENDING_WARNING);
    });

    this.socket.on("gameEnded", function () {
      window.alert(config.CONSTANTS.ALERT_MESSAGES.GAME_ENDED);
      utils.toggleDisplay(self.dashboard.getChildByID("endGameButton"));
      self.dashboard
        .getChildByID("endGameButton")
        .addEventListener("click", function () {
          console.log("game ended for player", self.player.id);
          self.player.hand.forEach((card) => card.destroy());
          self.player.hand = [];
          self.dashboard.destroy();
          self.socket.emit(
            "gameEndedForPlayer",
            self.player.id,
            self.player.coins
          );
        });
    });

    this.socket.on("gameEndedForPlayer", function (playerId, score) {
      self.otherPlayers[playerId].fields.forEach((field) => {
        field.placemat.destroy();
        field.counterText.destroy();
        field.cards.forEach((card) => card.destroy());
      });
      self.otherPlayers[playerId].nameElement.getChildByID("coinstack").src =
        "";
      self.add
        .image(self.otherPlayers[playerId].fields[0].x + 70, 70, "coin")
        .setOrigin(0.5, 0);
      self.add
        .text(self.otherPlayers[playerId].fields[0].x + 70, 150, [score])
        .setOrigin(0.5)
        .setFontSize(18)
        .setFontFamily("Bodoni Highlight")
        .setColor("#fad550");
    });
  }
}
