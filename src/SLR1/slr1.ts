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
    row: CellValue | string;
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
    export function exec2(grammars: Grammar[]): Row[] {
        const nonTerminals: Literal[] = _.uniq(_.map(grammars, "nonTerminal"));

        const rows: Row[] = [];

        rows.push(getFirstRow(grammars));

        const stack: CellValue[] = [];
        let tempStack: CellValue[] = [];

        let grammarIndex = 0;
        const positionIndex = 0;

        let grammar = grammars[grammarIndex];

        const first: CellValue = {
            value: grammar.rightPart[positionIndex],
            grammarIndex,
            positionIndex,
        };

        stack.push(first);
        tempStack.push(first);

        while (stack.length > 0) {
            let res: any;
            const cells: Cell[] = [];

            const firstValue = stack.pop()!;

            grammarIndex = firstValue.grammarIndex;
            grammar = grammars[grammarIndex];

            const isNonTerminal = nonTerminals.includes(firstValue.value);
            if (isNonTerminal) {
                res = fillRowNonTerminal(
                    nonTerminals,
                    firstValue,
                    grammars,
                    stack,
                    grammar,
                    firstValue,
                    grammarIndex,
                    cells,
                    tempStack,
                );
            } else {
                res = fillRowTerminal(
                    nonTerminals,
                    firstValue,
                    grammars,
                    stack,
                    grammar,
                    firstValue,
                    grammarIndex,
                    cells,
                    tempStack,
                );
            }

            rows.push(res.row);

            tempStack.push(...res.stack);
            tempStack = _.uniqWith(tempStack, _.isEqual);
        }

        let tokens: any[] = [];

        rows.forEach((row: Row) => {
            tokens.push(row.row);
        });

        rows.forEach((row: Row) => {
            row.value.forEach((val: any) => {
                tokens.forEach((token: any, index: number) => {
                    const equal = _.isEqual(val.value, token);
                    if (equal) {
                        const act: Act = {
                            value: State.S,
                            index: index
                        }
                        val.value = act;
                    }
                });
            });
        });

        return rows;
    }

    function isSame(tempStack: CellValue[], row: CellValue) {
        let flag = false;
        tempStack.forEach(temp => {
            if (_.isEqual(temp, row)) {
                flag = true;
            }
        });

        return flag;
    }

    function getFirstRow(grammars: Grammar[]): Row {
        const cells: Cell[] = [];
        const row = grammars[0].nonTerminal;

        cells.push({
            value: State.OK,
            column: row,
        });

        const value = grammars[0].rightPart[0];
        const cell: CellValue = {
            value: value,
            grammarIndex: 0,
            positionIndex: 0,
        };

        cells.push({
            value: cell,
            column: value,
        });

        return {
            value: cells,
            row,
        };
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
        tempStack: CellValue[],
    ) {
        let isLastElement = firstGrammar.rightPart[firstGrammar.rightPart.length - 1] === first.value ? true : false;

        return fn(
            nonTerminals,
            first,
            grammars,
            stack,
            isLastElement,
            firstGrammar,
            startToken,
            grammarIndex,
            cells,
            tempStack,
        );
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
        tempStack: CellValue[],
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
            tempStack,
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
        tempStack: CellValue[],
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
                    tempStack,
                );
            }
        });

        const row: Row = {
            value: cells,
            row: startToken,
        };

        return {
            row,
            stack,
        };
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
        tempStack: CellValue[],
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

        if (!isSame(tempStack, cell)) {
            stack.push(cell);
        }

        const next: CellValue = {
            value: token,
            grammarIndex: index,
            positionIndex,
        };

        fillRowNonTerminal(
            nonTerminals,
            next,
            grammars,
            stack,
            firstGrammar,
            startToken,
            grammarIndex,
            cells,
            tempStack,
        );
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
        tempStack: CellValue[],
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
                    push(next, ind, positionIndex, stack, cells, tempStack);
                }
            });
        });
        if (nonTerminals.includes(next)) {
            recDeepTerminal(grammars, next, nonTerminals, stack, startToken, firstGrammar, cells, tempStack);
        }

        const row: Row = {
            value: cells,
            row: startToken,
        };

        return {
            row,
            stack,
        };
    }

    function recDeepTerminal(
        grammars: Grammar[],
        first: string,
        nonTerminals: string[],
        stack: CellValue[],
        startToken: CellValue,
        firstGrammar: Grammar,
        cells: Cell[],
        tempStack: CellValue[],
    ) {
        const grammarsFirst = getFirstGrammars(grammars, first);

        grammars.forEach((gram, grammarIndex) => {
            if (grammarsFirst.includes(gram)) {
                grammarsFirst.forEach(grammar => {
                    if (gram === grammar) {
                        const positionIndex = 0;
                        const firstEl = grammar.rightPart[positionIndex];
                        if (first === firstEl) {
                            return;
                        } else if (nonTerminals.includes(firstEl)) {
                            push(firstEl, grammarIndex, positionIndex, stack, cells, tempStack);
                            recDeepTerminal(
                                grammars,
                                firstEl,
                                nonTerminals,
                                stack,
                                startToken,
                                firstGrammar,
                                cells,
                                tempStack,
                            );
                        } else {
                            push(firstEl, grammarIndex, positionIndex, stack, cells, tempStack);
                        }
                    }
                });
            }
        });
    }

    function push(
        element: string,
        grammarIndex: number,
        positionIndex: number,
        stack: CellValue[],
        cells: Cell[],
        tempStack: CellValue[],
    ) {
        const cell: CellValue = {
            value: element,
            grammarIndex,
            positionIndex,
        };

        cells.push({
            value: cell,
            column: element,
        });

        if (!isSame(tempStack, cell)) {
            stack.push(cell);
        }
    }
}
