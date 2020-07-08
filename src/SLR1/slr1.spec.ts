import { Literal, Grammar } from "../common/common";
import { END } from "../common/constants";
import { slr1 } from "./slr1";

describe("slr1", () => {
    const LITERALS = {
        IDLIST: "idlist",
        ID: "id",
        REAL: "real",
        ABC: "ABC",
        S: "S",
        COMMA: ",",
        OK: "ok",
    };

    it("should success table return", () => {
        const expected: Map<Literal, Literal[]> = new Map<Literal, Literal[]>();

        const grammars: Grammar[] = [
            {
                nonTerminal: LITERALS.S,
                rightPart: [LITERALS.REAL, LITERALS.IDLIST],
                elements: [LITERALS.REAL],
            },
            {
                nonTerminal: LITERALS.IDLIST,
                rightPart: [LITERALS.IDLIST, LITERALS.COMMA, LITERALS.ID],
                elements: [LITERALS.IDLIST, LITERALS.ID, LITERALS.ABC],
            },
            {
                nonTerminal: LITERALS.IDLIST,
                rightPart: [LITERALS.ID],
                elements: [LITERALS.ID, LITERALS.ABC],
            },
            {
                nonTerminal: LITERALS.ID,
                rightPart: [LITERALS.ABC],
                elements: [LITERALS.ABC],
            },
        ];

        slr1.exec(grammars);

        expected.set(LITERALS.S, [LITERALS.OK, "", "", "", "", "", ""]);
        expected.set(LITERALS.REAL, ["", "S3", "", "", "", "", ""]);
        expected.set(LITERALS.IDLIST, ["", "S4", "", "", "", "S7", ""]);
        expected.set(LITERALS.ID, ["", "S5", "", "", "", "S5", ""]);
        expected.set(END, ["", "", "R1", "R3", "R4", "", "R2"]);
        expected.set(LITERALS.COMMA, ["", "", "S6", "R3", "R4", "", "R2"]);

        // for (const [key, values] of actual) {
        //     expect(expected.has(key)).toBeTruthy();
        //     const row = expected.get(key);
        //     expect(values).toEqual(expect.objectContaining(row));
        // }
    });
});
