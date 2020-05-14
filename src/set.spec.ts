import { Literal, LiteralOption, LiteralSet } from "./common";
import { set } from "./set";
import { utils } from "./utils";

describe("generator", () => {
    describe("<S>->a<A>  <S>->b  <A>->c<A><S>  <A>->e", () => {
        const TERMINALS = {
            A: Symbol("A"),
            S: Symbol("S"),
        };
        const TERMINALS_LIST = utils.LiteralSetFactory.create([TERMINALS.A, TERMINALS.S]);

        const NON_TERMINALS = {
            a: Symbol("a"),
            b: Symbol("b"),
            c: Symbol("c"),
            e: Symbol("e"),
        };
        const NON_TERMINALS_LIST = utils.LiteralSetFactory.create([
            NON_TERMINALS.a,
            NON_TERMINALS.b,
            NON_TERMINALS.c,
            NON_TERMINALS.e,
        ]);

        const transitions = new Map<Literal, Literal>();
        transitions.set(TERMINALS.A, TERMINALS.S);

        const table = new Map<Literal, LiteralSet>();
        table.set(TERMINALS.S, utils.LiteralSetFactory.create([NON_TERMINALS.a, NON_TERMINALS.b]));
        table.set(
            TERMINALS.A,
            utils.LiteralSetFactory.create([TERMINALS.S, NON_TERMINALS.c, NON_TERMINALS.e]),
        );

        const literalOptions = new Set<LiteralOption>();
        literalOptions.add({
            rule: TERMINALS.S,
            grammar: utils.LiteralSetFactory.create([NON_TERMINALS.a, TERMINALS.A]),
            first: utils.LiteralSetFactory.create([]),
        });
        literalOptions.add({
            rule: TERMINALS.S,
            grammar: utils.LiteralSetFactory.create([NON_TERMINALS.b]),
            first: utils.LiteralSetFactory.create([]),
        });
        literalOptions.add({
            rule: TERMINALS.A,
            grammar: utils.LiteralSetFactory.create([NON_TERMINALS.c, TERMINALS.A, TERMINALS.S]),
            first: utils.LiteralSetFactory.create([]),
        });
        literalOptions.add({
            rule: TERMINALS.A,
            grammar: utils.LiteralSetFactory.create([NON_TERMINALS.e]),
            first: utils.LiteralSetFactory.create([]),
        });

        it("should return rule with set", () => {
            const actual: Set<LiteralOption> = set.exec(
                table,
                TERMINALS_LIST,
                NON_TERMINALS_LIST,
                literalOptions,
            );

            const expected: Set<LiteralOption> = new Set<LiteralOption>();
            expected.add({
                rule: TERMINALS.S,
                grammar: utils.LiteralSetFactory.create([NON_TERMINALS.a, TERMINALS.A]),
                first: utils.LiteralSetFactory.create([NON_TERMINALS.a]),
            });
            expected.add({
                rule: TERMINALS.S,
                grammar: utils.LiteralSetFactory.create([NON_TERMINALS.b]),
                first: utils.LiteralSetFactory.create([NON_TERMINALS.b]),
            });
            expected.add({
                rule: TERMINALS.A,
                grammar: utils.LiteralSetFactory.create([
                    NON_TERMINALS.c,
                    TERMINALS.A,
                    TERMINALS.S,
                ]),
                first: utils.LiteralSetFactory.create([NON_TERMINALS.a]),
            });
            expected.add({
                rule: TERMINALS.A,
                grammar: utils.LiteralSetFactory.create([NON_TERMINALS.e]),
                first: utils.LiteralSetFactory.create([
                    NON_TERMINALS.e,
                    NON_TERMINALS.a,
                    NON_TERMINALS.b,
                ]),
            });

            expect(actual).toEqual(expect.objectContaining(expected));
        });
    });
});
