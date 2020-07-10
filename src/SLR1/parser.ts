import { Grammar, Grammars, LiteralSet } from "../common/common";
import { utils } from "../common/utils";
import { tokenize } from "../common/parser";
import { EMPTY, END } from "../common/constants";

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

        const emptyArray: string[] = [];

        grammars.forEach(grammar => {
            const first = grammar.rightPart[0];
            rec(terminals, first, grammar, nonTerminals, grammars, emptyArray, "");
        });
    }

    function rec(
        terminals: LiteralSet,
        first: string,
        grammar: Grammar,
        nonTerminals: LiteralSet,
        grammars: Grammars,
        emptyArray: string[],
        isSame: string
    ) {
        if (terminals.has(first)) {
            grammar.elements.push(first);
        }
        if (nonTerminals.has(first) && first !== isSame) {
            if (grammar.nonTerminal === first) {
                isSame = first;
                emptyArray.push(grammar.rightPart[1]);
            }

            if (!grammar.elements.includes(first)) {
                grammar.elements.push(first);
            }

            grammars.forEach(gramm => {
                if (gramm.nonTerminal === first) {
                    rec(terminals, gramm.rightPart[0], grammar, nonTerminals, grammars, emptyArray, isSame);
                }
            });
        }
        if (first === EMPTY) {
            grammar.elements.push(END);
            emptyArray.forEach(el => {
                grammar.elements.push(el);
            });
        }
    }
}
