import { parser } from "./parser";
import { set } from "./set";
import { generator } from "./generator";
import { analyzer } from "./analyzer";
import { lexer } from "../lexer";

const args = [
    `
<Z>-><S>⊥
<S>-><S>+<A>
<S>-><T>
<T>-><T>*<A>
<T>-><A>
<A>->-<A>
<A>->(<A>)
<A>->hex
<A>->identification
`,
    "- ( - i ) * - i ⊥",
];

function main() {
    let tokensLexer: string[] = [];
    tokensLexer = lexer.main("./lexer.txt", tokensLexer);

    let input = args[0].trim();
    input = parser.leftRecursion(input);
    input = parser.factorization(input);
    const seq = args[1].split(" ");
    const options = parser.optionize(input);
    const table = parser.parse(input);
    set.exec(table, options, input);
    const rules = parser.rules(options);
    const grammars = parser.grammars(input, table);
    const tokens = generator.exec(rules, grammars, tokensLexer);
    const map = Array.from(options).map(option => option.grammar.size);
    parser.pointerize(tokens, rules, map);
    const result = analyzer.exec(tokens, seq);
    console.log(result);
}

main();
