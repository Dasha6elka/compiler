import { parser } from "./parser";
import { set } from "./set";
import { generator } from "./generator";
import { analyzer } from "./analyzer";
import { lexer } from "../lexer";
import fs from "fs";

// <Z>-><S>⊥
// <S>-><S>+<T>
// <S>-><T>
// <T>-><T>*<A>
// <T>-><A>
// <A>->-<A>
// <A>->(<S>)
// <A>->55
// <A>->identification
// <A>->5.5
// <A>->0xABC

// <S>->a<S>b
// <S>->e

// <U>-><A><B><C>⊥
// <A>->+<A>-
// <A>->e
// <B>->*<B>a
// <B>->e
// <C>->55<C>;
// <C>->e

const inputString = "-5+-(-5.5)+(5+5)+-c3⊥";

function main() {
    let alphabetIndex = 0;
    let letterIndex = 0;

    let tokensLexer: string[] = [];
    tokensLexer = lexer.main("./lexer.txt", tokensLexer);

    let string = fs.readFileSync("./input.txt", "utf-8").trim();
    let input = parser.leftRecursion(string, alphabetIndex, letterIndex);
    string = parser.factorization(input.result, input.alphabetIndex, input.letterIndex);
    const options = parser.optionize(string);
    const table = parser.parse(string, options);
    set.exec(table, options, string); // построение направляющего множества
    const rules = parser.rules(options);
    const grammars = parser.grammars(string, table);
    const tokens = generator.exec(rules, grammars, tokensLexer); // готовая таблица
    const map = Array.from(options).map(option => option.grammar.size);
    parser.pointerize(tokens, rules, map);
    const result = analyzer.exec(tokens, [inputString]); // бегунок по таблице
    console.log(result);
}

main();
