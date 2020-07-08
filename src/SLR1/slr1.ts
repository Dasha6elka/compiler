import _ from "lodash";
import { END } from "../common/constants";
import { Grammar, Literal } from "../common/common";

const State = {
    OK: "OK",
    S: "S",
    R: "R",
};

interface Row {
    value: Cell[];
    row: CellValue;
}

interface Cell {
    value: any;
    column: string;
}

interface CellValue {
    value: string;
    grammarIndex: number;
    positionIndex: number;
}

interface Act {
    value: string;
    index: number;
}

export namespace slr1 {
    export function exec2(grammars: Grammar[]): void {
        const nonTerminals: Literal[] = _.uniq(_.map(grammars, "nonTerminal"));

        const grammarIndex = 0;
        const positionIndex = 0;

        const grammar = grammars[grammarIndex];

        const first: CellValue = {
            value: grammar.rightPart[positionIndex],
            grammarIndex,
            positionIndex,
        };

        const stack: CellValue[] = [];

        const cells: Cell[] = [];
        const rows: Row[] = [];

        const isNonTerminal = nonTerminals.includes(first.value);
        if (isNonTerminal) {
            rows.push(fillRowNonTerminal(nonTerminals, first, grammars, stack, grammar, first, grammarIndex, cells));
        } else {
            rows.push(fillRowTerminal(nonTerminals, first, grammars, stack, grammar, first, grammarIndex, cells));
        }
    }

    function fillRowNonTerminal(
        nonTerminals: string[],
        first: CellValue,
        grammars: Grammar[],
        stack: CellValue[],
        firstGrammar: Grammar,
        startToken: CellValue,
        grammarIndex: number,
        cells: Cell[],
    ): Row {
        let isLastElement = firstGrammar.rightPart[firstGrammar.rightPart.length - 1] === first.value ? true : false;

        return fn(nonTerminals, first, grammars, stack, isLastElement, firstGrammar, startToken, grammarIndex, cells);
    }

    function fillRowTerminal(
        nonTerminals: string[],
        first: CellValue,
        grammars: Grammar[],
        stack: CellValue[],
        firstGrammar: Grammar,
        startToken: CellValue,
        grammarIndex: number,
        cells: Cell[],
    ) {
        let isLastElement = firstGrammar.rightPart[firstGrammar.rightPart.length - 1] === first.value ? true : false;

        return fnTerminal(
            nonTerminals,
            first,
            grammars,
            stack,
            isLastElement,
            firstGrammar,
            startToken,
            grammarIndex,
            cells,
        );
    }

