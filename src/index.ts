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

import { join } from 'node:path';
import process from 'node:process';
import { WebsocketServer } from '@kastelll/core';
import chalk from 'chalk';
import mongoose from 'mongoose';
import { Server } from './Config.js';
import { Relative } from './Constants.js';
import Through from './Utils/Classes/Through.js';
import Init from './Utils/Init.js';
import { uriGenerator } from './Utils/URIGen.js';

console.log(
  chalk.hex('#ca8911')(`
██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
█████╔╝ ███████║███████╗   ██║   █████╗  ██║     
██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
A Chatting Application
Running version ${Relative.Version ? `v${Relative.Version}` : 'Unknown version'} of Kastel's Backend. Node.js version ${
    process.version
  }
If you would like to support this project please consider donating to https://opencollective.com/kastel\n`),
);

const WSS = new WebsocketServer(Server.Port, Server.AllowedIps, Server.CloseOnError); // We Initialize the WebsocketServer class

export default WSS;
export { WSS };

new Init().create(); // This loads all the events

mongoose.set('strictQuery', true);

mongoose
  .connect(uriGenerator(), {})
  .then(() => console.info('[Database] MongoDB connected!'))
  .catch((error) => {
    console.error('[Database] Failed to connect to MongoDB', error);
    process.exit();
  });

const FoundPaths = Through.thr(join(__dirname, 'WSEvents'), []);

Through.loadFiles(FoundPaths);

WSS.createWs();
