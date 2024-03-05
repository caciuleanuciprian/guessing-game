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
if (id === null) {
  client.on("data", (data: any) => {
    if (formatData(data) === CMDS.PASSWORD) {
      console.log(data);
      console.log("Enter the password: ");
      process.stdin.once("data", (data) => {
        sendCommandWithData(client, CMDS.PASSWORD, data.toString().trim());
      });
    }
  });
}

// Get client id
client.on("data", (data: any) => {
  if (formatDataWithPrefix(data, CMDS.ID)) {
    id = formatDataWithCommand(data, CMDS.ID);
    sendCommand(client, CMDS.MENU);
  }
});

client.on("data", (data: any) => {
  if (formatData(data) === CMDS.MENU) {
    console.log("MENU: ");
    console.log("- Show competitors : 'competitors'");
    console.log("- Challenge a competitor : 'challenge'");
    process.stdin.on("data", (data) => {
      if (formatData(data) === CMDS.COMPETITORS) {
        sendCommand(client, CMDS.COMPETITORS);
      } else if (formatData(data) === CMDS.CHALLENGE) {
        sendCommand(client, CMDS.CHALLENGE);
      }
    });
  }
});

client.on("data", (data: any) => {
  if (formatDataWithPrefix(data, CMDS.START_GAME)) {
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
    isPlaying = true;
    console.log("You are the challenger. Send a hint: ");
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
    isPlaying = true;
    console.log("You are guessing. Send a guess: ");
    process.stdin.on("data", (data) => {
      sendCommandWithData(client, CMDS.GUESS, `${currentMatch} ${data}`);
    });
  }
});

client.on("data", (data: any) => {
  if (data.toString().trim() === CMDS.STILL_GUESSING) {
    console.log("The answer was incorrect. Keep guessing...");
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
    console.log(
      "Who do you wanna challenge? Write his id and the word he will try to guess! (ex. 100 apple)\n"
    );
    process.stdin.on("data", (data) => {
      if (data.toString().trim() === CMDS.COMPETITORS) {
        sendCommand(client, CMDS.COMPETITORS);
        return;
      } else {
        sendCommandWithData(client, CMDS.CHOOSE_COMPETITOR, formatData(data));
      }
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
