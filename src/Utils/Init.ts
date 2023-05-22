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
import type Websocket from '../Websocket.js';

// Below are all the events we import
// example: import Heartbeat from './client/heartbeat'
// then we add it to the EventsHandler class
// new Heartbeat()

export default class Init {
	public wss: Websocket;

	public startDate: number;

	public constructor(wss: Websocket) {
		this.startDate = Date.now();

		this.wss = wss;
	}

	public create() {
		return new EventsHandler(
			// System Below
			new DeleteChannel(this.wss),
			new NewChannel(this.wss),
			new UpdateChannel(this.wss),
			new DeleteGuild(this.wss),
			new MemberAdd(this.wss),
			new MemberBan(this.wss),
			new MemberLeave(this.wss),
			new MemberUpdate(this.wss),
			new NewGuild(this.wss),
			new RemoveFromGuild(this.wss),
			new UpdateGuild(this.wss),
			new DeleteInvite(this.wss),
			new NewInvite(this.wss),
			new PurgeInvites(this.wss),
			new DeleteMessage(this.wss),
			new NewMessage(this.wss),
			new PurgeMessages(this.wss),
			new UpdateMessages(this.wss),
			new DeleteRole(this.wss),
			new NewRole(this.wss),
			new UpdateRole(this.wss),
			new HeartbeatSystem(this.wss),
			// System Ends Here
			// V1 Below
			new Identify(this.wss),
			new HeartBeat(this.wss),
			new Resume(this.wss),
			// V1 Ends Here
		);
	}
}
