import net, { Socket } from "net";
import {
  CMDS,
  SECRET,
  SocketWithID,
  formatData,
  formatDataWithCommand,
  formatDataWithPrefix,
  sendCommand,
  sendCommandWithData,
} from "./consts";
import { format } from "path";

interface Match {
  id: number | string;
  challenger: string | number;
  challenged: string | number;
  attempts: number;
  word: string;
  status: string;
}

enum MatchStatus {
  PENDING = "pending",
  ONGOING = "ongoing",
  FINISHED = "finished",
}

const PORT = 5000;

const sockets: SocketWithID[] = [];
const matches: Match[] = [];

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    if (formatData(data) === CMDS.MENU) {
      sendCommand(socket, CMDS.MENU);
    }
  });

  socket.on("data", (data) => {
    if (formatData(data) === CMDS.COMPETITORS) {
      sendCommandWithData(
        socket,
        CMDS.INFO,
        `Competitors: ${sockets.map((s) => s.id)}`
      );
    }
  });

  socket.on("data", (data) => {
    if (formatData(data) === CMDS.CHALLENGE) {
      sendCommand(socket, CMDS.CHOOSE_COMPETITOR);
    }
  });

  socket.on("data", (data) => {
    if (formatDataWithPrefix(data, CMDS.CHOOSE_COMPETITOR)) {
      const currMatch = matches.find(
        (m) => m.challenger == formatData(data).split(" ")[1]
      );
      console.log(currMatch);
      if (currMatch?.status === MatchStatus.ONGOING) {
        return;
      }
      if (
        matches.find((m) => m.challenger == formatData(data).split(" ")[1]) ||
        matches.find((m) => m.challenged == formatData(data).split(" ")[1])
      ) {
        sendCommandWithData(
          socket,
          CMDS.INFO,
          "This player is already playing!"
        );
        return;
      } else if (sockets.length < 2) {
        sendCommandWithData(socket, CMDS.INFO, "There are no players!");
        return;
      } else {
        // This translates to chooseCompetitor id so we split and get only the id
        sendCommandWithData(
          socket,
          CMDS.START_GAME,
          formatDataWithCommand(data, CMDS.CHOOSE_COMPETITOR)
        );
      }
    }
  });

  socket.on("data", (data) => {
    if (formatDataWithPrefix(data, CMDS.MATCH)) {
      const matchInfo = formatDataWithCommand(data, CMDS.MATCH).split(","); // matchInfo[0] is id of the challenger and matchInfo[1] is id of the challenged
      const match = {
        id: matches.length + 1,
        challenger: matchInfo[0],
        challenged: matchInfo[1],
        attempts: 0,
        word: matchInfo[2],
        status: MatchStatus.PENDING,
      };
      matches.push(match);
      console.log(matches);
      sockets
        .find((s) => s.id == match.challenger)
        ?.socket.write(`${CMDS.MATCH_INFO} ${match.id}`);
      sockets
        .find((s) => s.id == match.challenged)
        ?.socket.write(`${CMDS.MATCH_INFO} ${match.id}`);
    }
  });

  // Triggers twice ? --- MAYBE FIXED?
  socket.on("data", (data) => {
    if (formatDataWithPrefix(data, CMDS.BEGIN_MATCH)) {
      console.log("matches", matches);
      const match = matches.find(
        (m) => m.id == formatDataWithCommand(data, CMDS.BEGIN_MATCH)
      );
      if (match?.status === MatchStatus.ONGOING) return;
      if (match && match.status === MatchStatus.PENDING) {
        const modifiedMatch = { ...match, status: MatchStatus.ONGOING };
        matches.splice(matches.indexOf(match as Match), 1, modifiedMatch);
        sockets.find((s) => s.id == match?.challenger)?.socket.write(CMDS.HINT);
        sockets
          .find((s) => s.id == match?.challenged)
          ?.socket.write(CMDS.GUESS);
      } else {
        sendCommandWithData(socket, CMDS.INFO, "Match is already ongoing!");
      }
    }
  });

  socket.on("data", (data) => {
    console.log("DATA I GET ON SERVER:", data.toString());
    if (formatDataWithPrefix(data, CMDS.HINT)) {
      console.log(data.toString());
      const match = matches.find(
        (m) => m.id == formatDataWithCommand(data, CMDS.HINT).split(" ")[0]
      );
      const chlgd = sockets.find((s) => s.id == match?.challenged);
      console.log(formatDataWithCommand(data, CMDS.HINT).split(" "));
      sendCommandWithData(
        chlgd?.socket as Socket,
        CMDS.INFO,
        `Hint from Challenger: ${
          formatDataWithCommand(data, CMDS.HINT).split(" ")[1]
        }`
      );
    }
  });

  socket.on("data", (data) => {
    if (formatDataWithPrefix(data, CMDS.GUESS)) {
      const match = matches.find(
        (m) => m.id == formatDataWithCommand(data, CMDS.GUESS).split(" ")[0]
      );
      if (match) {
        const modifiedMatch = { ...match, attempts: match.attempts + 1 };
        const chlgd = sockets.find((s) => s.id == match?.challenged);
        const chlgr = sockets.find((s) => s.id == match?.challenger);

        matches.splice(matches.indexOf(match), 1, modifiedMatch);
        // Weird stuff going on here with strings
        if (
          match.word ==
          formatDataWithCommand(data, CMDS.GUESS).split(" ")[1].split("\r\n")[0]
        ) {
          sendCommand(chlgd?.socket as Socket, CMDS.WIN);
          sendCommandWithData(
            chlgr?.socket as Socket,
            CMDS.INFO,
            `Challenged won the match! Attempts: ${modifiedMatch.attempts}`
          );
        } else {
          sendCommand(chlgd?.socket as Socket, CMDS.GUESS);
          sendCommandWithData(
            chlgr?.socket as Socket,
            CMDS.INFO,
            `Challenged guessed wrong! Attempts: ${modifiedMatch.attempts}`
          );
        }
      } else throw new Error("Match not found!");
    }
  });

  // Handle error event
  socket.on("error", (error) => {
    console.log(`Socket Error: ${error.message}`);
  });
});

server.on("connection", (socket) => {
  sendCommand(socket, CMDS.PASSWORD);
  socket.once("data", (data) => {
    if (formatDataWithPrefix(data, CMDS.PASSWORD)) {
      console.log("enters in password?");
      try {
        if (formatDataWithCommand(data, CMDS.PASSWORD) === SECRET) {
          sendCommandWithData(
            socket,
            CMDS.INFO,
            `Welcome to the server! Your ID is: ${sockets.length + 100}`
          );
          sendCommandWithData(socket, CMDS.ID, `${sockets.length + 100}`);
          sockets.push({ socket, id: sockets.length + 100 });
        } else {
          sendCommandWithData(
            socket,
            CMDS.INFO,
            "I don't know who are you! Goodbye!"
          );
          socket.end();
        }
      } catch (error: any) {
        sendCommandWithData(
          socket,
          CMDS.INFO,
          "There was an error. Please try again!"
        );
      }
    }
  });
});

server.on("error", (error) => {
  console.log(`Server Error: ${error.message}`);
});

server.listen(PORT, () => {
  console.log(`TCP server is running on port: ${PORT}`);
});
