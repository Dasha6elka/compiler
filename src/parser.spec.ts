import { parser } from "./parser";
import { END } from "./constants";

describe("parser", () => {
    const LITERALS = {
        A: "A",
        B: "B",
        FIVE: "5",
        PLUS: "+",
        e: "e",
        END,
    };

    it("should parse <A>->5<B>  <B>->+5<B> <B>->e", () => {
        const input = `
<A>->5<B>
<B>->+5<B>
<B>->e
        `;

        const expected = {
            terminals: [LITERALS.FIVE, LITERALS.PLUS, LITERALS.e],
            nonTerminals: [LITERALS.A, LITERALS.B],
        };

        const actual = parser.tokenize(input);

        expect(actual.terminals.size).toEqual(expected.terminals.length);
        expect(actual.nonTerminals.size).toEqual(expected.nonTerminals.length);

        const actualTerminals = Array.from(actual.terminals.values()).map(t => t.description);
        expect(actualTerminals).toEqual(expect.arrayContaining(expected.terminals));

        const actualNonTerminals = Array.from(actual.nonTerminals.values()).map(t => t.description);
        expect(actualNonTerminals).toEqual(expect.arrayContaining(expected.nonTerminals));
    });
});
