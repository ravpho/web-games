# web-games
Simple games for kids

| Game | Folder | What it is |
|---|---|---|
| Straw Hat Showdown | [`straw-hat-showdown/`](straw-hat-showdown/) | One-on-one fighting game for phones with four *One Piece* characters (unofficial fan game) |

## Run locally

The games are plain HTML, CSS and JavaScript with no build step. Serve the repo root with any static file server, for example:

```sh
npm start            # same as: npx serve -l 8080 .
```

Then open <http://localhost:8080/> and pick a game. To try the touch controls on a desktop browser, turn on device emulation (a phone, held sideways) in the developer tools.

## Tests

The fight logic has unit tests that run in Node 22 with no dependencies:

```sh
npm test             # same as: node --test
```
