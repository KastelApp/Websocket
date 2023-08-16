import { HardCloseCodes } from './Utils.js';

class Errors {
	public Reason: string;

	public Op: number;

	public constructor(reason: string, op?: number) {
		this.Reason = reason;

		this.Op = op ?? HardCloseCodes.UnknownError;
	}

	public toJSON() {
		return {
			op: this.Op,
			// eslint-disable-next-line id-length
			d: {
				message: this.Reason,
			},
		};
	}

	public toString() {
		return JSON.stringify(this.toJSON());
	}
}

export default Errors;

export { Errors };
