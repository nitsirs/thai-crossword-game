import { Server } from 'boardgame.io/server';
import path from 'path';
import serve from 'koa-static';

const { Game } = require('./src/game');
// setup custom alphabet nanoid
const { nanoid } = require('nanoid');
const customAlphabet = require('nanoid/non-secure').customAlphabet;
const alphabet = '0123456789';
const nanoidCustom = customAlphabet(alphabet, 6);
const server = Server({ games: [Game] ,uuid: nanoidCustom });
const PORT = process.env.PORT || 8000;

// Build path relative to the server.js file
const frontEndAppBuildPath = path.resolve(__dirname, './dist');
server.app.use(serve(frontEndAppBuildPath))

server.run(PORT, () => {
  server.app.use(
    async (ctx, next) => await serve(frontEndAppBuildPath)(
      Object.assign(ctx, { path: 'index.html' }),
      next
    )
  )
});
