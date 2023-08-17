import type User from './User.js';
import Utils from './Utils.js';

interface Event {
	AllowedAuthTypes: number;
	AuthRequired?: boolean;
	Execute(user: User, data: any, users: Map<string, User>): void;
	Name: string;
	Op: number;
	StrictCheck: boolean;
	Version: number;
}

const SetEvents: Map<string, Event> = new Map();

class EventsHandler {
	public events: any[];

	public constructor(...events: Event[]) {
		this.events = events;

		for (const event of events) {
			if (typeof event !== 'object') throw new TypeError('Event must be an object');
			if (typeof event.Name !== 'string') throw new TypeError('Event name must be a string');
			if (typeof event.Execute !== 'function') throw new TypeError('Event execute must be a function');
			if (typeof event.Op !== 'number') throw new TypeError('Event op must be a number');
			if (event.Version < 0) throw new TypeError('Event version must be a positive number');

			// using Session IDS to prevent duplicate events (Since we now can't use the event name)
			SetEvents.set(Utils.GenerateSessionId(), event);
		}
	}

	public static get Events(): Map<string, Event> {
		return SetEvents;
	}

	public static GetEventName(name: string, version: number): Event | null {
		if (!name) return null;

		for (const event of SetEvents.values()) {
			if (event.Name === name && event.Version === version) return event;
		}

		return null;
	}

	public static GetEventCode(code: number, version: number): Event | null {
		if (!code) return null;

		for (const event of SetEvents.values()) {
			if (event.Op === code && event.Version === version) return event;
		}

		return null;
	}
}

export default EventsHandler;

export { EventsHandler };
