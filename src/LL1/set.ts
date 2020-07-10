import { LiteralOptions, LiteralTable, LiteralSet } from "../common/common";
import { EMPTY, END } from "../common/constants";
import { factory } from "../common/factory";
import { tokenize } from "../common/parser";

export namespace set {
    export function exec(table: LiteralTable, options: LiteralOptions, input: string): void {
        const { terminals, nonTerminals } = tokenize(input);

        options.forEach(option => {
            const literals = table.get(option.rule);

            let firstGrammarLiteral = Array.from(option.grammar.values())[0];
            if (literals?.has(firstGrammarLiteral)) {
                const list: string[] = [];
                while (nonTerminals.has(firstGrammarLiteral)) {
                    const literals = table.get(firstGrammarLiteral);
                    literals?.forEach(literal => {
                        if (terminals.has(literal)) {
                            list.push(literal);
                        }
                        firstGrammarLiteral = literal;
                    });
                }

                if (terminals.has(firstGrammarLiteral)) {
                    list.push(firstGrammarLiteral);
                }

                list.forEach(item => {
                    option.first.add(item);
                });
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
                rec(nonTerminals, value, table, values);
            }
        }

        for (const [key, values] of table) {
            const onlyTerminals = Array.from(values).filter(value => terminals.has(value) || value === END);
            table.set(key, factory.createLiteralSet(onlyTerminals));
        }
    }

    function rec(nonTerminals: LiteralSet, value: string, table: LiteralTable, values: LiteralSet) {
        if (nonTerminals.has(value)) {
            const literals = table.get(value);
            literals?.forEach(literal => {
                rec(nonTerminals, literal, table, values);
            });
        } else {
            values.add(value);
        }
    }
}
