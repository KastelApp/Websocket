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

import type { Flags } from '../Constants';
import type { FlagUtilsBInt } from '../Utils/Classes/Flags';

export interface WsUser {
	Bot: boolean;
	// the IDS not the objects
	Channels: {
		[key: string]: string[];
	};
	Email: string;
	FlagsUtil: FlagUtilsBInt<typeof Flags>;
	Guilds: string[];
	Id: string;
	Password: string;
	Token: string; // the IDS not the objects
}
