import process from 'node:process';
import chalk from 'chalk';
import { Relative } from './Constants.js';
import { Websocket } from './Websocket.js';

console.log(
	chalk.hex('#ca8911')(`
██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
█████╔╝ ███████║███████╗   ██║   █████╗  ██║     
██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
A Chatting Application
Running version ${
		Relative.Version ? `v${Relative.Version}` : 'Unknown version'
	} of Kastel's Websocket. Node.js version ${process.version}
If you would like to support this project please consider donating to https://opencollective.com/kastel\n`),
);

const WS = new Websocket();

// eslint-disable-next-line promise/prefer-await-to-callbacks
WS.start().catch((error) => {
	console.error(error);

	process.exit(1);
});
