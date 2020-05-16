import { parser } from "./parser";
import { set } from "./set";
import { generator } from "./generator";
import { analyzer } from "./analyzer";

const args = [
    `
<S>->a<A>
<S>->b
<A>->c<A><S>
<A>->e
`,
    "a,c,c,a,c,b",
];

function main() {
    const input = args[0].trim();
    const seq = args[1].split(",")[Symbol.iterator]();
    const options = parser.optionize(input);
    const table = parser.parse(input);
    set.exec(table, options);
    const rules = parser.rules(input);
    const grammars = parser.grammars(input, table);
    const tokens = generator.exec(rules, grammars);
    const map = Array.from(options).map(option => option.grammar.size);
    parser.pointerize(tokens, rules, map);
    const result = analyzer.exec(tokens, seq);
    console.log(result);
}

main();
