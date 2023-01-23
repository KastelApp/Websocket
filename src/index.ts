import { Ws } from "@kastelll/packages";
import { config } from "./config";
import Init from "./Events/init";

const WSS = new Ws.WebsocketServer( // We Initialize the WebsocketServer class
    config.port,
    config.allowedIps,
    config.closeOnError
);

new Init().create(); // This loads all the events

WSS.createWs();