import { parser } from "./parser";

describe("parser", () => {
    describe("tokenize", () => {
        const LITERALS = {
            A: "A",
            B: "B",
            FIVE: "5",
            PLUS: "+",
            e: "e",
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

            const actualTerminals = Array.from(actual.terminals.values());
            expect(actualTerminals).toEqual(expect.arrayContaining(expected.terminals));

            const actualNonTerminals = Array.from(actual.nonTerminals.values());
            expect(actualNonTerminals).toEqual(expect.arrayContaining(expected.nonTerminals));
        });
    });

    describe("transitionize", () => {
        const input = `
<A>->5<B><A>
<B>->+5<B><S>if while<S><A>
<B>->e
<S>->e
        `;

        const expected = new Map<string, string[]>();
        expected.set("B", ["A", "S"]);
        expected.set("S", ["A"]);

        const actual = parser.transitionize(input);

        for (const [key, values] of expected) {
            expect(actual.has(key)).toBeTruthy();
            const row = actual.get(key)!;
            expect(values).toEqual(expect.arrayContaining(row));
        }
    });
});
