import type User from './User.ts';
import { AuthCodes } from './Utils.ts';

class Events {
	public Name: string;

	public AuthRequired: boolean;

	public Op: number;

	public AllowedAuthTypes: number;

	public StrictCheck: boolean;

	public Version: number;

	public constructor() {
		this.Name = '';

		this.AuthRequired = false;

		this.Op = 0;

		this.AllowedAuthTypes = AuthCodes.Bot | AuthCodes.User;

		// strictCheck is for if it checks allowedTypes or not
		// mainly useful for like a identify event
		this.StrictCheck = true;

		this.Version = -1;
	}

	public Execute(User: User, Data: any, Users?: Map<string, User>) {
		if (User || Data || Users) {
			// waffles
		}
	}
}

export default Events;

export { Events };
