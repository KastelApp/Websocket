import fs from 'node:fs';
import path from 'node:path';

const allowedEndings = ['.js']

class Through {
    static thr(filePath: string, arr: string[]) {
        const dirArray = (arr || []);

        const fileInfo = fs.statSync(filePath);

        if (fileInfo.isDirectory()) {
            const files = fs.readdirSync(filePath);
            for (let i = 0; i < files.length; i++) {
                const fi = fs.statSync(path.join(filePath, files[i as number] as string));

                if (fi.isDirectory()) {
                    Through.thr(path.join(filePath, files[i as number] as string), dirArray);
                } else {

                    if (!allowedEndings.includes(path.extname(path.join(filePath, files[i as number] as string)))) {
                        continue;
                    }

                    dirArray.push(path.join(filePath, files[i as number] as string));
                }
            }
        } else {

            if (!allowedEndings.includes(path.extname(filePath))) {
                return dirArray;
            }

            dirArray.push(filePath);
        }

        return dirArray;
    }

    static getPaths(dirPath: string) { 
        return Through.thr(dirPath, []);
    }

    static loadFiles(pathsArray: string[]) {
        for (const file of pathsArray) {
            require(file);
        }
    }
}


export default Through;

export { Through };