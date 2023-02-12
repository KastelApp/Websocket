/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import { Ws } from "@kastelll/packages";
import mongoose from "mongoose";
import { Server } from "./Config";
import Init from "./Utils/Init";
import { uriGenerator } from "./Utils/URIGen";
import chalk from "chalk";
import { Relative } from "./Constants";
import Through from "./Utils/Classes/Through";
import { join } from "path";

console.log(
  chalk.hex("#ca8911")(`
██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
█████╔╝ ███████║███████╗   ██║   █████╗  ██║     
██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
A Chatting Application
Running version ${
    Relative.Version ? `v${Relative.Version}` : "Unknown version"
  } of Kastel's Websocket. Node.js version ${process.version}\n`)
);

const WSS = new Ws.WebsocketServer( // We Initialize the WebsocketServer class
    Server.Port,
    Server.AllowedIps,
    Server.CloseOnError
);

new Init().create(); // This loads all the events


mongoose.set('strictQuery', true);
mongoose.connect(uriGenerator(), {
}).then(() => console.info('MongoDB connected!')).catch((e) => {
  console.error('Failed to connect to MongoDB', e);
  process.exit();
});

export default WSS

const FoundPaths = Through.thr(join(__dirname, 'WSEvents'), []);

Through.loadFiles(FoundPaths)

WSS.createWs();