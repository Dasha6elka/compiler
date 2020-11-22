import fs from "fs";
import { parser } from "./parser";
import { generator } from "./generator";
import { analyzer } from "./analyzer";
import { Grammars, Row } from "../common/common";
import { Lexer } from "lexer4js";

function main() {
    const lexer = new Lexer();
    const source = fs.readFileSync("./lexerSLR.txt", "utf8");
    const tokensInput = lexer.tokenize(source);

    let input = fs.readFileSync("./inputSLR.txt", "utf-8").trim();
    const set: Grammars = parser.exec(input);
    const table: Row[] = generator.exec(set, tokensInput);
    const result = analyzer.exec(table, set, tokensInput, source);
    console.log(result);
}

try {
    main();
} catch (error) {
    console.error(error);
}
