import Phaser from "phaser";
import { Client } from "boardgame.io/client";
import { Game } from "./game";
import { Local } from "boardgame.io/multiplayer";
import images from "./assets/*.png";
import characters from "./assets/characters/*.png";
import { characterScore, defaultVal, unlimitedSet, score } from "./boardInfo";
import vowels from "./assets/vowels/*.png";
import { SocketIO } from "boardgame.io/multiplayer";
import { LobbyClient } from "boardgame.io/client";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";

// Create and start a boardgame.io client.
const boardOffset = [96, 64];
let playerID;
let matchID;
let playerCredential = null;
let vowelTab;
let charTab;
let board;
let char_card;
let char_group;
let vowel_card;
let vowel_group;
let board_group;
let timerText;
let timer;
let negativeTimer;
let scoreText;
let myScore;
let timeLoop = 0;
let timePass;
let blink;
const gameTime = 1320000;
let endTurnText;
let gameOver;
let challenge;
let cell;
let newCells;
let loadDelay;
let matchIDText;

function formatTime(seconds) {
  // Minutes
  let minutes = Math.floor(seconds / 60);
  // Seconds
  let partInSeconds = Math.floor(seconds % 60);
  // Adds left zeros to seconds
  minutes = minutes.toString().padStart(2, "0");
  partInSeconds = partInSeconds.toString().padStart(2, "0");
  // Returns formated time
  return `${minutes}:${partInSeconds}`;
}

// Scrollable panel
const COLOR_PRIMARY = 0x4e342e;
const COLOR_LIGHT = 0x7b5e57;
const COLOR_DARK = 0x260e04;

const bgioClient = Client({
  game: Game,
  multiplayer: SocketIO({ server: "https://crossword.nitsir.com/" }),
  playerID,
  matchID,
  playerCredential,
});
const lobbyClient = new LobbyClient({
  server: "https://crossword.nitsir.com/",
});
let state;
let stack;

// disconnect from the server
async function exit() {
  console.log("leave match", matchID);
  await lobbyClient.leaveMatch("default", matchID, {
    playerID: playerID,
    credentials: playerCredential,
  });
  bgioClient.stop();
}
// trigger function on refresh
window.onbeforeunload = function () {
  exit();
};

