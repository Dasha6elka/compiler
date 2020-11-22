import { Grammar } from "../common/common";
import { generator } from "./generator";
import { analyzer } from "./analyzer";
import { Lexer } from "lexer4js";
import fs from "fs";

describe("analyzer", () => {
    const LITERALS = {
        IDLIST: "idlist",
        ID: "id",
        REAL: "real",
        A: "A",
        S: "S",
        COMMA: ",",
        OK: "ok",
        B: "B",
        C: "C",
        a: "a",
        b: "b",
        c: "c",
    };

    const lexer = new Lexer();
    const source = fs.readFileSync("./lexer.txt", "utf8");
    const tokensLexer = lexer.tokenize(source);

    it("should success table return", () => {
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
        const rows = generator.exec(grammars, tokensLexer);

        const input: string = "real A";

        const result = analyzer.exec(rows, grammars, tokensLexer, input);

        expect(result).toMatchObject({
            ok: true,
            error: null,
        });
    });

    it("should success table return", () => {
        const grammars: Grammar[] = [
            {
                nonTerminal: LITERALS.S,
                rightPart: [LITERALS.A, LITERALS.B, LITERALS.C],
                elements: [LITERALS.a],
            },
            {
                nonTerminal: LITERALS.A,
                rightPart: [LITERALS.a],
                elements: [LITERALS.a],
            },
            {
                nonTerminal: LITERALS.B,
                rightPart: [LITERALS.b],
                elements: [LITERALS.b],
            },
            {
                nonTerminal: LITERALS.C,
                rightPart: [LITERALS.c],
                elements: [LITERALS.c],
            },
        ];
        const rows = generator.exec(grammars, tokensLexer);

        const input: string = "a b c";

        const result = analyzer.exec(rows, grammars, tokensLexer, input);

        expect(result).toMatchObject({
            ok: true,
            error: null,
        });
    });
});
