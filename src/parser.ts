import { LiteralSet, TokenTable, LiteralTable, LiteralOptions, RuleValue, GrammarValue, SymbolType } from "./common";
import { utils } from "./utils";
import { EMPTY, END, ARR_EN } from "./constants";
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

    export function factorization(input: string): string {
        const lines = utils.Input.normalize(input);

        const matches = new Map<string, Set<string[]>>();
        const matchesKey: string[] = [];
        const matchesReversed = new Map<string, Set<string[]>>();
        const matchesKeyReversed: string[] = [];
        const simples = new Set<string[]>();
        const simplesKey: string[] = [];
        const matchesList = new Set<string[]>();

        lines.forEach((line, index, array) => {
            const stack = utils.Input.stack(line);
            const stackReversed = utils.Input.stack(line).reverse();
            const key = utils.Input.key(line);

            array.slice(index + 1).forEach(subLine => {
                const subStack = utils.Input.stack(subLine);
                const subStackReversed = utils.Input.stack(subLine).reverse();

                fillMatches(subStack, stack, matches, matchesKey, key, matchesList, false);
                fillMatches(
                    subStackReversed,
                    stackReversed,
                    matchesReversed,
                    matchesKeyReversed,
                    key,
                    matchesList,
                    true,
                );
            });

            const isSimple = simple(matchesList, stack);

            if (isSimple) {
                simples.add(stack);
                simplesKey.push(key);
            }
        });

        let result = "";
        let i = 0;
        let j = 0;

        result = addInResultMatches(matches, matchesKey, false, result, i, j).result;
        i = addInResultMatches(matches, matchesKey, false, result, i, j).i;
        j = addInResultMatches(matches, matchesKey, false, result, i, j).j;

        result = addInResultMatches(matchesReversed, matchesKeyReversed, true, result, i, j).result;

        result = addInResultSimples(simples, simplesKey, result);

        return result;
    }

    export function optionize(input: string): LiteralOptions {
        const options: LiteralOptions = factory.createLiteralOptions();
        const lines = utils.Input.normalize(input);

        lines.forEach(line => {
            const stack = (line.match(STACK_REG_EXP) ?? []).map(utils.NonTerminal.normalize);
            const rule = stack[0];
            stack.shift();
            const index = stack.findIndex(value => value === EMPTY);
            stack[index] = END;
            options.add({
                rule,
                grammar: factory.createLiteralSet(stack),
                first: factory.createLiteralSet(),
            });
        });

        return options;
    }

    export function rules(input: string, options: LiteralOptions): RuleValue[] {
        return Array.from(options.values()).map((option, index, array) => {
            const next = array[index + 1];
            const set = option.first;
            return {
                literal: option.rule,
                set,
                last: !(next && next.rule === option.rule),
            };
        });
    }

    export function grammars(input: string, table: LiteralTable): GrammarValue[] {
        const lines = utils.Input.normalize(input);
        const { terminals, nonTerminals } = tokenize(input);

        const isTerminal = (v: string): boolean => terminals.has(v);
        const isNonTerminal = (v: string): boolean => nonTerminals.has(v);
        const isEmpty = (v: string): boolean => v === EMPTY;
        const isEnd = (v: string): boolean => v === END;

        let anEnd: boolean = false;
        lines.every(line => {
            if (line.search(END)) {
                anEnd = true;
            }
        });

        const grammars: GrammarValue[] = [];

        lines.forEach((line, index, array) => {
            const isLastLine = index === array.length - 1;
            const stack = (line.match(STACK_REG_EXP) ?? []).map(utils.NonTerminal.normalize);
            stack.shift();
            stack.forEach((literal, index, array) => {
                const next = array[index + 1];

                const type =
                    isEmpty(literal) || isEnd(literal)
                        ? SymbolType.Empty
                        : isTerminal(literal)
                        ? SymbolType.Terminal
                        : SymbolType.Nonterminal;

                const set =
                    isEmpty(literal) || isEnd(literal)
                        ? factory.createLiteralSet([END])
                        : isTerminal(literal)
                        ? factory.createLiteralSet([literal])
                        : table.get(literal)!; // TODO: unsafe cast

                const end = (isLastLine && !next && !anEnd) || isEnd(literal);

                const last = next && (isTerminal(literal) || isNonTerminal(literal)) ? false : true;

                const grammar = {
                    literal: literal,
                    options: {
                        set,
                        type,
                        last,
                        end,
                    },
                };

                grammars.push(grammar);
            });
        });

        return grammars;
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
                if (transitions) {
                    transitions?.forEach(transition => {
                        const values = cache.get(transition);
                        if (values) {
                            cacheSafePush(nonTerminalMatch, values);
                            tableSafePush(nonTerminalMatch, new Set([...values, END]));
                        }
                    });
                } else {
                    cacheSafePush(nonTerminalMatch, END);
                    tableSafePush(nonTerminalMatch, new Set([END]));
                }
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

    export function pointerize(table: TokenTable, rules: RuleValue[], map: number[]) {
        for (const [key, value] of table) {
            if (key === rules.length) {
                return;
            }
            let offset = rules.length;
            if (key !== 0) {
                const allRowsBefore = Array.from(table.entries()).filter(([index]) => index < key);
                offset = allRowsBefore.reduce((acc, [index]) => acc + map[index], rules.length);
            }
            value.pointer = offset;
        }
    }

    function arrayPush(array: string[], source: Set<string[]>) {
        if (array.length) {
            source.add(array);
        } else {
            source.add([EMPTY]);
        }
    }

    function fillMatches(
        subStack: string[],
        stack: string[],
        matches: Map<string, Set<string[]>>,
        matchesKey: string[],
        key: string,
        matchesList: Set<string[]>,
        isReverse: boolean,
    ): void {
        let same = "";
        let other: Set<string[]> = new Set<string[]>();
        if (stack[0] === subStack[0]) {
            same += `${stack[0]} `;
            let i = 1;
            while (stack[i] === subStack[i]) {
                same += `${stack[i]} `;
                i++;
            }
            const stackSlice = stack.slice(i);
            const subStackSlice = subStack.slice(i);
            arrayPush(stackSlice, other);
            arrayPush(subStackSlice, other);

            if (isReverse) {
                same = same.split(" ").reverse().join(" ");
            }

            if (matches.has(same)) {
                let match = matches.get(same)!;
                match.forEach(m => {
                    other.forEach(o => {
                        if (utils.compare(o, m)) {
                            other.delete(o);
                        }
                    });
                });
                other.forEach(o => match.add(o));
                matches.set(same, match);
            } else {
                matches.set(same, other);
                matchesKey.push(key);
            }

            if (isReverse) {
                stack.reverse();
                subStack.reverse();
            }

            matchesList.add(stack);
            matchesList.add(subStack);
        }
    }

    function addInResultMatches(
        matches: Map<string, Set<string[]>>,
        matchesKey: string[],
        isReverse: boolean,
        result: string,
        i: number,
        j: number,
    ): { result: string; i: number; j: number } {
        const keys = matches.keys();
        let k = 0;
        matches.forEach(match => {
            let string = isReverse
                ? `${matchesKey[k]}-><${ARR_EN[i]}${j}>${keys.next().value}\n`
                : `${matchesKey[k]}->${keys.next().value}<${ARR_EN[i]}${j}>\n`;
            result += string;

            match.forEach(m => {
                string = `<${ARR_EN[i]}${j}>->${m.join(" ")}`.trim();
                result += string + "\n";
            });

            i++;
            k++;
            if (ARR_EN.length - 1 === j) {
                j++;
            }
        });

        return { result, i, j };
    }

    function addInResultSimples(simples: Set<string[]>, simplesKey: string[], result: string): string {
        let k = 0;
        simples.forEach(simple => {
            let str = "";
            simple.forEach(s => {
                str += `${s} `;
            });
            let string = `${simplesKey[k]}->${str}`.trim();
            result += string + "\n";

            k++;
        });

        return result;
    }

    function simple(matchesList: Set<string[]>, stack: string[]): boolean {
        let isSimple = true;
        matchesList.forEach(match => {
            if (utils.compare(match, stack)) {
                isSimple = false;
            }
        });

        return isSimple;
    }
}
