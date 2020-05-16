import { generator } from "./generator";
import { TokenTable, SymbolType, RuleValue, GrammarValue } from "./common";
import { END } from "./constants";
import { parser } from "./parser";
import { factory } from "./factory";

describe("generator", () => {
    describe("<S>->if/if", () => {
        const LITERALS = {
            S: "S",
            if: "if",
        };

        const rules: RuleValue[] = [
            {
                literal: LITERALS.S,
                set: factory.createLiteralSet([LITERALS.if]),
                last: true,
            },
        ];

        const grammars: GrammarValue[] = [
            {
                literal: LITERALS.if,
                options: {
                    set: factory.createLiteralSet([LITERALS.if]),
                    type: SymbolType.Terminal,
                    last: false,
                    end: false,
                },
            },
        ];

        it("should create table with 2 rows", () => {
            const table: TokenTable = generator.exec(rules, grammars);

            const result: TokenTable = factory.createTokenTable();
            result.set(0, {
                end: false,
                error: true,
                rule: LITERALS.S,
                offset: false,
                pointer: null,
                first: factory.createLiteralSet([LITERALS.S]),
                stack: false,
            });
            result.set(1, {
                end: false,
                error: true,
                rule: LITERALS.if,
                offset: true,
                pointer: null,
                first: factory.createLiteralSet([LITERALS.if]),
                stack: false,
            });

            expect(table).toEqual(expect.objectContaining(result));
        });
    });

    describe("<A>->5<B>/5  <B>->+5<B>/+  <B>->e/⊥", () => {
        const LITERALS = {
            FIVE: "5",
            PLUS: "+",
            A: "A",
            B: "B",
            e: "e",
        };

        const rules: RuleValue[] = [
            {
                literal: LITERALS.A,
                set: factory.createLiteralSet([LITERALS.FIVE]),
                last: true,
            },
            {
                literal: LITERALS.B,
                set: factory.createLiteralSet([LITERALS.PLUS]),
                last: false,
            },
            {
                literal: LITERALS.B,
                set: factory.createLiteralSet([END]),
                last: true,
            },
        ];

        const grammars: GrammarValue[] = [
            {
                literal: LITERALS.FIVE,
                options: {
                    set: factory.createLiteralSet([LITERALS.FIVE]),
                    type: SymbolType.Terminal,
                    last: false,
                    end: false,
                },
            },
            {
                literal: LITERALS.B,
                options: {
                    set: factory.createLiteralSet([LITERALS.PLUS, END]),
                    type: SymbolType.Nonterminal,
                    last: true,
                    end: false,
                },
            },
            {
                literal: LITERALS.PLUS,
                options: {
                    set: factory.createLiteralSet([LITERALS.PLUS]),
                    type: SymbolType.Terminal,
                    last: false,
                    end: false,
                },
            },
            {
                literal: LITERALS.FIVE,
                options: {
                    set: factory.createLiteralSet([LITERALS.FIVE]),
                    type: SymbolType.Terminal,
                    last: false,
                    end: false,
                },
            },
            {
                literal: LITERALS.B,
                options: {
                    set: factory.createLiteralSet([LITERALS.PLUS, END]),
                    type: SymbolType.Nonterminal,
                    last: true,
                    end: false,
                },
            },
            {
                literal: LITERALS.e,
                options: {
                    set: factory.createLiteralSet([END]),
                    type: SymbolType.Empty,
                    last: true,
                    end: true,
                },
            },
        ];

        it("should create table with 9 rows", () => {
            const table: TokenTable = generator.exec(rules, grammars);

            const expected: TokenTable = factory.createTokenTable();
            expected.set(0, {
                end: false,
                error: true,
                rule: LITERALS.A,
                offset: false,
                pointer: 3,
                first: factory.createLiteralSet([LITERALS.FIVE]),
                stack: false,
            });
            expected.set(1, {
                end: false,
                error: false,
                rule: LITERALS.B,
                offset: false,
                pointer: 5,
                first: factory.createLiteralSet([LITERALS.PLUS]),
                stack: false,
            });
            expected.set(2, {
                end: false,
                error: true,
                rule: LITERALS.B,
                offset: false,
                pointer: 8,
                first: factory.createLiteralSet([END]),
                stack: false,
            });
            expected.set(3, {
                end: false,
                error: true,
                rule: LITERALS.FIVE,
                offset: true,
                pointer: 4,
                first: factory.createLiteralSet([LITERALS.FIVE]),
                stack: false,
            });
            expected.set(4, {
                end: false,
                error: true,
                rule: LITERALS.B,
                offset: false,
                pointer: 1,
                first: factory.createLiteralSet([LITERALS.PLUS, END]),
                stack: false,
            });
            expected.set(5, {
                end: false,
                error: true,
                rule: LITERALS.PLUS,
                offset: true,
                pointer: 6,
                first: factory.createLiteralSet([LITERALS.PLUS]),
                stack: false,
            });
            expected.set(6, {
                end: false,
                error: true,
                rule: LITERALS.FIVE,
                offset: true,
                pointer: 7,
                first: factory.createLiteralSet([LITERALS.FIVE]),
                stack: false,
            });
            expected.set(7, {
                end: false,
                error: true,
                rule: LITERALS.B,
                offset: false,
                pointer: 1,
                first: factory.createLiteralSet([LITERALS.PLUS, END]),
                stack: false,
            });
            expected.set(8, {
                end: true,
                error: true,
                rule: LITERALS.e,
                offset: false,
                pointer: null,
                first: factory.createLiteralSet([END]),
                stack: false,
            });

            parser.pointerize(table, rules, [2, 3, 1]);

            for (const [key, values] of table) {
                expect(expected.has(key)).toBeTruthy();
                const row = expected.get(key);
                expect(values).toEqual(expect.objectContaining(row));
            }
        });
    });
});
