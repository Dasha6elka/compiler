import { parser } from "./parser";
import { set } from "./set";
import { generator } from "./generator";
import { analyzer } from "./analyzer";

const args = [
    `
<S>-><S>+<A>⊥
<S>-><S>*<A>
<S>->5
<A>->(<A>)
<A>->i
`,
    "5,*,i,+,(,i,),⊥",
];

function main() {
    let input = args[0].trim();
    input = parser.leftRecursion(input);
    input = parser.factorization(input);
    const seq = args[1].split(",")[Symbol.iterator]();
    const options = parser.optionize(input);
    const table = parser.parse(input);
    set.exec(table, options, input);
    const rules = parser.rules(options);
    const grammars = parser.grammars(input, table);
    const tokens = generator.exec(rules, grammars);
    const map = Array.from(options).map(option => option.grammar.size);
    parser.pointerize(tokens, rules, map);
    const result = analyzer.exec(tokens, seq);
    console.log(result);
}

main();
