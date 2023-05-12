import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import { AuthCodes, WsUtils } from '@kastelll/core';
import Config from '../Config.js';
import { OpCodes } from '../Utils/Classes/WsUtils.js';
import WSS from '../index.js';

const SendToUsersInGuild = (guildId: string, ignoreUserIds: string[], data: any) => {
	for (const user of WSS.connectedUsers.values()) {
		if (
			user.AuthType === AuthCodes.User &&
			user?.UserData?.Guilds?.includes(guildId) &&
			!ignoreUserIds.includes(user.Id)
		) {
			user.send(data);
		}
	}
};

WSS.SendToUsersInGuild = SendToUsersInGuild;

WSS.on('connection', (user) => {
	console.log(`[Stats] New connection from ${user.Ip}`);
	
	user.send({
		op: OpCodes.Hello,
		d: {
			Date: Date.now(),
		}
	})
	
	if (user.AuthType === AuthCodes.System) {
		if (Config.Server.SystemLoginInfo.AllowNonLocalIp && !Config.Server.SystemLoginInfo.LocalIps.includes(user.Ip)) {
			user.close(4_000, 'System login is not allowed from non local ip', false);

			return;
		}

		if (user.SocketVersion !== 0) {
			user.close(4_000, 'Invalid socket version', false);

			return;
		}

		const Params = user.Params as {
			c: string;
			// Password
			encoding: string;
			p: string;
			v: string;
		};

		if (!Params) {
			user.close(4_000, 'Invalid parameters', false);

			return;
		}

		if (!crypto.timingSafeEqual(Buffer.from(Params.p), Buffer.from(Config.Server.SystemLoginInfo.Password))) {
			user.close(4_000, 'Invalid parameters', false);

			return;
		}

		user.setAuthed(true);

		if (Params.c === 'true') {
			user.setCompression(true);
		}

		if (Config.Server.SystemLoginInfo.ForceHeartbeats) {
			user.setHeartbeatInterval(WsUtils.GenerateHeartbeatInterval());
			user.setLastHeartbeat(Date.now());
		}

		user.send({
			Authed: true,
			ApproximateMembers: Math.ceil(
				Array.from(WSS.connectedUsers.values()).filter((user) => user.AuthType === AuthCodes.User).length / 2,
			),
			Misc: {
				HeartbeatInterval: user.HeartbeatInterval ?? null,
				SessionId: user.Id,
			},
		});
	} else if (user.SocketVersion === 0) {
		user.close(4_000, 'Invalid socket version', false);
	}
});
