import { parser } from "./parser";
import { set } from "./set";
import { generator } from "./generator";
import { analyzer } from "./analyzer";
import { lexer } from "../lexer";
import fs from "fs";

const inputString = "-(-i+0.32*a1)*-i⊥";

function main() {
    let tokensLexer: string[] = [];
    tokensLexer = lexer.main("./lexer.txt", tokensLexer);

    let input = fs.readFileSync("./input.txt", "utf-8").trim();
    input = parser.leftRecursion(input);
    input = parser.factorization(input);
    const options = parser.optionize(input);
    const table = parser.parse(input);
    set.exec(table, options, input); // построение направляющего множества
    const rules = parser.rules(options);
    const grammars = parser.grammars(input, table);
    const tokens = generator.exec(rules, grammars, tokensLexer); // готовая таблица
    const map = Array.from(options).map(option => option.grammar.size);
    parser.pointerize(tokens, rules, map);
    const result = analyzer.exec(tokens, inputString); // бегунок по таблице
    console.log(result);
}

main();
