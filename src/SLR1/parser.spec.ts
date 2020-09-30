import { Grammar } from "../common/common";
import { parser } from "./parser";


describe("parser", () => {
    const LITERALS = {
        IDLIST: "idlist",
        ID: "id",
        REAL: "real",
        A: "A",
        S: "S",
        COMMA: ",",
        OK: "ok",
    };


    it("should success table return", () => {
        const expected: Grammar[] = [
            {
                nonTerminal: LITERALS.S,
                rightPart: [LITERALS.REAL, LITERALS.IDLIST],
                elements: [LITERALS.REAL],
            },
            {
                nonTerminal: LITERALS.IDLIST,
                rightPart: [LITERALS.IDLIST, LITERALS.COMMA, LITERALS.ID],
                elements: [LITERALS.IDLIST, LITERALS.A, LITERALS.ID],
            },
            {
                nonTerminal: LITERALS.IDLIST,
                rightPart: [LITERALS.ID],
                elements: [LITERALS.A, LITERALS.ID],
            },
            {
                nonTerminal: LITERALS.ID,
                rightPart: [LITERALS.A],
                elements: [LITERALS.A],
            },
        ];

        const input = `
<S>->real<idlist>
<idlist>-><idlist>,<id>
<idlist>-><id>
<id>->A
`

        const actual = parser.exec(input);

        let i = 0;
        actual.forEach(grammar => {
            expect(grammar.nonTerminal).toEqual(expected[i].nonTerminal);
            expect(grammar.rightPart).toEqual(expected[i].rightPart);
            expect(grammar.elements).toEqual(expected[i].elements);

            i++;
        });
    });
});
