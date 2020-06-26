import { LiteralOptions, LiteralTable } from "../common/common";
import { EMPTY, END } from "../common/constants";
import { parser } from "./parser";
import { factory } from "../common/factory";

export namespace set {
    export function exec(table: LiteralTable, options: LiteralOptions, input: string): void {
        const { terminals, nonTerminals } = parser.tokenize(input);

        options.forEach(option => {
            const literals = table.get(option.rule);
            let firstGrammarLiteral = Array.from(option.grammar.values())[0];
            if (literals?.has(firstGrammarLiteral)) {
                if (nonTerminals.has(firstGrammarLiteral)) {
                    const literals = table.get(firstGrammarLiteral);
                    literals?.forEach(literal => (firstGrammarLiteral = literal));
                }

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

        for (const pair of table) {
            const [, values] = pair;
            for (const value of values) {
                if (nonTerminals.has(value)) {
                    const literals = table.get(value);
                    literals?.forEach(literal => values.add(literal));
                }
            }
        }

        for (const [key, values] of table) {
            const onlyTerminals = Array.from(values).filter(value => terminals.has(value) || value === END);
            table.set(key, factory.createLiteralSet(onlyTerminals));
        }
    }
}
