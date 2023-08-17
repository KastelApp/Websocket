class WsError {

	public Op: number
	
	public D: {
        Errors: {
			[key: string]: any;
		}
    };

	public constructor(OpCode: number) {
		this.Op = OpCode;

		this.D = {
			Errors: {}
		};
	}
	
	public AddToError(ErrorName: string, ErrorData: {
		Code: number | string;
		Message: string;
	}) {
		this.D.Errors[ErrorName] = ErrorData;
	}
	
	public AddError(ErrorData: {
		[key: string]: {
			Code: number | string;
			Message: string;
		}
	}) {
		for (const [key, value] of Object.entries(ErrorData)) {
			this.D.Errors[key] = value;
		}
	  }
	
	public AddArrayError(ErrorName: string, ErrorData: {
		Code: number | string;
		Message: string;
	}[]) {
		/*
		{
			"ErrorName": {
				"0": {
					"Code": "InvalidSomething",
					"Message": "Something is invalid"
				}
			}
		}
		 */
		this.D.Errors[ErrorName] = {};
		
		for (const [index, error] of ErrorData.entries()) {
			this.D.Errors[ErrorName][index] = error;
		}
	}
	
	public toJSON() {
		return {
			Op: this.Op,
			D: this.D
		}
	}
	
	public toString() {
		return JSON.stringify(this.toJSON());
	}
}

export default WsError;

export { WsError };
