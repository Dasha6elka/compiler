import { utils } from "./utils";
import { analyzer } from "./analyzer";
import { LiteralToken, LiteralIterator } from "./common";
import { END } from "./constants";
import { exceptions } from "./exceptions";

describe("analyzer", () => {
    describe("symbols [A, B, 5, +, e]", () => {
        const LITERALS = {
            A: Symbol("A"),
            B: Symbol("B"),
            FIVE: Symbol("5"),
            PLUS: Symbol("+"),
            e: Symbol("e"),
            END: END,
        };

        const data: LiteralToken[] = [
            {
                rule: LITERALS.A,
                first: utils.LiteralSetFactory.create([LITERALS.FIVE]),
                offset: false,
                error: true,
                pointer: 3,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: utils.LiteralSetFactory.create([LITERALS.PLUS]),
                offset: false,
                error: false,
                pointer: 5,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: utils.LiteralSetFactory.create([LITERALS.END]),
                offset: false,
                error: true,
                pointer: 8,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.FIVE,
                first: utils.LiteralSetFactory.create([LITERALS.FIVE]),
                offset: true,
                error: true,
                pointer: 4,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: utils.LiteralSetFactory.create([LITERALS.END, LITERALS.PLUS]),
                offset: false,
                error: true,
                pointer: 1,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.PLUS,
                first: utils.LiteralSetFactory.create([LITERALS.PLUS]),
                offset: true,
                error: true,
                pointer: 6,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.FIVE,
                first: utils.LiteralSetFactory.create([LITERALS.FIVE]),
                offset: true,
                error: true,
                pointer: 7,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: utils.LiteralSetFactory.create([LITERALS.END, LITERALS.PLUS]),
                offset: false,
                error: true,
                pointer: 1,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.e,
                first: utils.LiteralSetFactory.create([LITERALS.END]),
                offset: true,
                error: true,
                pointer: null,
                stack: false,
                end: true,
            },
        ];

        const table = utils.TableFactory.create(data);

        it("should pass on 5+5", () => {
            const input = [LITERALS.FIVE, LITERALS.PLUS, LITERALS.FIVE, LITERALS.END];
            const result = analyzer.exec(table, new LiteralIterator(input));
            expect(result).toMatchObject({
                ok: true,
                error: null,
            });
        });

        it("should fail on 5+5++", () => {
            const input = [
                LITERALS.FIVE,
                LITERALS.PLUS,
                LITERALS.FIVE,
                LITERALS.PLUS,
                LITERALS.PLUS,
                LITERALS.END,
            ];
            const result = analyzer.exec(table, new LiteralIterator(input));
            expect(result).toMatchObject({
                ok: false,
                error: new exceptions.analyzer.IncorrectSequenceOrderException(),
            });
        });
    });

    describe("symbols [S, B, A, 5, +, *, (, ), i, e]", () => {
        const LITERALS = {
            S: Symbol("S"),
            B: Symbol("B"),
            A: Symbol("A"),
            FIVE: Symbol("5"),
            PLUS: Symbol("+"),
            MUL: Symbol("*"),
            OB: Symbol("("),
            CB: Symbol(")"),
            i: Symbol("i"),
            e: Symbol("e"),
            END,
        };

        const data: LiteralToken[] = [
            {
                rule: LITERALS.S,
                first: utils.LiteralSetFactory.create([LITERALS.FIVE]),
                offset: false,
                error: true,
                pointer: 6,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: utils.LiteralSetFactory.create([LITERALS.PLUS]),
                offset: false,
                error: false,
                pointer: 9,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: utils.LiteralSetFactory.create([LITERALS.MUL]),
                offset: false,
                error: false,
                pointer: 12,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: utils.LiteralSetFactory.create([LITERALS.END]),
                offset: false,
                error: true,
                pointer: 19,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.A,
                first: utils.LiteralSetFactory.create([LITERALS.OB]),
                offset: false,
                error: false,
                pointer: 15,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.A,
                first: utils.LiteralSetFactory.create([LITERALS.i]),
                offset: false,
                error: true,
                pointer: 18,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.FIVE,
                first: utils.LiteralSetFactory.create([LITERALS.FIVE]),
                offset: true,
                error: true,
                pointer: 7,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: utils.LiteralSetFactory.create([LITERALS.PLUS, LITERALS.MUL, LITERALS.END]),
                offset: false,
                error: true,
                pointer: 1,
                stack: true,
                end: false,
            },
            {
                rule: LITERALS.END,
                first: utils.LiteralSetFactory.create([LITERALS.END]),
                offset: false,
                error: true,
                pointer: null,
                stack: false,
                end: true,
            },
            {
                rule: LITERALS.PLUS,
                first: utils.LiteralSetFactory.create([LITERALS.PLUS]),
                offset: true,
                error: true,
                pointer: 10,
                stack: false,
                end: true,
            },
            {
                rule: LITERALS.A,
                first: utils.LiteralSetFactory.create([LITERALS.OB, LITERALS.i]),
                offset: false,
                error: true,
                pointer: 4,
                stack: true,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: utils.LiteralSetFactory.create([LITERALS.PLUS, LITERALS.MUL, LITERALS.END]),
                offset: false,
                error: true,
                pointer: 1,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.MUL,
                first: utils.LiteralSetFactory.create([LITERALS.MUL]),
                offset: true,
                error: true,
                pointer: 13,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.A,
                first: utils.LiteralSetFactory.create([LITERALS.OB, LITERALS.i]),
                offset: false,
                error: true,
                pointer: 4,
                stack: true,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: utils.LiteralSetFactory.create([LITERALS.PLUS, LITERALS.MUL, LITERALS.END]),
                offset: false,
                error: true,
                pointer: 1,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.OB,
                first: utils.LiteralSetFactory.create([LITERALS.OB]),
                offset: true,
                error: true,
                pointer: 16,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.A,
                first: utils.LiteralSetFactory.create([LITERALS.OB, LITERALS.i]),
                offset: false,
                error: true,
                pointer: 4,
                stack: true,
                end: false,
            },
            {
                rule: LITERALS.CB,
                first: utils.LiteralSetFactory.create([LITERALS.CB]),
                offset: true,
                error: true,
                pointer: null,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.i,
                first: utils.LiteralSetFactory.create([LITERALS.i]),
                offset: true,
                error: true,
                pointer: null,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.e,
                first: utils.LiteralSetFactory.create([LITERALS.END]),
                offset: false,
                error: true,
                pointer: null,
                stack: false,
                end: false,
            },
        ];

        const table = utils.TableFactory.create(data);

        it("should pass on 5+(i)", () => {
            const input = [
                LITERALS.FIVE,
                LITERALS.PLUS,
                LITERALS.OB,
                LITERALS.i,
                LITERALS.CB,
                LITERALS.END,
            ];
            const result = analyzer.exec(table, new LiteralIterator(input));
            expect(result).toMatchObject({
                ok: true,
                error: null,
            });
        });
    });
});
