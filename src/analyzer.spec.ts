import { analyzer } from "./analyzer";
import { LiteralToken, LiteralIterator } from "./common";
import { END } from "./constants";
import { exceptions } from "./exceptions";
import { factory } from "./factory";

describe("analyzer", () => {
    describe("symbols [A, B, 5, +, e]", () => {
        const LITERALS = {
            A: "A",
            B: "B",
            FIVE: "5",
            PLUS: "+",
            e: "e",
        };

        const data: LiteralToken[] = [
            {
                rule: LITERALS.A,
                first: factory.createLiteralSet([LITERALS.FIVE]),
                offset: false,
                error: true,
                pointer: 3,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.PLUS]),
                offset: false,
                error: false,
                pointer: 5,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([END]),
                offset: false,
                error: true,
                pointer: 8,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.FIVE,
                first: factory.createLiteralSet([LITERALS.FIVE]),
                offset: true,
                error: true,
                pointer: 4,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([END, LITERALS.PLUS]),
                offset: false,
                error: true,
                pointer: 1,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.PLUS,
                first: factory.createLiteralSet([LITERALS.PLUS]),
                offset: true,
                error: true,
                pointer: 6,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.FIVE,
                first: factory.createLiteralSet([LITERALS.FIVE]),
                offset: true,
                error: true,
                pointer: 7,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([END, LITERALS.PLUS]),
                offset: false,
                error: true,
                pointer: 1,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.e,
                first: factory.createLiteralSet([END]),
                offset: true,
                error: true,
                pointer: null,
                stack: false,
                end: true,
            },
        ];

        const table = factory.createTokenTable(data);

        it("should pass on 5+5", () => {
            const input = [LITERALS.FIVE, LITERALS.PLUS, LITERALS.FIVE, END];
            const result = analyzer.exec(table, new LiteralIterator(input));
            expect(result).toMatchObject({
                ok: true,
                error: null,
            });
        });

        it("should fail on 5+5++", () => {
            const input = [LITERALS.FIVE, LITERALS.PLUS, LITERALS.FIVE, LITERALS.PLUS, LITERALS.PLUS, END];
            const result = analyzer.exec(table, new LiteralIterator(input));
            expect(result).toMatchObject({
                ok: false,
                error: new exceptions.analyzer.IncorrectSequenceOrderException(),
            });
        });
    });

    describe("symbols [S, B, A, 5, +, *, (, ), i, e]", () => {
        const LITERALS = {
            S: "S",
            B: "B",
            A: "A",
            FIVE: "5",
            PLUS: "+",
            MUL: "*",
            OB: "(",
            CB: ")",
            i: "i",
            e: "e",
        };

        const data: LiteralToken[] = [
            {
                rule: LITERALS.S,
                first: factory.createLiteralSet([LITERALS.FIVE]),
                offset: false,
                error: true,
                pointer: 6,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.PLUS]),
                offset: false,
                error: false,
                pointer: 9,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.MUL]),
                offset: false,
                error: false,
                pointer: 12,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([END]),
                offset: false,
                error: true,
                pointer: 19,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.A,
                first: factory.createLiteralSet([LITERALS.OB]),
                offset: false,
                error: false,
                pointer: 15,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.A,
                first: factory.createLiteralSet([LITERALS.i]),
                offset: false,
                error: true,
                pointer: 18,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.FIVE,
                first: factory.createLiteralSet([LITERALS.FIVE]),
                offset: true,
                error: true,
                pointer: 7,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.PLUS, LITERALS.MUL, END]),
                offset: false,
                error: true,
                pointer: 1,
                stack: true,
                end: false,
            },
            {
                rule: END,
                first: factory.createLiteralSet([END]),
                offset: false,
                error: true,
                pointer: null,
                stack: false,
                end: true,
            },
            {
                rule: LITERALS.PLUS,
                first: factory.createLiteralSet([LITERALS.PLUS]),
                offset: true,
                error: true,
                pointer: 10,
                stack: false,
                end: true,
            },
            {
                rule: LITERALS.A,
                first: factory.createLiteralSet([LITERALS.OB, LITERALS.i]),
                offset: false,
                error: true,
                pointer: 4,
                stack: true,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.PLUS, LITERALS.MUL, END]),
                offset: false,
                error: true,
                pointer: 1,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.MUL,
                first: factory.createLiteralSet([LITERALS.MUL]),
                offset: true,
                error: true,
                pointer: 13,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.A,
                first: factory.createLiteralSet([LITERALS.OB, LITERALS.i]),
                offset: false,
                error: true,
                pointer: 4,
                stack: true,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.PLUS, LITERALS.MUL, END]),
                offset: false,
                error: true,
                pointer: 1,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.OB,
                first: factory.createLiteralSet([LITERALS.OB]),
                offset: true,
                error: true,
                pointer: 16,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.A,
                first: factory.createLiteralSet([LITERALS.OB, LITERALS.i]),
                offset: false,
                error: true,
                pointer: 4,
                stack: true,
                end: false,
            },
            {
                rule: LITERALS.CB,
                first: factory.createLiteralSet([LITERALS.CB]),
                offset: true,
                error: true,
                pointer: null,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.i,
                first: factory.createLiteralSet([LITERALS.i]),
                offset: true,
                error: true,
                pointer: null,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.e,
                first: factory.createLiteralSet([END]),
                offset: false,
                error: true,
                pointer: null,
                stack: false,
                end: false,
            },
        ];

        const table = factory.createTokenTable(data);

        it("should pass on 5+(i)", () => {
            const input = [LITERALS.FIVE, LITERALS.PLUS, LITERALS.OB, LITERALS.i, LITERALS.CB, END];
            const result = analyzer.exec(table, new LiteralIterator(input));
            expect(result).toMatchObject({
                ok: true,
                error: null,
            });
        });
    });
});