class BoardScene extends Phaser.Scene {
  constructor() {
    super("BoardScene");
  }
  preload() {}
  create() {
    console.log("create");
    // Get state from boardgame.io and use it if available.
    board = this.add.image(0, 0, "board").setOrigin(0, 0);
    charTab = this.add.image(25, 560, "tab").setOrigin(0, 0);
    vowelTab = this.add.image(350, 560, "tab").setOrigin(0, 0);
    char_group = this.add.group();
    vowel_group = this.add.group();
    board_group = this.add.group();
    timer = this.time.addEvent({
      delay: gameTime, // ms
      loop: true,
      callback: setTimeOut,
      paused: true,
    });
    function setTimeOut() {
      timeLoop++;
    }

    this.add.text(10, 10, `match ID ${bgioClient.matchID}`);

    scoreText = this.add.text(
      3,
      80,
      `Score\n${formatTime(timer.getRemainingSeconds())}`,
      {
        fontSize: "20px",
        fontStyle: "bold",
        backgroundColor: "#fff",
        color: "#de2651",
        padding: 5,
        align: "center",
      }
    );

    timerText = this.add.text(
      3,
      150,
      `Time\n${formatTime(timer.getRemainingSeconds())}`,
      {
        fontSize: "20px",
        backgroundColor: "#de2651",
        padding: 5,
        align: "center",
      }
    );
    blink = this.tweens.add({
      targets: timerText,
      alpha: "0.6",
      ease: "Linear",
      duration: 100,
      repeat: -1,
      yoyo: true,
    });

    endTurnText = this.add.text(5, 200, `Click\nto end turn`, {
      fontSize: "10px",
      align: "center",
      fontStyle: "bold",
    });

    // map stack
    function mapStack(obj, stack) {
      console.log("mapStack");
      stack.map((char, index) => {
        char_card = obj.add
          .sprite(30 + index * 32, 550, char.charAt(0))
          .setOrigin(0, 0);
        char_card.displayWidth = 32;
        char_card.displayHeight = 32;
        char_card.setInteractive();
        char_card.setData("type", "char");
        char_card.setData("index", index);
        char_card.setData("char", char);
        obj.input.setDraggable(char_card);
        char_group.add(char_card);
      });
    }

    // map board
    function mapBoard(obj, board, newCells) {
      console.log("mapBoard");
      board.map((row, rowIndex) => {
        row.map((char, colIndex) => {
          if (typeof char === "string" && char !== "2x" && char !== "3x") {
            // if vowel
            if (unlimitedSet.includes(char)) {
              vowel_card = obj.add
                .sprite(
                  boardOffset[0] + colIndex * 32,
                  boardOffset[1] - 16 + rowIndex * 24,
                  char.charAt(0)
                )
                .setOrigin(0, 0);
              vowel_card.displayWidth = 32;
              vowel_card.displayHeight = 16;
              vowel_card.setInteractive();
              vowel_card.setData("type", "vowel");
              vowel_card.setData("char", char);
              vowel_card.setData("row", rowIndex);
              vowel_card.setData("col", colIndex);
              obj.input.setDraggable(vowel_card);
              board_group.add(vowel_card);
            } else {
              char_card = obj.add
                .sprite(
                  boardOffset[0] + colIndex * 32,
                  boardOffset[1] + (rowIndex - 1) * 24,
                  char.charAt(0)
                )
                .setOrigin(0, 0);
              char_card.displayWidth = 32;
              char_card.displayHeight = 32;
              char_card.setInteractive();
              char_card.setData("type", "char");
              char_card.setData("row", rowIndex);
              char_card.setData("col", colIndex);
              char_card.setData("char", char);
              if (newCells[rowIndex][colIndex] === 1) {
                obj.input.setDraggable(char_card);
                char_card.setData("new", true);
              } else {
                char_card.setData("new", false);
              }

              board_group.add(char_card);
            }
          }
        });
      });
    }
    function addVowelCard(obj, set) {
      set.map((vowel, index) => {
        let row = 0;
        if (index > 5) {
          row = 1;
        }
        vowel_card = obj.add
          .sprite(355 + (index - row * 6) * 32, 550 + row * 20, vowel.charAt(0))
          .setOrigin(0, 0);
        vowel_card.displayWidth = 32;
        vowel_card.displayHeight = 16;
        vowel_card.setInteractive();
        obj.input.setDraggable(vowel_card);
        vowel_card.setData("type", "vowel");
        vowel_card.setData("char", vowel);
        vowel_group.add(vowel_card);
      });
    }
    addVowelCard(this, unlimitedSet);

    gameOver = this.add
      .text(625 / 2, 625 / 2, "", {
        fontSize: "70px",
        fill: "#000",
        fontStyle: "bold",
        backgroundColor: "#fff",
      })
      .setOrigin(0.5, 0.5);

    challenge = this.add.text(0, 250, "Challenge", {
      fontSize: "15px",
      backgroundColor: "#000",
      padding: 3,
      fontStyle: "bold",
      align: "center",
    });
    challenge.setInteractive();
    challenge.on("pointerdown", () => {});

    // save x y position of char_card when drag start
    this.input.on("dragstart", function (pointer, gameObject, dragX, dragY) {
      if (
        !Phaser.Geom.Intersects.RectangleToRectangle(
          board.getBounds(),
          gameObject.getBounds()
        )
      ) {
        gameObject.setData("startX", gameObject.x);
        gameObject.setData("startY", gameObject.y);
      }
      gameObject.setData("startX", gameObject.x);
      gameObject.setData("startY", gameObject.y);
    });
    this.input.on("drag", function (pointer, gameObject, dragX, dragY) {
      gameObject.x = dragX;
      gameObject.y = dragY;
      //check char_card is in the area of board
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          board.getBounds(),
          gameObject.getBounds()
        )
      ) {
        let offset = 0;
        if (gameObject.getData("type") == "char") {
          offset = 16;
        }
        gameObject.x = Phaser.Math.Snap.To(dragX, 32);
        gameObject.y = Phaser.Math.Snap.To(dragY, 48, offset);
      }
    });

    //ondrop
    this.input.on("dragend", function (pointer, gameObject, dragX, dragY) {
      let row = gameObject.getData("row");
      let col = gameObject.getData("col");
      let idx = gameObject.getData("index");
      let replacable = true;
      let canreplace = false;
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          board.getBounds(),
          gameObject.getBounds()
        )
      ) {
        // switch (x,y) => (y,x)
        if (gameObject.getData("type") == "char") {
          let i = (gameObject.y - boardOffset[1]) / 24 + 1;
          let j = (gameObject.x - boardOffset[0]) / 32;

          if (
            !defaultVal.includes(cell[i][j]) &&
            !(newCells[i][j] === 1) &&
            !(i < 1 || j < 0 || i > 17 || j > 14)
          ) {
            canreplace = confirm(
              "Are you sure you want to replace this letter?"
            );
            if (!canreplace) {
              replacable = false;
            } else {
              replacable = true;
            }
          }
          if (newCells[i][j] == 1) {
            replacable = false;
          }
          // outside the board
          if (i < 0 || j < 0 || i > 18 || j > 14) {
            replacable = false;
          }
          if (replacable) {
            bgioClient.moves.setChar(
              (gameObject.y - boardOffset[1]) / 24 + 1,
              (gameObject.x - boardOffset[0]) / 32,
              gameObject.getData("char")
            );
          }
        } else if (gameObject.getData("type") == "vowel") {
          let i = (gameObject.y - (boardOffset[1] - 16)) / 24;
          let j = (gameObject.x - boardOffset[0]) / 32;
          if (!(i < 0 || j < 0 || i > 18 || j > 14)) {
            bgioClient.moves.setChar(i, j, gameObject.getData("char"));
          }
        }

        // drag within board
        if (row !== undefined && replacable) {
          bgioClient.moves.setChar(row, col, score[row][col]);
        } else if (idx !== undefined && replacable) {
          // drag from stack to board
          stack = [...bgioClient.getState().G.players[playerID].stack];
          stack.splice(idx, 1);
          bgioClient.moves.setStack(playerID, stack);
        } else {
          gameObject.x = gameObject.getData("startX");
          gameObject.y = gameObject.getData("startY");
        }
        if (canreplace) {
          bgioClient.moves.isReplaced(true);
        }
      } else {
        // drag outside board

        // drag from board to stack

        if (gameObject.getData("type") == "char" && row) {
          stack = [...bgioClient.getState().G.players[playerID].stack];
          stack.push(bgioClient.getState().G.cells[row][col]);
          bgioClient.moves.setStack(playerID, stack);
          bgioClient.moves.setChar(row, col, score[row][col]);
        } else if (gameObject.getData("type") == "vowel" && row) {
          bgioClient.moves.setChar(row, col, score[row][col]);
        } else {
          gameObject.x = gameObject.getData("startX");
          gameObject.y = gameObject.getData("startY");
        }
      }
    });
    console.log(stack);

    function switchTurn() {
      bgioClient.moves.isValidMove();
      bgioClient.moves.setTimePass(playerID, timePass);
      bgioClient.moves.addScore(playerID);
    }

    // end turn
    // timerText click
    timerText.setInteractive();
    timerText.on("pointerdown", () => {
      switchTurn();
      timerText.disableInteractive();
      blink.stop();
      endTurnText.alpha = 0;
      timerText.alpha = 1;
      timer.paused = true;
      this.input.enabled = false;
    });

    // Subscribe to boardgame.io updates.
    bgioClient.subscribe((state) => {
      // Bail out of updates if Phaser isn’t running or there’s no state.
      console.log("subscribe");

      if (!state || !scene.isRunning) return;
      if (state === null) alert("state is null");
      const { G, ctx } = state;
      stack = G.players[playerID].stack;
      cell = G.cells;
      newCells = G.newCells;
      char_group.clear(true, true);
      vowel_group.clear(true, true);
      board_group.clear(true, true);
      mapStack(this, G.players[playerID].stack);
      addVowelCard(this, unlimitedSet);
      mapBoard(this, G.cells, G.newCells);

      // update score
      myScore = G.players[playerID].score.reduce(function (a, b) {
        return a + b;
      }, 0);
      scoreText.setText("Score\n" + myScore);

      // check if player is active
      if (ctx.currentPlayer === playerID) {
        // enable input all child in game
        blink.restart();
        endTurnText.alpha = 1;
        timer.paused = false;
        this.input.enabled = true;
        timerText.setInteractive();
      } else {
        blink.stop();
        endTurnText.alpha = 0;
        timerText.alpha = 1;
        timer.paused = true;
        this.input.enabled = false;
        timerText.disableInteractive();
      }

      // check if game end
      if (ctx.gameover) {
        let result =
          ctx.gameover.winner !== undefined ? ctx.gameover.winner : "draw";
        if (result === playerID) {
          gameOver.setText("You Win");
        } else if (result === "draw") {
          gameOver.setText("Draw");
        } else {
          gameOver.setText("You Lose");
        }
        // bring gameOver to top
        timer.paused = true;
        blink.stop();
        this.input.enabled = false;
        this.children.bringToTop(gameOver);
      }
    });
  }
  update() {
    // update timer
    if (timeLoop > 0) {
      timePass = Math.floor(
        (gameTime / 1000) * (timeLoop - 1) +
          Math.floor(timer.getElapsedSeconds())
      );
      timerText.setText(`Time\n-${formatTime(timePass)}\n`);
    } else {
      timerText.setText(`Time\n${formatTime(timer.getRemainingSeconds())}\n`);
    }
  }
}

