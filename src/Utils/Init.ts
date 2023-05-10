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

import { EventsHandler } from '@kastelll/core';
import { DeleteChannel } from '../Events/System/Channels/DeleteChannel.js';
import { NewChannel } from '../Events/System/Channels/NewChannel.js';
import { UpdateChannel } from '../Events/System/Channels/UpdateChannel.js';
import { DeleteGuild } from '../Events/System/Guilds/DeleteGuild.js';
import { MemberAdd } from '../Events/System/Guilds/MemberAdd.js';
import { MemberBan } from '../Events/System/Guilds/MemberBan.js';
import { MemberLeave } from '../Events/System/Guilds/MemberLeave.js';
import { MemberUpdate } from '../Events/System/Guilds/MemberUpdate.js';
import { NewGuild } from '../Events/System/Guilds/NewGuild.js';
import { RemoveFromGuild } from '../Events/System/Guilds/RemoveFromGuild.js';
import { UpdateGuild } from '../Events/System/Guilds/UpdateGuild.js';
import { HeartBeat as HeartbeatSystem } from '../Events/System/HeartBeat.js';
import { DeleteInvite } from '../Events/System/Invites/DeleteInvite.js';
import { NewInvite } from '../Events/System/Invites/NewInvite.js';
import { PurgeInvites } from '../Events/System/Invites/PurgeInvites.js';
import { DeleteMessage } from '../Events/System/Messages/DeleteMessage.js';
import { NewMessage } from '../Events/System/Messages/NewMessage.js';
import { PurgeMessages } from '../Events/System/Messages/PurgeMessages.js';
import { UpdateMessages } from '../Events/System/Messages/UpdateMessage.js';
import { DeleteRole } from '../Events/System/Roles/DeleteRole.js';
import { NewRole } from '../Events/System/Roles/NewRole.js';
import { UpdateRole } from '../Events/System/Roles/UpdateRole.js';
import { HeartBeat } from '../Events/V1/Heartbeat.js';
import { Identify } from '../Events/V1/Identify.js';
import { Resume } from '../Events/V1/Resume.js';

// Below are all the events we import
// example: import Heartbeat from './client/heartbeat'
// then we add it to the EventsHandler class
// new Heartbeat()

export default class Init {
	public startDate: number;

	public constructor() {
		this.startDate = Date.now();
	}

	public create() {
		return new EventsHandler(
			// System Below
			new DeleteChannel(),
			new NewChannel(),
			new UpdateChannel(),
			new DeleteGuild(),
			new MemberAdd(),
			new MemberBan(),
			new MemberLeave(),
			new MemberUpdate(),
			new NewGuild(),
			new RemoveFromGuild(),
			new UpdateGuild(),
			new DeleteInvite(),
			new NewInvite(),
			new PurgeInvites(),
			new DeleteMessage(),
			new NewMessage(),
			new PurgeMessages(),
			new UpdateMessages(),
			new DeleteRole(),
			new NewRole(),
			new UpdateRole(),
			new HeartbeatSystem(),
			// System Ends Here
			// V1 Below
			new Identify(),
			new HeartBeat(),
			new Resume(),
			// V1 Ends Here
		);
	}
}
