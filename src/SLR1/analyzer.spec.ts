import { Grammar } from "../common/common";
import { generator } from "./generator";
import { analyzer } from "./analyzer";
import { END } from "../common/constants";

describe("analyzer", () => {
    const LITERALS = {
        IDLIST: "idlist",
        ID: "id",
        REAL: "real",
        A: "A",
        S: "S",
        COMMA: ",",
        OK: "ok",
    };

    const grammars: Grammar[] = [
        {
            nonTerminal: LITERALS.S,
            rightPart: [LITERALS.REAL, LITERALS.IDLIST],
            elements: [LITERALS.REAL],
        },
        {
            nonTerminal: LITERALS.IDLIST,
            rightPart: [LITERALS.IDLIST, LITERALS.COMMA, LITERALS.ID],
            elements: [LITERALS.IDLIST, LITERALS.ID, LITERALS.A],
        },
        {
            nonTerminal: LITERALS.IDLIST,
            rightPart: [LITERALS.ID],
            elements: [LITERALS.ID, LITERALS.A],
        },
        {
            nonTerminal: LITERALS.ID,
            rightPart: [LITERALS.A],
            elements: [LITERALS.A],
        },
    ];

    it("should success table return", () => {
        const rows = generator.exec(grammars);

        const input: string[] = ["real", "A", END];

        analyzer.exec(rows, input, grammars);
    });
});
