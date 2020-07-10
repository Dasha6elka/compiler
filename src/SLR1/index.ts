import { lexer } from "../lexer";
import fs from "fs";
import { parser } from "./parser";
import { generator } from "./generator";
import { analyzer } from "./analyzer";
import { Grammars, Row } from "../common/common";
import { END } from "../common/constants";

const inputString = "-(-i+0.32*a1)*-i⊥";
const inputArray: string[] = ["real", "A", END];

function main() {
    let tokensLexer: string[] = [];
    tokensLexer = lexer.main("./lexer.txt", tokensLexer);

    let input = fs.readFileSync("./inputSLR.txt", "utf-8").trim();
    const set: Grammars = parser.exec(input);
    const table: Row[] = generator.exec(set);
    const result = analyzer.exec(table, inputArray, set);
    console.log(result);
}

main();