    function fn(
        nonTerminals: string[],
        first: CellValue,
        grammars: Grammar[],
        stack: CellValue[],
        isLastElement: boolean,
        firstGrammar: Grammar,
        startToken: CellValue,
        grammarIndex: number,
        cells: Cell[],
    ) {
        if (isLastElement) {
            const column = END;
            const cell: Act = {
                value: State.R,
                index: grammarIndex,
            };
            cells.push({
                value: cell,
                column,
            });
        }

        rec(grammars, first, nonTerminals, stack, startToken, grammarIndex, cells);

        const grammarsFirst = getFirstGrammars(grammars, first.value);

        grammarsFirst.forEach(grammar => {
            if (grammar?.rightPart[0] === first.value) {
                let positionIndex = 1;
                const nextToken = grammar?.rightPart[positionIndex];

                let index = 0;
                grammars.forEach((gram, ind) => {
                    if (grammar === gram) {
                        index = ind;
                    }
                });

                nextTokenCheck(
                    nextToken,
                    stack,
                    nonTerminals,
                    grammars,
                    firstGrammar,
                    startToken,
                    grammarIndex,
                    positionIndex,
                    index,
                    cells,
                );
            }
        });

        const row: Row = {
            value: cells,
            row: startToken,
        };

        return row;
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

    function nextTokenCheck(
        token: string,
        stack: CellValue[],
        nonTerminals: string[],
        grammars: Grammar[],
        firstGrammar: Grammar,
        startToken: CellValue,
        grammarIndex: number,
        positionIndex: number,
        index: number,
        cells: Cell[],
    ) {
        const column = token;
        const cell: CellValue = {
            value: token,
            grammarIndex: index,
            positionIndex,
        };
        cells.push({
            value: cell,
            column,
        });

        stack.push(cell);

        const next: CellValue = {
            value: token,
            grammarIndex: index,
            positionIndex,
        };

        fillRowNonTerminal(nonTerminals, next, grammars, stack, firstGrammar, startToken, grammarIndex, cells);
    }

    function rec(
        grammars: Grammar[],
        first: CellValue,
        nonTerminals: string[],
        stack: CellValue[],
        startToken: CellValue,
        grammarIndex: number,
        cells: Cell[],
    ) {
        const nonTerminalFirst = firstTokenGrammar(grammars, first.value);
        if (nonTerminalFirst !== undefined) {
            const token = _.find(grammars, grammar => _.first(grammar.rightPart) === nonTerminalFirst);

            const nonTerminal = token?.nonTerminal!;

            grammars.forEach((grammar, ind) => {
                grammar.rightPart.forEach((token, positionIndex, array) => {
                    const isLast = token === array[array.length - 1] ? true : false;

                    if (!isLast && token === nonTerminal) {
                        const next: CellValue = {
                            value: nonTerminal,
                            grammarIndex: ind,
                            positionIndex,
                        };
                        rec(grammars, next, nonTerminals, stack, startToken, grammarIndex, cells);
                    }
                });
            });
        } else {
            const nonTerminalStart = firstTokenGrammar(grammars, startToken.value);
            if (nonTerminalStart !== undefined) {
                let column = "";

                const grammarsFirst = getFirstGrammars(grammars, first.value);

                grammarsFirst.forEach(gramm => {
                    if (gramm === grammars[first.grammarIndex]) {
                        const token = gramm?.rightPart[0]!;
                        if (token !== startToken.value) {
                            if (token !== first.value) {
                                column = token;
                            } else {
                                column = gramm?.rightPart[1]!;
                            }

                            const cell: Act = {
                                value: State.R,
                                index: grammarIndex,
                            };
                            cells.push({
                                value: cell,
                                column,
                            });
                        }
                    }
                });
            }
        }
    }

    function firstTokenGrammar(grammars: Grammar[], startToken: string): string | undefined {
        return _.find(grammars, grammar => grammar.rightPart[0] === startToken && grammar.rightPart.length === 1)
            ?.nonTerminal;
    }

    function fnTerminal(
        nonTerminals: string[],
        first: CellValue,
        grammars: Grammar[],
        stack: CellValue[],
        isLastElement: boolean,
        firstGrammar: Grammar,
        startToken: CellValue,
        grammarIndex: number,
        cells: Cell[],
    ) {
        if (isLastElement) {
            const column = END;

            const cell: Act = {
                value: State.R,
                index: grammarIndex,
            };
            cells.push({
                value: cell,
                column,
            });
        }

        rec(grammars, first, nonTerminals, stack, startToken, grammarIndex, cells);

        let next = "";
        grammars.forEach((grammar, ind) => {
            grammar.rightPart.forEach((element, index, array) => {
                const positionIndex = index + 1;
                const token = array[positionIndex];
                if (element === first.value && token !== undefined) {
                    next = token;
                    push(next, ind, positionIndex, stack, cells);
                }
            });
        });
        if (nonTerminals.includes(next)) {
            recDeepTerminal(grammars, next, nonTerminals, stack, startToken, firstGrammar, cells);
        }

        const row: Row = {
            value: cells,
            row: startToken,
        };

        return row;
    }

    function recDeepTerminal(
        grammars: Grammar[],
        first: string,
        nonTerminals: string[],
        stack: CellValue[],
        startToken: CellValue,
        firstGrammar: Grammar,
        cells: Cell[],
    ) {
        const grammarsFirst = getFirstGrammars(grammars, first);

        grammars.forEach((gram, grammarIndex) => {
            if (grammarsFirst.includes(gram)) {
                grammarsFirst.forEach(grammar => {
                    if (gram === grammar) {
                        const positionIndex = 0;
                        const firstEl = grammar.rightPart[positionIndex];
                        if (first === firstEl) {
                            push(firstEl, grammarIndex, positionIndex, stack, cells);
                        } else if (nonTerminals.includes(firstEl)) {
                            push(firstEl, grammarIndex, positionIndex, stack, cells);
                            recDeepTerminal(grammars, firstEl, nonTerminals, stack, startToken, firstGrammar, cells);
                        } else {
                            push(firstEl, grammarIndex, positionIndex, stack, cells);
                        }
                    }
                });
            }
        });
    }

    function push(element: string, grammarIndex: number, positionIndex: number, stack: CellValue[], cells: Cell[]) {
        const cell: CellValue = {
            value: element,
            grammarIndex,
            positionIndex,
        };

        cells.push({
            value: cell,
            column: element,
        });

        stack.push(cell);
    }
}
