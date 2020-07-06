import { analyzer } from "./analyzer";
import { LiteralToken } from "../common/common";
import { END } from "../common/constants";
import { exceptions } from "./exceptions";
import { factory } from "../common/factory";

describe("analyzer", () => {
    describe("symbols [A, B, 5, +, e]", () => {
        const LITERALS = {
            A: "A",
            B: "B",
            INT_NUMBER: "INT_NUMBER",
            FIVE: "5",
            S_PLUS: "PLUS",
            PLUS: "+",
            e: "e",
            S_END: "END",
        };

        const data: LiteralToken[] = [
            {
                rule: LITERALS.A,
                first: factory.createLiteralSet([LITERALS.INT_NUMBER]),
                offset: false,
                error: true,
                pointer: 3,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.S_PLUS]),
                offset: false,
                error: false,
                pointer: 5,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.S_END]),
                offset: false,
                error: true,
                pointer: 8,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.INT_NUMBER,
                first: factory.createLiteralSet([LITERALS.INT_NUMBER]),
                offset: true,
                error: true,
                pointer: 4,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.S_END, LITERALS.S_PLUS]),
                offset: false,
                error: true,
                pointer: 1,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.S_PLUS,
                first: factory.createLiteralSet([LITERALS.S_PLUS]),
                offset: true,
                error: true,
                pointer: 6,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.INT_NUMBER,
                first: factory.createLiteralSet([LITERALS.INT_NUMBER]),
                offset: true,
                error: true,
                pointer: 7,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.S_END, LITERALS.S_PLUS]),
                offset: false,
                error: true,
                pointer: 1,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.e,
                first: factory.createLiteralSet([LITERALS.S_END]),
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
            const result = analyzer.exec(table, input);
            expect(result).toMatchObject({
                ok: true,
                error: null,
            });
        });

        it("should fail on 5+5++", () => {
            const input = [LITERALS.FIVE, LITERALS.PLUS, LITERALS.FIVE, LITERALS.PLUS, LITERALS.PLUS, END];
            const result = analyzer.exec(table, input);
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
            INT_NUMBER: "INT_NUMBER",
            PLUS: "+",
            S_PLUS: "PLUS",
            MUL: "*",
            MULTIPLICATION: "MULTIPLICATION",
            OB: "(",
            BRACKET_OPEN: "BRACKET_OPEN",
            CB: ")",
            BRACKET_CLOSE: "BRACKET_CLOSE",
            i: "i",
            IDENTIFICATION: "IDENTIFICATION",
            e: "e",
            END: "END",
        };

        const data: LiteralToken[] = [
            {
                rule: LITERALS.S,
                first: factory.createLiteralSet([LITERALS.INT_NUMBER]),
                offset: false,
                error: true,
                pointer: 6,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.S_PLUS]),
                offset: false,
                error: false,
                pointer: 9,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.MULTIPLICATION]),
                offset: false,
                error: false,
                pointer: 12,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.END]),
                offset: false,
                error: true,
                pointer: 19,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.A,
                first: factory.createLiteralSet([LITERALS.BRACKET_OPEN]),
                offset: false,
                error: false,
                pointer: 15,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.A,
                first: factory.createLiteralSet([LITERALS.IDENTIFICATION]),
                offset: false,
                error: true,
                pointer: 18,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.INT_NUMBER,
                first: factory.createLiteralSet([LITERALS.INT_NUMBER]),
                offset: true,
                error: true,
                pointer: 7,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.S_PLUS, LITERALS.MULTIPLICATION, LITERALS.END]),
                offset: false,
                error: true,
                pointer: 1,
                stack: true,
                end: false,
            },
            {
                rule: END,
                first: factory.createLiteralSet([LITERALS.END]),
                offset: false,
                error: true,
                pointer: null,
                stack: false,
                end: true,
            },
            {
                rule: LITERALS.S_PLUS,
                first: factory.createLiteralSet([LITERALS.S_PLUS]),
                offset: true,
                error: true,
                pointer: 10,
                stack: false,
                end: true,
            },
            {
                rule: LITERALS.A,
                first: factory.createLiteralSet([LITERALS.BRACKET_OPEN, LITERALS.IDENTIFICATION]),
                offset: false,
                error: true,
                pointer: 4,
                stack: true,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.S_PLUS, LITERALS.MULTIPLICATION, LITERALS.END]),
                offset: false,
                error: true,
                pointer: 1,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.MULTIPLICATION,
                first: factory.createLiteralSet([LITERALS.MULTIPLICATION]),
                offset: true,
                error: true,
                pointer: 13,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.A,
                first: factory.createLiteralSet([LITERALS.BRACKET_OPEN, LITERALS.IDENTIFICATION]),
                offset: false,
                error: true,
                pointer: 4,
                stack: true,
                end: false,
            },
            {
                rule: LITERALS.B,
                first: factory.createLiteralSet([LITERALS.S_PLUS, LITERALS.MULTIPLICATION, LITERALS.END]),
                offset: false,
                error: true,
                pointer: 1,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.BRACKET_OPEN,
                first: factory.createLiteralSet([LITERALS.BRACKET_OPEN]),
                offset: true,
                error: true,
                pointer: 16,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.A,
                first: factory.createLiteralSet([LITERALS.BRACKET_OPEN, LITERALS.IDENTIFICATION]),
                offset: false,
                error: true,
                pointer: 4,
                stack: true,
                end: false,
            },
            {
                rule: LITERALS.BRACKET_CLOSE,
                first: factory.createLiteralSet([LITERALS.BRACKET_CLOSE]),
                offset: true,
                error: true,
                pointer: null,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.IDENTIFICATION,
                first: factory.createLiteralSet([LITERALS.IDENTIFICATION]),
                offset: true,
                error: true,
                pointer: null,
                stack: false,
                end: false,
            },
            {
                rule: LITERALS.e,
                first: factory.createLiteralSet([LITERALS.END]),
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
            const result = analyzer.exec(table, input);
            expect(result).toMatchObject({
                ok: true,
                error: null,
            });
        });

        it("should pass on 5+i*(i)+i", () => {
            const input = [
                LITERALS.FIVE,
                LITERALS.PLUS,
                LITERALS.i,
                LITERALS.MUL,
                LITERALS.OB,
                LITERALS.i,
                LITERALS.CB,
                LITERALS.PLUS,
                LITERALS.i,
                END,
            ];
            const result = analyzer.exec(table, input);
            expect(result).toMatchObject({
                ok: true,
                error: null,
            });
        });

        it("should not pass on 5+i*(i)+i", () => {
            const input = [
                LITERALS.FIVE,
                LITERALS.PLUS,
                LITERALS.i,
                LITERALS.MUL,
                LITERALS.OB,
                LITERALS.i,
                LITERALS.CB,
                LITERALS.PLUS,
                END,
            ];
            const result = analyzer.exec(table, input);
            expect(result).toMatchObject({
                ok: false,
                error: new exceptions.analyzer.IncorrectSequenceOrderException(),
            });
        });
    });
});
