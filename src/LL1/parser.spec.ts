import { parser } from "./parser";
import { tokenize } from "../common/parser";

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
<B>->+ 5<B>
<B>->e
            `;

            const expected = {
                terminals: [LITERALS.FIVE, LITERALS.PLUS, LITERALS.e],
                nonTerminals: [LITERALS.A, LITERALS.B],
            };

            const actual = tokenize(input);

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

    describe("factorization first", () => {
        const input = `
<A>-><B><C>
<A>-><D><B>
<A>->a x<F>
`;

        const actual = parser.factorization(input);
        const expected = `<A>-><B> <C>
<A>-><D> <B>
<A>->a x <F>
`;

        expect(actual).toEqual(expected);
    });

    describe("factorization second", () => {
        const input = `
<A>-><B><C>
<A>-><B><C><D>
<A>->a x<F>
<A>->a x y
<A>->a x z
`;

        const actual = parser.factorization(input);
        const expected = `<A>-><B> <C> <A0>
<A0>->e
<A0>-><D>
<A>->a x <B0>
<B0>-><F>
<B0>->y
<B0>->z
`;

        expect(actual).toEqual(expected);
    });

    describe("factorization reverse", () => {
        const input = `
<A>-><B><C>
<A>-><D><B><C>
<A>-><F>a x
<A>->y a x
<A>->z a x
`;

        const actual = parser.factorization(input);
        const expected = `<A>-><B> <C>
<A>-><D> <B> <C>
<A>-><F> a x
<A>->y a x
<A>->z a x
`;

        expect(actual).toEqual(expected);
    });

    describe("factorization reverse and not reverse", () => {
        const input = `
<A>-><B><C>
<A>-><D><B><C>
<A>->a x<F>
<A>->a x y
<A>->a x z
`;

        const actual = parser.factorization(input);
        const expected = `<A>->a x <A0>
<A0>-><F>
<A0>->y
<A0>->z
<A>-><B> <C>
<A>-><D> <B> <C>
`;

        expect(actual).toEqual(expected);
    });

    describe("factorization with one element", () => {
        const input = `
<A>-><B><C>
<A>-><B><D>
<A>->a<F>
<A>->a y
<A>->a z
`;

        const actual = parser.factorization(input);
        const expected = `<A>-><B> <A0>
<A0>-><C>
<A0>-><D>
<A>->a <B0>
<B0>-><F>
<B0>->y
<B0>->z
`;

        expect(actual).toEqual(expected);
    });

    describe("factorization with more symbols after same symbols", () => {
        const input = `
<A>->a x<F>⊥
<A>->a x y
<A>->a x z
<F>->m
`;

        const actual = parser.factorization(input);
        const expected = `<A>->a x <A0>
<A0>-><F> ⊥
<A0>->y
<A0>->z
<F>->m
`;

        expect(actual).toEqual(expected);
    });

    describe("factorization hardest", () => {
        const input = `<Z>-><S> ⊥
<S>-><T><A0>
<A0>->+ <A><A0>
<A0>->e
<T>-><A><B0>
<B0>->* <A><B0>
<B0>->e
<A>->- <A>
<A>->( <A> )
<A>->hex
<A>->identification
`;

        const actual = parser.factorization(input);
        const expected = `<Z>-><S> ⊥
<S>-><T> <A0>
<A0>->+ <A> <A0>
<A0>->e
<T>-><A> <B0>
<B0>->* <A> <B0>
<B0>->e
<A>->- <A>
<A>->( <A> )
<A>->hex
<A>->identification
`;

        expect(actual).toEqual(expected);
    });

    describe("left resursion simple", () => {
        const input = `
<A>-><A> + 5
<A>->5
`;

        const actual = parser.leftRecursion(input);
        const expected = `<A>->5<A0>
<A0>->+ 5<A0>
<A0>->e
`;

        expect(actual).toEqual(expected);
    });

    describe("left resursion not space", () => {
        const input = `
<A>-><A>x<F>
<A>->y
<F>->m
`;

        const actual = parser.leftRecursion(input);
        const expected = `<A>->y<A0>
<A0>->x <F><A0>
<A0>->e
<F>->m
`;

        expect(actual).toEqual(expected);
    });

    describe("left resursion hard", () => {
        const input = `
<S>-><S>+<A>
<S>-><S>*<A>
<S>->5
<A>->(<A>)
<A>->i
`;

        const actual = parser.leftRecursion(input);
        const expected = `<S>->5<A0>
<A0>->+ <A><A0>
<A0>->* <A><A0>
<A0>->e
<A>->( <A> )
<A>->i
`;

        expect(actual).toEqual(expected);
    });
    describe("left resursion hardest", () => {
        const input = `
<Z>-><S>⊥
<S>-><S>+<A>
<S>-><S>*<A>
<S>->5
<A>->(<A>)
<A>->i
`;

        const actual = parser.leftRecursion(input);
        const expected = `<Z>-><S> ⊥
<S>->5<A0>
<A0>->+ <A><A0>
<A0>->* <A><A0>
<A0>->e
<A>->( <A> )
<A>->i
`;

        expect(actual).toEqual(expected);
    });

    describe("left resursion hardest", () => {
        const input = `<Z>-><S>⊥
<S>-><S>+<A>
<S>-><T>
<T>-><T>*<A>
<T>-><A>
<A>->-<A>
<A>->(<A>)
<A>->hex
<A>->identification
`;

        const actual = parser.leftRecursion(input);
        const expected = `<Z>-><S> ⊥
<S>-><T><A0>
<A0>->+ <A><A0>
<A0>->e
<T>-><A><B0>
<B0>->* <A><B0>
<B0>->e
<A>->- <A>
<A>->( <A> )
<A>->hex
<A>->identification
`;

        expect(actual).toEqual(expected);
    });

    describe("not LL(1)", () => {
        const input = `
<S>-><A><S>
<S>->b
<A>-><S><A>
<A>->a
`;

        const actual = parser.leftRecursion(input);
        const expected = "Grammar is not LL (1), parsing table cannot be built";

        expect(actual).toEqual(expected);
    });
});
