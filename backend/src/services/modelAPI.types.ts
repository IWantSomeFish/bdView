export interface modelAPI {

    get(buffer: Buffer): Promise<any[]>,
    parse(raw: any): Promise<any[]>,
    loadModel(model: unknown): any,
    inference(database: any[],model: unknown): any,
    train(database: any[], params: {}): any,

}