import { Grammar, Grammars, LiteralSet } from "../common/common";
import { utils } from "../common/utils";
import { tokenize } from "../common/parser";
import { EMPTY } from "../common/constants";

export namespace parser {
    const STACK_REG_EXP = new RegExp("<(?:(?!<|>).)+>|(?!->)([^<> ]+)", "gi");

    export function exec(input: string): Grammars {
        let grammars: Grammars = getRightPart(input);
        getElements(grammars, input);

        return grammars;
    }

    function getRightPart(input: string): Grammars {
        const grammars: Grammars = [];
        const lines = utils.Input.normalize(input);

        lines.forEach(line => {
            const stack = (line.match(STACK_REG_EXP) ?? []).map(utils.NonTerminal.normalize);
            const nonTerminal = stack[0];
            stack.shift();
            grammars.push({
                nonTerminal,
                rightPart: stack,
                elements: [],
            });
        });

        return grammars;
    }

    function getElements(grammars: Grammars, input: string): void {
        const { terminals, nonTerminals } = tokenize(input);

        grammars.forEach(grammar => {
            if (grammar.rightPart.includes(EMPTY)) {
                grammars.forEach(gramm => {
                    gramm.rightPart.forEach((value, index, array) => {
                        const isLast = index === array.length - 1;
                        const isFirst = index === 0;
                        if (
                            value === grammar.nonTerminal &&
                            !isLast &&
                            isFirst &&
                            grammar.elements.includes(array[index + 1])
                        ) {
                            grammar.elements.push(array[index + 1]);
                        }
                    });
                });
            }
        });

        grammars.forEach(grammar => {
            const first = grammar.rightPart[0];
            let next = "";
            if (grammar.rightPart[1] !== undefined) {
                next = grammar.rightPart[1];
            }
            rec(terminals, first, grammar, nonTerminals, grammars, next);
        });

        grammars.forEach(grammar => {
            if (grammar.rightPart.includes(EMPTY)) {
                grammars.forEach(gramm => {
                    gramm.elements.forEach(element => {
                        if (element === grammar.nonTerminal) {
                            grammar.elements.forEach(el => {
                                if (!gramm.elements.includes(el)) {
                                    gramm.elements.push(el);
                                }
                            });
                        }
                    });
                });
            }
        });

        grammars.forEach(grammar => {
            if (grammar.rightPart.includes(EMPTY)) {
                grammars.forEach(gramm => {
                    gramm.rightPart.forEach((value, index, array) => {
                        const isLast = index === array.length - 1;
                        if (value === grammar.nonTerminal && !isLast && !grammar.elements.includes(array[index + 1])) {
                            grammar.elements.push(array[index + 1]);
                        }
                    });
                });
            }
        });
    }

    function rec(
        terminals: LiteralSet,
        first: string,
        grammar: Grammar,
        nonTerminals: LiteralSet,
        grammars: Grammars,
        next: string,
    ) {
        if (terminals.has(first) && first !== EMPTY) {
            if (!grammar.elements.includes(first)) {
                grammar.elements.push(first);
            }
        }
        if (nonTerminals.has(first)) {
            const firstGrammars = getFirstGrammars(grammars, first);

            firstGrammars.forEach(gramm => {
                if (gramm.rightPart[0] !== first) {
                    rec(terminals, gramm.rightPart[0], grammar, nonTerminals, grammars, next);
                }
                if (!grammar.elements.includes(first)) {
                    grammar.elements.push(first);
                }
            });
        }
        if (first === EMPTY && !grammar.elements.includes(next) && next !== "") {
            grammar.elements.push(next);
        }
    }

    function getFirstGrammars(grammars: Grammar[], first: string): Grammar[] {
        const grammarsFirst: Grammar[] = [];
        grammars.forEach(grammar => {
            if (grammar.nonTerminal === first) {
                grammarsFirst.push(grammar);
            }
        });

        return grammarsFirst;
    }
}
