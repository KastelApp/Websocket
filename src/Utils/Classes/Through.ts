/* eslint-disable n/no-sync */
import fs from 'node:fs';
import path from 'node:path';

const allowedEndings = ['.js'];

const Through = {
	thr(filePath: string, arr: string[]) {
		const dirArray = arr || [];

		const fileInfo = fs.statSync(filePath);

		if (fileInfo.isDirectory()) {
			const files = fs.readdirSync(filePath);
			for (let key = 0; key < files.length; key++) {
				const fi = fs.statSync(path.join(filePath, files[key as number] as string));

				if (fi.isDirectory()) {
					Through.thr(path.join(filePath, files[key as number] as string), dirArray);
				} else {
					if (!allowedEndings.includes(path.extname(path.join(filePath, files[key as number] as string)))) {
						continue;
					}

					dirArray.push(path.join(filePath, files[key as number] as string));
				}
			}
		} else {
			if (!allowedEndings.includes(path.extname(filePath))) {
				return dirArray;
			}

			dirArray.push(filePath);
		}

		return dirArray;
	},

	getPaths(dirPath: string) {
		return Through.thr(dirPath, []);
	},

	loadFiles(pathsArray: string[]) {
		for (const file of pathsArray) {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			require(file);
		}
	},
};

export default Through;

export { Through };
