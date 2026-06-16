import * as fs from 'fs';

export function saveJSON(list: any) {
    fs.writeFileSync(`output-${Date.now()}.json`, JSON.stringify(list, null, 4));
}