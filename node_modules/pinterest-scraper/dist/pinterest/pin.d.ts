export declare class Pin {
    readonly title?: string;
    readonly description?: string;
    readonly originalTitle?: string;
    readonly originalDescription?: string;
    readonly domain?: string;
    readonly id: string;
    readonly originalId?: string;
    readonly repinCount: number;
    readonly commentCount: number;
    readonly dominantColorHex: string;
    readonly tags?: string[];
    readonly type: string;
    readonly image: {
        url: string;
        extension: string;
        size: {
            width: number;
            height: number;
        };
        ratio: number;
    };
    constructor(obj: any);
    get ids(): string[];
}
