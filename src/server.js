const { Server, Origins } = require('boardgame.io/server');
const { Game } = require('./game');

const server = Server({
  games: [Game],
});

server.run(8000);