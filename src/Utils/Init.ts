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
import { DeleteChannel } from '../Events/System/Channels/DeleteChannel';
import { NewChannel } from '../Events/System/Channels/NewChannel';
import { UpdateChannel } from '../Events/System/Channels/UpdateChannel';
import { DeleteGuild } from '../Events/System/Guilds/DeleteGuild';
import { MemberAdd } from '../Events/System/Guilds/MemberAdd';
import { MemberBan } from '../Events/System/Guilds/MemberBan';
import { MemberLeave } from '../Events/System/Guilds/MemberLeave';
import { MemberUpdate } from '../Events/System/Guilds/MemberUpdate';
import { NewGuild } from '../Events/System/Guilds/NewGuild';
import { RemoveFromGuild } from '../Events/System/Guilds/RemoveFromGuild';
import { UpdateGuild } from '../Events/System/Guilds/UpdateGuild';
import { HeartBeat as HeartbeatSystem } from '../Events/System/HeartBeat';
import { DeleteInvite } from '../Events/System/Invites/DeleteInvite';
import { NewInvite } from '../Events/System/Invites/NewInvite';
import { PurgeInvites } from '../Events/System/Invites/PurgeInvites';
import { DeleteMessage } from '../Events/System/Messages/DeleteMessage';
import { NewMessage } from '../Events/System/Messages/NewMessage';
import { PurgeMessages } from '../Events/System/Messages/PurgeMessages';
import { UpdateMessages } from '../Events/System/Messages/UpdateMessage';
import { DeleteRole } from '../Events/System/Roles/DeleteRole';
import { NewRole } from '../Events/System/Roles/NewRole';
import { UpdateRole } from '../Events/System/Roles/UpdateRole';
import { HeartBeat } from '../Events/V1/Heartbeat';
import { Identify } from '../Events/V1/Identify';
import { Resume } from '../Events/V1/Resume';

// Below are all the events we import
// example: import Heartbeat from './client/heartbeat'
// then we add it to the EventsHandler class
// new Heartbeat()

export default class Init {
	public constructor() {}

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
