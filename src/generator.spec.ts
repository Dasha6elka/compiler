import { generator } from "./generator";
import { TokenTable, Literal, LiteralToken, SymbolType, LiteralSet } from "./common";
import { END } from "./constants";
import { parser } from "./parser";
import { factory } from "./factory";

describe("generator", () => {
    describe("<S>->if/if", () => {
        const LITERALS = {
            S: "S",
            if: "if",
        };

        const leftTokensTable = new Map<Literal, LiteralSet>();
        leftTokensTable.set(LITERALS.S, factory.createLiteralSet([LITERALS.if]));

        const rightTerminals = new Map<Literal, LiteralSet>();
        rightTerminals.set(LITERALS.if, factory.createLiteralSet([LITERALS.if]));

        it("should create table with 2 rows", () => {
            let index = 0;

            const table: TokenTable = new Map<number, LiteralToken>();
            const leftInputTokens = [];

            for (const pair of leftTokensTable) {
                const [key, values] = pair;
                const row = new generator.RuleToken(index, key, values!, true);
                leftInputTokens.push(row);
                row.visit(table);
                index++;
            }

            for (const pair of rightTerminals) {
                const [key, values] = pair;
                const row = new generator.GrammarToken(index, key, values!, SymbolType.Terminal, leftInputTokens, true);
                row.visit(table);
                index++;
            }

            const result: TokenTable = new Map<number, LiteralToken>();
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
        interface RightLiteralOption {
            set: LiteralSet;
            type: SymbolType;
            last: boolean;
            end: boolean;
        }

        interface GrammarValue {
            literal: Literal;
            options: RightLiteralOption;
        }

        interface RuleValue {
            literal: Literal;
            set: LiteralSet;
            last: boolean;
        }

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
            let index = 0;

            const table: TokenTable = new Map<number, LiteralToken>();
            const leftInputTokens = [];

            for (const pair of rules) {
                const { literal: key, set: values } = pair;
                const row = new generator.RuleToken(index, key, values!, pair.last);
                leftInputTokens.push(row);
                row.visit(table);
                index++;
            }

            for (const pair of grammars) {
                const { literal: key, options: values } = pair;

                let row;
                if (values.type === SymbolType.Terminal) {
                    row = new generator.GrammarToken(
                        index,
                        key,
                        values.set,
                        values.type,
                        leftInputTokens,
                        values.last,
                        values.end,
                    );
                } else if (values.type === SymbolType.Nonterminal) {
                    row = new generator.GrammarToken(
                        index,
                        key,
                        values.set,
                        values.type,
                        leftInputTokens,
                        values.last,
                        values.end,
                    );
                } else if (values.type === SymbolType.Empty) {
                    row = new generator.GrammarToken(
                        index,
                        key,
                        values.set,
                        values.type,
                        leftInputTokens,
                        values.last,
                        values.end,
                    );
                }

                row?.visit(table);
                index++;
            }

            const result: TokenTable = new Map<number, LiteralToken>();
            result.set(0, {
                end: false,
                error: true,
                rule: LITERALS.A,
                offset: false,
                pointer: 3,
                first: factory.createLiteralSet([LITERALS.FIVE]),
                stack: false,
            });
            result.set(1, {
                end: false,
                error: false,
                rule: LITERALS.B,
                offset: false,
                pointer: 5,
                first: factory.createLiteralSet([LITERALS.PLUS]),
                stack: false,
            });
            result.set(2, {
                end: false,
                error: true,
                rule: LITERALS.B,
                offset: false,
                pointer: 8,
                first: factory.createLiteralSet([END]),
                stack: false,
            });
            result.set(3, {
                end: false,
                error: true,
                rule: LITERALS.FIVE,
                offset: true,
                pointer: 4,
                first: factory.createLiteralSet([LITERALS.FIVE]),
                stack: false,
            });
            result.set(4, {
                end: false,
                error: true,
                rule: LITERALS.B,
                offset: false,
                pointer: 1,
                first: factory.createLiteralSet([LITERALS.PLUS, END]),
                stack: false,
            });
            result.set(5, {
                end: false,
                error: true,
                rule: LITERALS.PLUS,
                offset: true,
                pointer: 6,
                first: factory.createLiteralSet([LITERALS.PLUS]),
                stack: false,
            });
            result.set(6, {
                end: false,
                error: true,
                rule: LITERALS.FIVE,
                offset: true,
                pointer: 7,
                first: factory.createLiteralSet([LITERALS.FIVE]),
                stack: false,
            });
            result.set(7, {
                end: false,
                error: true,
                rule: LITERALS.B,
                offset: false,
                pointer: 1,
                first: factory.createLiteralSet([LITERALS.PLUS, END]),
                stack: false,
            });
            result.set(8, {
                end: true,
                error: true,
                rule: LITERALS.e,
                offset: false,
                pointer: null,
                first: factory.createLiteralSet([END]),
                stack: false,
            });

            parser.pointerize(table, rules.length, [2, 3, 1]);

            for (const [key, values] of table) {
                expect(result.has(key)).toBeTruthy();
                const row = result.get(key);
                expect(values).toEqual(expect.objectContaining(row));
            }
        });
    });
});
