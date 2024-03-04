import net from "net";

export const PORT = 5000;
export const HOST = "127.0.0.1";

export const SECRET = "1234";

export interface SocketWithID {
  socket: net.Socket;
  id: number | string;
}

export const enum CMDS {
  PASSWORD = "password",
  ACCEPTED_PASSWORD = "acceptedPassword",
  REJECTED_PASSWORD = "rejectedPassword",
  INFO = "info",
  COMPETITORS = "competitors",
  CHALLENGE = "challenge",
  MENU = "menu",
  CHOOSE_COMPETITOR = "chooseCompetitor",
  START_GAME = "startGame",
  MATCH = "match",
  ID = "id",
  HINT = "hint",
  GUESS = "guess",
  MATCH_INFO = "matchInfo",
  BEGIN_MATCH = "beginMatch",
  WIN = "win",
}

export const sendCommand = (sender: net.Socket, command: string) => {
  sender.write(command);
};

export const sendCommandWithData = (
  sender: net.Socket,
  command: string,
  data: string | object
) => {
  sender.write(`\n${command} ${data}`);
};

export const formatData = (data: Buffer) => {
  return data.toString().trim();
};

export const formatDataWithCommand = (data: Buffer, command: string) => {
  return data
    .toString()
    .trim()
    .slice(command.length + 1);
};

export const formatDataWithPrefix = (data: Buffer, prefix: string) => {
  return data.toString().trim().startsWith(prefix);
};
