import { Utils } from "@kastelll/packages/dist/Ws";

export class WsUtils extends Utils {
    static get OpCodes() {
        return {
            Auth: 1, // You send this to Identify yourself
            Authed: 2, // This gets sent to you when you are authenticated
            HeartBeat: 3, // This is a heartbeat to keep the connection alive (you send this)
            HeartBeatAck: 4, // This is a heartbeat to keep the connection alive (you get this)
        }
    }
}