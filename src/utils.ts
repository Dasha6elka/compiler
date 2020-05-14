import { TokenTable, LiteralToken, LiteralSet, Literal } from "./common";

export namespace utils {
    export class TableFactory {
        static create(iterable?: Iterable<LiteralToken>): TokenTable {
            const entries: Array<[number, LiteralToken]> = [];
            if (iterable) {
                let index = 0;
                for (const token of iterable) {
                    entries.push([index++, token]);
                }
            }
            return new Map<number, LiteralToken>(entries);
        }
    }

    export class LiteralSetFactory {
        static create(iterable: Iterable<Literal>): LiteralSet {
            return new Set<Literal>(iterable);
        }
    }
}
