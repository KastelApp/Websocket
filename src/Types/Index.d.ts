import type { UserData } from "./User/User";

declare module "@kastelll/packages/dist/Ws" {
    interface User {
        Guilds: string[]; // The guilds the user is in
        Intents: number; // The intents the user has (WIP, Stuff like getting messages etc)
        Token: string; // The token of the user
        UserData: UserData
    }

    interface WebsocketServer {}
}