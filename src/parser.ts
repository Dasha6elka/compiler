import { LiteralSet, Literal } from "./common";
import { utils } from "./utils";

export namespace parser {
    interface TokenizeResult {
        terminals: LiteralSet;
        nonTerminals: LiteralSet;
    }

    export function tokenize(input: string): TokenizeResult {
        const terminalsRegExp = new RegExp("(?<=->).*", "gim");
        const nonTerminalsRegExp = new RegExp("<.+>(?=->)", "gim");

        const nonTerminalsMatch = input.match(nonTerminalsRegExp) ?? [];
        const nonTerminals = nonTerminalsMatch.map(terminal => terminal.replace(/<|>/g, ""));

        const terminalsMatch = input.match(terminalsRegExp) ?? [];
        const nonTerminalsToExclude = new RegExp(nonTerminalsMatch.join("|"), "gim");
        const terminals = terminalsMatch
            .map(grammar => grammar.replace(nonTerminalsToExclude, ""))
            .reduce(flatten, [] as string[]);

        const nonTerminalSymbols = uniq(nonTerminals).map(toLiteral);
        const terminalSymbols = uniq(terminals).map(toLiteral);

        return {
            terminals: utils.LiteralSetFactory.create(terminalSymbols),
            nonTerminals: utils.LiteralSetFactory.create(nonTerminalSymbols),
        };
    }

    function flatten(acc: string[], value: string): string[] {
        return value.length > 1 ? [...acc, ...value.split("")] : [...acc, value];
    }

    function toLiteral(value: string): Literal {
        return Symbol(value);
    }

    function uniq<T>(array: T[]): T[] {
        return Array.from(new Set(array));
    }
}
