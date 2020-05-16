import { LiteralOptions, LiteralTable } from "./common";
import { EMPTY, END } from "./constants";

export namespace set {
    export function exec(table: LiteralTable, options: LiteralOptions): LiteralOptions {
        options.forEach(option => {
            const literals = table.get(option.rule);
            const firstGrammarLiteral = Array.from(option.grammar.values())[0];
            if (literals?.has(firstGrammarLiteral)) {
                option.first.add(firstGrammarLiteral);
            }
            if (firstGrammarLiteral === EMPTY) {
                option.first.add(END);
                for (const [key, values] of table) {
                    if (option.rule === key) {
                        values.forEach(value => option.first.add(value));
                    }
                }
            }
        });

        return options;
    }
}
