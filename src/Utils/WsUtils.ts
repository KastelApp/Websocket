import { Utils } from "@kastelll/packages/dist/Ws";

export class WsUtils extends Utils {
    static get OpCodes() {
        return {
            Auth: 0, // You send this to Identify yourself
            Authed: 1 // This gets sent to you when you are authenticated
        }
    }
}