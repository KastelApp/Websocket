import type { UserData } from "./User/User";

declare module "@kastelll/packages/dist/Ws" {
    interface User {
        Intents: number; // The intents the user has (WIP, Stuff like getting messages etc)
        Token: string; // The token of the user
        UserData: UserData
    }

    interface WebsocketServer {
        SendToUsersInGuild(guildId: string, ignore: string[], data: any)
    }
}