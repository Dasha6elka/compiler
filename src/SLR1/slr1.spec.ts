import { Literal, Grammar } from "../common/common";
import { END } from "../common/constants";
import { slr1 } from "./slr1";

describe("slr1", () => {
    const LITERALS = {
        IDLIST: "idlist",
        ID: "id",
        REAL: "real",
        A: "A",
        B: "B",
        C: "C",
        S: "S",
        COMMA: ",",
        OK: "ok",
    };

    it("should success table return", () => {
        const expected: Map<Literal, Literal[]> = new Map<Literal, Literal[]>();

        const grammars: Grammar[] = [
            {
                non_terminal: LITERALS.S,
                right_part: [LITERALS.REAL, LITERALS.IDLIST],
                elements: [LITERALS.REAL],
            },
            {
                non_terminal: LITERALS.IDLIST,
                right_part: [LITERALS.IDLIST, LITERALS.COMMA, LITERALS.ID],
                elements: [LITERALS.IDLIST, LITERALS.ID, LITERALS.A, LITERALS.B, LITERALS.C],
            },
            {
                non_terminal: LITERALS.IDLIST,
                right_part: [LITERALS.ID],
                elements: [LITERALS.ID, LITERALS.A, LITERALS.B, LITERALS.C],
            },
            {
                non_terminal: LITERALS.ID,
                right_part: [LITERALS.A, LITERALS.B, LITERALS.C],
                elements: [LITERALS.A, LITERALS.B, LITERALS.C],
            },
        ];

        slr1.slr1(grammars);

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
