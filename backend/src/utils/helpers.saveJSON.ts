import * as fs from 'fs';

export function saveJSON(model: any) {
    const version = model.version ?? Date.now();
    fs.writeFileSync(`route-model-${version}.json`, JSON.stringify(model, null, 4));
}