// lobby scene
class Lobby extends Phaser.Scene {
  constructor() {
    super("Lobby");
  }
  preload() {
    this.load.image("board", images["board"]);
    Object.keys(characterScore).map((character) => {
      this.load.image(character.charAt(0), characters[character.charAt(0)]);
    });
    unlimitedSet.map((vowel) => {
      this.load.image(vowel.charAt(0), vowels[vowel.charAt(0)]);
    });
    this.load.image("tab", images["tab"]);
  }
  async create() {
    this.add
      .text(625 / 2, 30, "Lobby", {
        fontSize: "32px",
        fill: "#fff",
        align: "center",
      })
      .setOrigin(0.5, 0.5);
    this.add
      .text(625 / 2, 60, "Thai Crossword", {
        fontSize: "22px",
        fill: "#fff",
        align: "center",
      })
      .setOrigin(0.5, 0.5);

    /*const { matchID } = await lobbyClient.createMatch("default", {
      numPlayers: 2,
    });*/

    const createButton = this.add
      .text(625 / 2, 150, "Create Game", {
        fontSize: "30px",
        backgroundColor: "#33e",
        padding: 10,
      })
      .setOrigin(0.5)
      .setInteractive();

    const joinButton = this.add
      .text(625 / 2, 250, "Join Game", {
        fontSize: "30px",
        backgroundColor: "#33e",
        padding: 10,
      })
      .setOrigin(0.5)
      .setInteractive();
    createButton.on("pointerdown", async () => {
      // disable button input for 1 sec
      createButton.disableInteractive();
      setTimeout(() => {
        createButton.setInteractive();
      }, 2000);

      this.scene.start("WaitRoom");
    });
    joinButton.on("pointerdown", async () => {
      matchID = prompt("Enter matchID");
      const { playerCredentials } = await lobbyClient.joinMatch(
        "default",
        matchID,
        { playerName: "player", playerID: "1" }
      );
      playerID = "1";
      playerCredential = playerCredentials;
      console.log(playerID);
      //start bgio client then start board scene
      bgioClient.start();

      bgioClient.updatePlayerID(playerID);
      bgioClient.updateMatchID(matchID);
      bgioClient.updateCredentials(playerCredentials);
      state = bgioClient.getState();
      this.scene.start("BoardScene");
    });
  }
  update() {}
}
class WaitRoom extends Phaser.Scene {
  constructor() {
    super("WaitRoom");
  }
  preload() {}
  async create() {
    this.add
      .text(625 / 2, 30, "Wait Room", {
        fontSize: "32px",
        fill: "#fff",
        align: "center",
      })
      .setOrigin(0.5, 0.5);
    this.add
      .text(625 / 2, 60, "Thai Crossword", {
        fontSize: "22px",
        fill: "#fff",
        align: "center",
      })
      .setOrigin(0.5, 0.5);
    // show matchID in wait room
    this.add
      .text(625 / 2, 230, "MatchID:", {
        fontSize: "22px",
        fill: "#fff",
        align: "center",
      })
      .setOrigin(0.5, 0.5);
    matchIDText = this.add
      .text(625 / 2, 300, matchID, {
        fontSize: "50px",
        fill: "#fff",
        backgroundColor: "#33e",
        padding: 10,
        align: "center",
      })
      .setOrigin(0.5, 0.5);

    matchID = await lobbyClient.createMatch("default", {
      numPlayers: 2,
    });
    matchID = matchID.matchID;
    const { playerCredentials } = await lobbyClient.joinMatch(
      "default",
      matchID,
      { playerName: "player", playerID: "0" }
    );
    playerID = "0";
    playerCredential = playerCredentials;
    console.log(playerCredential);
    bgioClient.start();
    bgioClient.updatePlayerID(playerID);
    bgioClient.updateMatchID(matchID);
    bgioClient.updateCredentials(playerCredentials);
    state = bgioClient.getState();
    const unsubscribe = bgioClient.subscribe((state) => {
      // Bail out of updates if Phaser isn’t running or there’s no state.
      if (!state || !scene.isRunning) return;
      if (state === null) alert("state is null");
      //check if player 1 join
      if (bgioClient.matchData[1].isConnected) {
        this.scene.start("BoardScene");
        unsubscribe();
        console.log("unsubscribe");
      }
    });
  }
  update() {
    matchIDText.setText(matchID);
  }
}

// Create a new Phaser game.
const scene = new Phaser.Game({
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: "phaser-example",
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 625,
    height: 625,
  },
  scene: [Lobby, WaitRoom, BoardScene],
  /*plugins: {
    scene: [
      {
        key: "rexUI",
        plugin: UIPlugin,
        mapping: "rexUI",
      },
      // ...
    ],
  },*/
});
