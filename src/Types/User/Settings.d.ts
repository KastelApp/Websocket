export interface RawSettings {
    _id: string;
    User: string;
    Presence: number;
    Tokens: string[];
    __v: number;
}

interface IRawSettingsWJ {
    toJSON(): RawSettings;
    toObject(): RawSettings;
}

export type Settings = RawSettings & IRawSettingsWJ;
