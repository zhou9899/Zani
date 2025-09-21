import { Pin } from './pin';
export declare class Pinterest {
    static getPins(boardName: string, minCount?: number, ignoredPinIDs?: string[], minRatio?: number, maxRatio?: number, acceptedMediaExtensions?: string[]): Promise<Pin[]>;
    private static isPinOk;
    private static getPinsHTML;
    private static getPinsWithBookMark;
    private static toPins;
}
