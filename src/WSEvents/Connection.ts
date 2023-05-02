import { Ws } from "@kastelll/packages";
import WSS from "..";
import Config from "../Config";
import crypto from "crypto";
import { WsUtils } from "../Utils/Classes/WsUtils";

const SendToUsersInGuild = (guildId: string, ignoreUserIds: string[], data: any) => {
    for (const user of WSS.connectedUsers.values()) {
        if (user.authType === Ws.Utils.AUTH_CODES.USER && user?.UserData?.Guilds?.includes(guildId)) {
            if (!ignoreUserIds.includes(user.id)) {
                user.send(data);
            }
        }
    }
}

WSS.SendToUsersInGuild = SendToUsersInGuild;

WSS.on('connection', (user) => {
    console.log(`[Stats] New connection from ${user.ip}`)

    if (user.authType === Ws.Utils.AUTH_CODES.SYSTEM) {
        if (Config.Server.SystemLoginInfo.AllowNonLocalIp && !Config.Server.SystemLoginInfo.LocalIps.includes(user.ip)) {
            user.close(4000, 'System login is not allowed from non local ip', false)

            return;
        }

        if (user.socketVersion !== 0) {
            user.close(4000, 'Invalid socket version', false)

            return;
        }

        const Params = user.params as {
            v: string;
            p: string; // Password
            encoding: string;
            c: string;
        }

        if (!Params) {
            user.close(4000, 'Invalid parameters', false)

            return;
        }

        if (!crypto.timingSafeEqual(Buffer.from(Params.p), Buffer.from(Config.Server.SystemLoginInfo.Password))) {
            user.close(4000, 'Invalid parameters', false)

            return;
        }

        user.setAuthed(true);

        if (Params.c === 'true') {
            user.setCompression(true);
        }

        if (Config.Server.SystemLoginInfo.ForceHeartbeats) {
            user.setHeartbeatInterval(WsUtils.generateHeartbeatInterval())
            user.setLastHeartbeat(Date.now())
        }

        user.send({
            Authed: true,
            ApproximateMembers: Math.ceil(Array.from(WSS.connectedUsers.values()).filter((user) => user.authType === Ws.Utils.AUTH_CODES.USER).length / 2),
            Misc: {
                HeartbeatInterval: user.heartbeatInterval || null,
                SessionId: user.id
            }
        });
    } else if (user.socketVersion === 0) {
        user.close(4000, 'Invalid socket version', false)
    }
})