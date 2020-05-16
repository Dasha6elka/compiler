import { Literal, LiteralOption } from "./common";
import { set } from "./set";
import { parser } from "./parser";
import { factory } from "./factory";
import { END } from "./constants";

describe("generator", () => {
    describe("<S>->a<A>  <S>->b  <A>->c<A><S>  <A>->e", () => {
        const input = `
<S>->a<A>
<S>->b
<A>->c<A><S>
<A>->e
`;
        const TERMINALS = {
            A: "A",
            S: "S",
        };

        const NON_TERMINALS = {
            a: "a",
            b: "b",
            c: "c",
            e: "e",
        };

        const transitions = new Map<Literal, Literal>();
        transitions.set(TERMINALS.A, TERMINALS.S);

        const table = parser.parse(input);

        const options = new Set<LiteralOption>();
        options.add({
            rule: TERMINALS.S,
            grammar: factory.createLiteralSet([NON_TERMINALS.a, TERMINALS.A]),
            first: factory.createLiteralSet([]),
        });
        options.add({
            rule: TERMINALS.S,
            grammar: factory.createLiteralSet([NON_TERMINALS.b]),
            first: factory.createLiteralSet([]),
        });
        options.add({
            rule: TERMINALS.A,
            grammar: factory.createLiteralSet([NON_TERMINALS.c, TERMINALS.A, TERMINALS.S]),
            first: factory.createLiteralSet([]),
        });
        options.add({
            rule: TERMINALS.A,
            grammar: factory.createLiteralSet([NON_TERMINALS.e]),
            first: factory.createLiteralSet([]),
        });

        it("should return rule with set", () => {
            const actual: Set<LiteralOption> = set.exec(table, options);

            const expected: Set<LiteralOption> = new Set<LiteralOption>();
            expected.add({
                rule: TERMINALS.S,
                grammar: factory.createLiteralSet([NON_TERMINALS.a, TERMINALS.A]),
                first: factory.createLiteralSet([NON_TERMINALS.a]),
            });
            expected.add({
                rule: TERMINALS.S,
                grammar: factory.createLiteralSet([NON_TERMINALS.b]),
                first: factory.createLiteralSet([NON_TERMINALS.b]),
            });
            expected.add({
                rule: TERMINALS.A,
                grammar: factory.createLiteralSet([NON_TERMINALS.c, TERMINALS.A, TERMINALS.S]),
                first: factory.createLiteralSet([NON_TERMINALS.c]),
            });
            expected.add({
                rule: TERMINALS.A,
                grammar: factory.createLiteralSet([NON_TERMINALS.e]),
                first: factory.createLiteralSet([NON_TERMINALS.c, NON_TERMINALS.a, NON_TERMINALS.b, END]),
            });

            Array.from(expected.values()).forEach((expectedValue, index) => {
                const actualValue = Array.from(actual)[index];
                const actualArray = Array.from(expectedValue.first);
                const expectedArray = Array.from(actualValue?.first);
                expect(expectedArray).toEqual(expect.arrayContaining(actualArray));
            });
        });
    });
});
