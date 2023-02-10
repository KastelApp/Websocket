import { Ws } from "@kastelll/packages";
import WSS from "..";
import Config from "../Config";
import crypto from "crypto";

WSS.on('connection', (user) => {
    console.log(`[Stats] New connection from ${user.ip}`)

    if (user.authType === Ws.Utils.AUTH_CODES.SYSTEM) {
        if (Config.Server.SystemLoginInfo.AllowNonLocalIp && !Config.Server.SystemLoginInfo.LocalIps.includes(user.ip)) {
            user.close(4000, 'System login is not allowed from non local ip', false)

            return;
        }

        const Params = user.params as {
            v: string;
            p: string; // Password
            encoding: string;
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

        user.send({
            message: "temp"
        })
    }
})