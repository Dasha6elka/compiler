import { LiteralSet, TokenTable, LiteralTable } from "./common";
import { utils } from "./utils";
import { EMPTY, END } from "./constants";
import { factory } from "./factory";

export namespace parser {
    interface TokenizeResult {
        terminals: LiteralSet;
        nonTerminals: LiteralSet;
    }

    interface TerminizeResult {
        terminals: string[];
        nonTerminals: string[];
    }

    type Transitions = Map<string, string[]>;

    // const STACK_REG_EXP = new RegExp("<(?:(?!<|>).)+>|[a-zA-Z0-9]", "gi");
    const STACK_REG_EXP = new RegExp("<(?:(?!<|>).)+>|([^-<> ]+)", "gi");
    const RIGHT_PART_REG_EXP = new RegExp("(?<=->).*", "gim");
    const NON_TERMINALS_REG_EXP = new RegExp("<.+>(?=->)", "gim");

    function terminize(input: string): TerminizeResult {
        const nonTerminalsMatch = input.match(NON_TERMINALS_REG_EXP) ?? [];
        const nonTerminals = nonTerminalsMatch.map(utils.NonTerminal.normalize);

        const rightPartMatch = input.match(RIGHT_PART_REG_EXP) ?? [];
        const nonTerminalsToExclude = new RegExp(nonTerminalsMatch.join("|"), "gim");
        const terminals = rightPartMatch
            .map(grammar => grammar.replace(nonTerminalsToExclude, ""))
            .reduce(utils.flatten, [] as string[]);

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

    export function transitionize(input: string): Transitions {
        const { nonTerminals } = terminize(input);

        const transitions = new Map<string, string[]>();

        const lines = utils.Input.normalize(input);

        lines.forEach(line => {
            let stack = line.match(STACK_REG_EXP) ?? [];
            stack.shift();
            stack = stack.reverse().map(utils.NonTerminal.normalize);

            let curr = stack.pop()!;
            let next: string | null = null;
            while (stack.length) {
                next = stack.pop()!;
                if (nonTerminals.includes(curr) && nonTerminals.includes(next)) {
                    const to = transitions.get(curr);
                    if (to) {
                        transitions.set(curr, [...to, next]);
                    } else {
                        transitions.set(curr, [next]);
                    }
                }
                curr = next;
            }
        });

        return transitions;
    }

    export function parse(input: string): LiteralTable {
        const transitionsMap = transitionize(input);

        const cache = factory.createLiteralTable();
        const cacheSafePush = utils.useSafePush(cache, value => factory.createLiteralSet([value]));
        const table = factory.createLiteralTable();
        const tableSafePush = utils.useSafePush(table, value => factory.createLiteralSet([value]));

        const lines = utils.Input.normalize(input);

        lines.forEach(line => {
            const nonTerminalMatch = utils.NonTerminal.normalize((line.match(NON_TERMINALS_REG_EXP) ?? [])[0]); // TODO: unsafe cast
            let rightPartMatch = (line.match(RIGHT_PART_REG_EXP) ?? [])[0]; // TODO: unsafe cast
            // Recieved non terminal if first symbol is '<'
            if (rightPartMatch[0] === "<") {
                // Skip '<' symbol and take all between '<' and  '>'
                rightPartMatch = utils.NonTerminal.normalize(rightPartMatch.substring(1).split(">")[0]);
                cacheSafePush(nonTerminalMatch, rightPartMatch);
                tableSafePush(nonTerminalMatch, rightPartMatch);
            } else if (rightPartMatch[0] === EMPTY) {
                const transitions = transitionsMap.get(nonTerminalMatch);
                transitions?.forEach(transition => {
                    const values = cache.get(transition);
                    if (values) {
                        const set = new Set([...values, END]);
                        cacheSafePush(nonTerminalMatch, values);
                        tableSafePush(nonTerminalMatch, set);
                    }
                });
            } else {
                cacheSafePush(nonTerminalMatch, rightPartMatch[0]);
                tableSafePush(nonTerminalMatch, rightPartMatch[0]);
            }
        });

        const result: typeof table = new Map();

        for (const [literal] of table) {
            const sameRows = Array.from(table.entries())
                .reverse()
                .filter(([subLiteral]) => literal === subLiteral);

            const allValuesToAdd = sameRows.reduce((acc, [, value]) => {
                const valuesToAdd = Array.from(value.values());
                acc.push(...valuesToAdd);
                return acc;
            }, [] as Array<typeof literal>);

            sameRows.forEach(([key]) => table.delete(key));

            result.set(literal, new Set(allValuesToAdd));
        }

        return result;
    }

    export function pointerize(table: TokenTable, nonTerminalsCount: number, grammarCountsMap: number[]) {
        for (const [key, value] of table) {
            if (key === nonTerminalsCount) {
                return;
            }
            let offset = nonTerminalsCount;
            if (key !== 0) {
                const allRowsBefore = Array.from(table.entries()).filter(([index]) => index < key);
                offset = allRowsBefore.reduce((acc, [index]) => acc + grammarCountsMap[index], nonTerminalsCount);
            }
            value.pointer = offset;
        }
    }
}
