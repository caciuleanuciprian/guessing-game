# Guessing game

Repository for Guessing game with TCP Server, sockets clients and server sent events observer.

## Project description

Project made mainly with **node.js - net (core library for TCP Server/Sockets)**.

The project is structured in 3 big components: _server.ts_, _client.ts_ and _index.html_.

- **server.ts** is responsible for handling both _TCP_ and _SSE Servers_.
- **client.ts** is responsible for handling the socket connection to **server.ts**.
- **index.html** is just a simple page for displaying ongoing matches by interacting with SSE Server from **server.ts**.

## Tech Stack

I tried to build this project with as little external libraries as possible.

**Client:** Node, net (core library from node)

**Server:** Node, net (core library from node), ws (for SSE Server)

**Dev Dependencies:** tsx, nodemon, live-server, typescript

## Run Locally

Clone the project

```bash
  git clone https://github.com/caciuleanuciprian/guessing-game.git
```

Go to the project directory

```bash
  cd guessing-game
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```

Start a client (preferably atleast 2 so a match can happen)

```bash
  npm run client
```

Start the observer (website to view ongoing matches)

```bash
  npm run observer
```
