import { inspect } from 'node:util';
import Encryption from '../../Utils/Classes/Encryption.js';
import WsError from '../../Utils/Classes/Errors.js';
import Events from '../../Utils/Classes/Events.js';
import { OpCodes } from '../../Utils/Classes/OpCodes.js';
import Token from '../../Utils/Classes/Token.js';
import type User from '../../Utils/Classes/User.js';
import { HardCloseCodes, HardOpCodes } from '../../Utils/Classes/Utils.js';
import type Websocket from '../../Utils/Classes/Websocket.js';

export default class Identify extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = false;

		this.Name = 'Identify';

		this.Op = OpCodes.Auth;

		this.StrictCheck = false;

		this.Version = 1;
	}

	public override async Execute(
		User: User,
		Data: {
			Settings: {
				// idk what else currently
				Compress: boolean; // Whether the client supports compression
				Intents?: number; // The intents the client has (WIP) (Bot Only)
			};
			Token: string;
		},
	) {
		const FailedToAuth = new WsError(HardOpCodes.Error)
		
		if (!Data.Token) {
			
			FailedToAuth.AddError({
				Token: {
					Code: 'InvalidToken',
					Message: 'The token you provided was invalid.'
				}
			});
			
			User.Send(FailedToAuth);
			User.Close(HardCloseCodes.AuthenticationFailed, 'Invalid Token')
			
			return;
		}
		
		const ValidatedToken = Token.ValidateToken(Data.Token);
		
		if (!ValidatedToken) {
			
			FailedToAuth.AddError({
				Token: {
					Code: 'InvalidToken',
					Message: 'The token you provided was invalid.'
				}
			});
			
			User.Send(FailedToAuth);
			User.Close(HardCloseCodes.AuthenticationFailed, 'Invalid Token')
			
			return;
		}

		const DecodedToken = Token.DecodeToken(Data.Token);

		const UsersSettings = await this.Websocket.Cassandra.Models.Settings.get({
			UserId: Encryption.Encrypt(DecodedToken.Snowflake),
		}, {
			fields: ['tokens']
		});

		const UserData = await this.Websocket.Cassandra.Models.User.get({
			UserId: Encryption.Encrypt(DecodedToken.Snowflake),
		}, {
			fields: ['email', 'user_id', 'flags', 'password']
		});

		if (!UsersSettings || !UserData) {
			this.Websocket.Logger.debug("User settings wasn't found", (DecodedToken.Snowflake));
			this.Websocket.Logger.debug(UserData, UsersSettings);
			
			FailedToAuth.AddError({
				Token: {
					Code: 'InvalidToken',
					Message: 'The token you provided was invalid.'
				}
			});
			
			User.Send(FailedToAuth);
			User.Close(HardCloseCodes.AuthenticationFailed, 'Invalid Token')
			
			return;
		}
		
		console.log('Good Job')

	}
}
