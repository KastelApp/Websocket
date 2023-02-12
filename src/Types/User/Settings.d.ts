export interface RawSettings {
    _id: string;
    User: string;
    Presence: number;
    Tokens: string[];
    Theme: string;
    Language: string;
    Privacy: number;
    Mentions: string[];
    __v: number;
}

interface IRawSettingsWJ {
    toJSON(): RawSettings;
    toObject(): RawSettings;
}

export type Settings = RawSettings & IRawSettingsWJ;
