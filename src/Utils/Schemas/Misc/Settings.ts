/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import { model, Schema } from 'mongoose';

const SettingSchema = new Schema({
    User: {
        type: String,
        ref: 'Users',
        required: true,
    },

    Status: {
        type: String,
        required: false,
    },

    Presence: {
        type: Number,
        required: true,
        default: 0,
    },

    Tokens: {
        type: Array,
        required: true,
        default: [],
    },

    Theme: {
        type: String,
        required: true,
        default: 'dark',
    },

    Mentions: [
        {
            Channel: {
                type: String,
                required: true,
                ref: 'Channels',
            },
            Guild: {
                type: String,
                required: true,
                ref: 'Guilds',
            },
            Count: {
                type: Number,
                required: true,
                default: 0,
            }
        }
    ]
});

export default model('Settings', SettingSchema);

export { SettingSchema }