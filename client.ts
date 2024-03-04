import net from "net";
import {
  CMDS,
  HOST,
  PORT,
  formatData,
  formatDataWithCommand,
  formatDataWithPrefix,
  sendCommand,
  sendCommandWithData,
} from "./consts";

const client = new net.Socket();
let id: string | null = null;
let currentMatch: string | null = null;
let isPlaying: boolean = false;

client.connect(PORT, HOST);

client.on("connect", () => {
  console.log("Connected to server");
});

// Should be removed
// client.on("data", (data: any) => {
//   console.log(data.toString());
// });

client.on("error", (error: Error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

client.on("close", () => {
  console.log("Connection closed");
  process.exit(0);
});

client.on("end", () => {
  console.log("Disconnected from server");
  process.exit(0);
});

// Authentication to server
client.on("data", (data: any) => {
  if (formatData(data) === CMDS.PASSWORD) {
    if (id === null && !currentMatch && !isPlaying) {
      process.stdin.on("data", (data) => {
        sendCommandWithData(client, CMDS.PASSWORD, data.toString().trim());
      });
    }
  }
});

// Get client id
client.on("data", (data: any) => {
  console.log("DATA I GET ON CLIENT:", data.toString());
  if (formatDataWithPrefix(data, CMDS.ID)) {
    console.log(formatData(data));
    console.log(`CLIENT ID: ${formatDataWithCommand(data, CMDS.ID)}`);
    id = formatDataWithCommand(data, CMDS.ID);
    sendCommand(client, CMDS.MENU);
  }
});

client.on("data", (data: any) => {
  if (formatData(data) === CMDS.MENU) {
    console.log("Menu: ");
    console.log("1. Competitors");
    console.log("2. Challenge");
    process.stdin.on("data", (data) => {
      if (formatData(data) === "1") {
        sendCommand(client, CMDS.COMPETITORS);
      } else if (formatData(data) === "2") {
        sendCommand(client, CMDS.CHALLENGE);
      }
    });
  }
});

client.on("data", (data: any) => {
  if (formatDataWithPrefix(data, CMDS.START_GAME)) {
    if (isPlaying) return;
    console.log(
      formatDataWithCommand(data, CMDS.START_GAME).split(" ")[0],
      formatDataWithCommand(data, CMDS.START_GAME).split(" ")[1]
    );
    if (isPlaying) return;
    sendCommandWithData(client, CMDS.MATCH, [
      id,
      formatDataWithCommand(data, CMDS.START_GAME).split(" ")[0],
      formatDataWithCommand(data, CMDS.START_GAME).split(" ")[1],
    ]);
  }
});

client.on("data", (data: any) => {
  if (formatDataWithPrefix(data, CMDS.MATCH_INFO)) {
    console.log("ID !!!", formatDataWithCommand(data, CMDS.MATCH_INFO));
    currentMatch = formatDataWithCommand(data, CMDS.MATCH_INFO);
    sendCommandWithData(client, CMDS.BEGIN_MATCH, currentMatch);
    isPlaying = true;
  }
});

// Triggers twice ?
client.on("data", (data: any) => {
  if (formatDataWithPrefix(data, CMDS.HINT)) {
    if (!isPlaying) {
      sendCommand(client, CMDS.MENU);
      return;
    }
    console.log("You are the challenger. Send a hint.", currentMatch);
    process.stdin.on("data", (data) => {
      sendCommandWithData(client, CMDS.HINT, `${currentMatch} ${data}`);
    });
  }
});

// Triggers twice ?
client.on("data", (data: any) => {
  if (formatDataWithPrefix(data, CMDS.GUESS)) {
    if (!isPlaying) {
      sendCommand(client, CMDS.MENU);
      return;
    }
    console.log("You are the challenged", currentMatch);
    console.log("\nSend a guess: ");
    process.stdin.on("data", (data) => {
      sendCommandWithData(client, CMDS.GUESS, `${currentMatch} ${data}`);
    });
  }
});

client.on("data", (data: any) => {
  if (formatDataWithPrefix(data, CMDS.INFO)) {
    console.log(formatDataWithCommand(data, CMDS.INFO));
  }
});

client.on("data", (data: any) => {
  if (formatDataWithPrefix(data, CMDS.CHOOSE_COMPETITOR)) {
    if (isPlaying || currentMatch) return;
    console.log("Who do you wanna challenge?\n");
    process.stdin.on("data", (data) => {
      sendCommandWithData(client, CMDS.CHOOSE_COMPETITOR, formatData(data));
    });
  }
});

client.on("data", (data: any) => {
  if (formatData(data) === CMDS.WIN) {
    console.log("You won!");
    isPlaying = false;
    currentMatch = "";
  }
});
