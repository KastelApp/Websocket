/* eslint-disable unicorn/prefer-math-trunc */
import crypto from 'node:crypto';

const HardCloseCodes = {
	UnknownError: 4_000, // Unknown error
	UnknownOpcode: 4_001, // Unknown opcode
	DecodeError: 4_002, // Failed to decode payload
	NotAuthenticated: 4_003, // Not authenticated (no IDENTIFY payload sent)
	AuthenticationFailed: 4_004, // Authentication failed (wrong password or just an error)
	AlreadyAuthenticated: 4_005, // Already authenticated (why are you sending another IDENTIFY payload?)
	InvalidSeq: 4_007, // Invalid sequence sent when resuming (seq is 5 but the resume payload provided a seq of 4)
	RateLimited: 4_008, // User spammed the gateway (not used yet)
	SessionTimedOut: 4_009, // session timed out
	InvalidRequest: 4_010, // Invalid request (E/O)
	ServerShutdown: 4_011, // Server is shutting down
};

const HardOpCodes = {
	Error: 15,
};

const SoftCloseCodes = {
	UnknownError: 1_000, // Unknown error
	MissedHeartbeat: 1_001, // Missed heartbeat
};

const AuthCodes = {
	System: 1 << 0, // System is used for handling users & stuff, like sending out events to users
	User: 1 << 1,
	Bot: 1 << 2,
	Staff: 1 << 3,
};

const Regexes = {
	Type: /^\/(?:bot|client|system)\/?/,
	Params: /[&?][^=]+=[^&]+/,
};

class Utils {
	public static GenerateHeartbeatInterval(min = 30_000, max = 60_000): number {
		const generatedBits = crypto.randomBytes(15);

		if (generatedBits[0] === undefined) {
			// if its undefined, we'll just try again (it will probably never be undefined but just in case)
			return this.GenerateHeartbeatInterval(min, max);
		}

		return min + Math.floor((generatedBits[0] / 255) * (max - min + 1));
	}

	public static GenerateSessionId() {
		return crypto.randomBytes(16).toString('hex');
	}

	// Strict is if the user HAS to have the EXACT permissions, or if they just need to have one of the permissions
	public static ValidateAuthCode(allowed: number, provided: number | null, strict = false) {
		if (!provided) {
			return false;
		}

		// allowed could be like USER | STAFF but if user is only USER we still allow them
		const has = Utils._toObject(provided);

		const needs = Utils._toObject(allowed);

		if (strict) {
			return Object.keys(needs).every((key) => has[key]);
		} else {
			return Object.keys(needs).some((key) => has[key]);
		}
	}

	private static _toObject(num: number) {
		return Object.keys(AuthCodes).reduce(
			(
				acc: {
					[key: string]: boolean;
				},
				key: string,
			) => {
				acc[key] = Boolean(AuthCodes[key as keyof typeof AuthCodes] & num);

				return acc;
			},
			{},
		);
	}

	public static ParamsToObject(params: string[]) {
		return params.reduce(
			(
				acc: {
					[key: string]: any;
				},
				param: string,
			) => {
				const [key, value] = param.split('=');

				if (!key || !value) return acc;

				acc[key] = value;
				return acc;
			},
			{},
		);
	}

	public static ParseParams(input: string) {
		const result: {
			[key: string]: string | undefined;
		} = {};

		// eslint-disable-next-line prefer-named-capture-group, unicorn/better-regex
		const paramsRegex = /(?:\?|&)([^=&]+)=([^&]*)/g;

		let match: RegExpExecArray | null;

		while ((match = paramsRegex.exec(input)) !== null) {
			if (typeof match?.[0] === 'string' && typeof match?.[1] === 'string') {
				result[match[1]] = match[2];
			}
		}

		return result;
	}
}

export default Utils;

export { AuthCodes, HardCloseCodes, HardOpCodes, SoftCloseCodes, Regexes, Utils as WsUtils };
