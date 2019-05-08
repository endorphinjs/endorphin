import * as fs from 'fs';
import * as path from 'path';

export default function readFile(file: string): string {
	return fs.readFileSync(path.resolve(__dirname, '../', file), 'utf8').trim();
}
