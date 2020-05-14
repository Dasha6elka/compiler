import { Literal, LiteralSet, LiteralOptions } from "./common";
import { EMPTY, END } from "./constants";
import { utils } from "./utils";

export namespace set {
    export function exec(
        table: Map<Literal, LiteralSet>,
        terminals: LiteralSet,
        nonTerminals: LiteralSet,
        literalOptions: LiteralOptions,
    ): LiteralOptions {
        for (const pair of table) {
            const [, values] = pair;
            for (const value of values) {
                if (terminals.has(value)) {
                    const literals = table.get(value);
                    literals?.forEach(literal => values.add(literal));
                }
            }
        }

        for (const [key, values] of table) {
            const onlyNonTerminals = Array.from(values).filter(value => nonTerminals.has(value));
            table.set(key, utils.LiteralSetFactory.create(onlyNonTerminals));
        }

        literalOptions.forEach(option => {
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

        return literalOptions;
    }
}
