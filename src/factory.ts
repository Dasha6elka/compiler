import { LiteralToken, TokenTable, Literal, LiteralSet, LiteralTable } from "./common";

export namespace factory {
    export function createTokenTable(iterable?: Iterable<LiteralToken>): TokenTable {
        const entries: Array<[number, LiteralToken]> = [];
        if (iterable) {
            let index = 0;
            for (const token of iterable) {
                entries.push([index++, token]);
            }
        }
        return new Map<number, LiteralToken>(entries);
    }

    export function createLiteralTable(iterable?: Iterable<[Literal, LiteralSet]>): LiteralTable {
        const entries: Array<[Literal, LiteralSet]> = [];
        if (iterable) {
            for (const [literal, set] of iterable) {
                entries.push([literal, set]);
            }
        }
        return new Map<Literal, LiteralSet>(entries);
    }

    export function createLiteralSet(iterable: Iterable<Literal>): LiteralSet {
        return new Set<Literal>(iterable);
    }
}
