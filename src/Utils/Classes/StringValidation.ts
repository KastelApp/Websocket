import Constants from '../../Constants.js';

const StringValidation = {
  isString(value: any): boolean {
    return typeof value === 'string';
  },

  GuildName(value: string): boolean {
    if (!this.isString(value)) return false;

    if (value.length > Constants.Settings.Max.GuildNameLength) return false;

    if (value.length < Constants.Settings.Min.GuildNameLength) return false;

    for (const RegexOrString of Constants.Settings.DisallowedWords.Guilds as (RegExp | string)[]) {
      if (typeof RegexOrString === 'string') {
        if (value.includes(RegexOrString)) return false;
      } else if (RegexOrString.test(value)) return false;
    }

    for (const RegexOrString of Constants.Settings.DisallowedWords.Global as (RegExp | string)[]) {
      if (typeof RegexOrString === 'string') {
        if (value.includes(RegexOrString)) return false;
      } else if (RegexOrString.test(value)) return false;
    }

    return true;
  },

  GuildDescription(value: string): boolean {
    if (!this.isString(value)) return false;

    if (value.length > Constants.Settings.Max.GuildDescriptionLength) return false;

    for (const RegexOrString of Constants.Settings.DisallowedWords.Global as (RegExp | string)[]) {
      if (typeof RegexOrString === 'string') {
        if (value.includes(RegexOrString)) return false;
      } else if (RegexOrString.test(value)) return false;
    }

    return true;
  },
};

export default StringValidation;

export { StringValidation };
