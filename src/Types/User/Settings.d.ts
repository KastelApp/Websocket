export interface RawSettings {
	Language: string;
	Mentions: string[];
	Presence: number;
	Privacy: number;
	Theme: string;
	Tokens: string[];
	User: string;
	__v: number;
	_id: string;
}

interface IRawSettingsWJ {
	toJSON(): RawSettings;
	toObject(): RawSettings;
}

export type Settings = IRawSettingsWJ & RawSettings;
