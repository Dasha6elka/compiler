import { parser } from "./parser";
import { set } from "./set";
import { generator } from "./generator";
import { analyzer } from "./analyzer";

const args = [
    `
<A>->a x<F>⊥
<A>->a x y
<F>->m
`,
    "a,x,m,⊥",
];

function main() {
    let input = args[0].trim();
    input = parser.factorization(input);
    const seq = args[1].split(",")[Symbol.iterator]();
    const options = parser.optionize(input);
    const table = parser.parse(input);
    set.exec(table, options, input);
    const rules = parser.rules(input, options);
    const grammars = parser.grammars(input, table);
    const tokens = generator.exec(rules, grammars);
    const map = Array.from(options).map(option => option.grammar.size);
    parser.pointerize(tokens, rules, map);
    const result = analyzer.exec(tokens, seq);
    console.log(result);
}

main();
