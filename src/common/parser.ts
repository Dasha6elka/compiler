import { LiteralSet } from "./common";
import { utils } from "./utils";
import { factory } from "./factory";

const RIGHT_PART_REG_EXP = new RegExp("(?<=->).*", "gim");
const NON_TERMINALS_REG_EXP = new RegExp("<.+>(?=->)", "gim");

interface TokenizeResult {
    terminals: LiteralSet;
    nonTerminals: LiteralSet;
}

interface TerminizeResult {
    terminals: string[];
    nonTerminals: string[];
}

export function terminize(input: string): TerminizeResult {
    const nonTerminalsMatch = input.match(NON_TERMINALS_REG_EXP) ?? [];
    const nonTerminals = nonTerminalsMatch.map(utils.NonTerminal.normalize);

    const rightPartMatch = input.match(RIGHT_PART_REG_EXP) ?? [];
    const nonTerminalsToExclude = new RegExp(nonTerminalsMatch.join("|"), "gim");
    const terminals: string[] = [];
    rightPartMatch.forEach(grammar => {
        const term: string = grammar.replace(nonTerminalsToExclude, " ").trim();
        if (term === "") {
            return;
        }
        terminals.push(...term.split(" "));
    });

    return {
        terminals: utils.uniq(terminals),
        nonTerminals: utils.uniq(nonTerminals),
    };
}

export function tokenize(input: string): TokenizeResult {
    const { terminals, nonTerminals } = terminize(input);

    return {
        terminals: factory.createLiteralSet(terminals),
        nonTerminals: factory.createLiteralSet(nonTerminals),
    };
}
