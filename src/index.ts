import process from 'node:process';
import { Relative } from './Constants.js';
import { Websocket } from './Utils/Classes/Websocket.js';

const WS = new Websocket();

WS.Logger.hex('#ca8911')(
	`\n██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     \n██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     \n█████╔╝ ███████║███████╗   ██║   █████╗  ██║     \n██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     \n██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗\n╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝\nA Chatting Application\nRunning version ${
		Relative.Version ? `v${Relative.Version}` : 'Unknown version'
	} of Kastel's Websocket. Node.js version ${
		process.version
	}\nIf you would like to support this project please consider donating to https://opencollective.com/kastel\n`,
);

// eslint-disable-next-line promise/prefer-await-to-callbacks
WS.Start().catch((error) => {
	WS.Logger.fatal(error);

	process.exit(1);
});
