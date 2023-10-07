import { Relative } from './Constants.ts';
import { Websocket } from './Utils/Classes/Websocket.ts';

const WS = new Websocket();

WS.Logger.hex('#ca8911')(
	`\n██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     \n██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     \n█████╔╝ ███████║███████╗   ██║   █████╗  ██║     \n██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     \n██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗\n╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝\nA Chatting Application\nRunning version ${Relative.Version ? `v${Relative.Version}` : 'Unknown version'
	} of Kastel's Websocket. Bun version ${Bun.version
	}\nIf you would like to support this project please consider donating to https://opencollective.com/kastel\n`,
);


try {
	await WS.Start();
} catch (error) {
	WS.Logger.fatal("A fatal error occurred before the websocket could start.")
	WS.Logger.fatal(error);

	process.exit(1);
}

Bun.version
