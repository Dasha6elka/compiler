import _ from "lodash";
import { END, EMPTY } from "../common/constants";
import { Grammar, Literal, Row, CellValue, Cell, Act, State } from "../common/common";
import { Lexer, Token } from "lexer4js";

export namespace generator {
    export function exec(grammars: Grammar[], tokensLexer: Token[]): Row[] {
        const nonTerminals: Literal[] = _.uniq(_.map(grammars, "nonTerminal"));

        const rows: Row[] = [];

        const stack: Cell[] = [];
        let tempStack: Cell[] = [];

        rows.push(getFirstRow(grammars, nonTerminals, stack, tempStack));

        while (stack.length > 0) {
            let res: any;
            const cells: Cell[] = [];

            const firstValue = stack.pop()!;

            const grammarIndex = firstValue.value.grammarIndex;
            const grammar = grammars[grammarIndex];

            res = fillRow(
                nonTerminals,
                firstValue.value,
                grammars,
                stack,
                grammar,
                firstValue.value,
                grammarIndex,
                cells,
                tempStack,
            );

            rows.push(res.row);

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
                            index: index,
                        };
                        val.value = act;
                    }
                });
            });
        });

        rows.forEach((row: Row) => {
            row.value.forEach((val: any) => {
                if (val.column === END) {
                    val.column = "END";
                } else if (!nonTerminals.includes(val.column)) {
                    const lexer = new Lexer();
                    const tokensInput = lexer.tokenize(val.column);

                    tokensLexer.forEach(token => {
                        if (val.column === token.literal) {
                            val.column = token.type;
                        } else if (tokensInput[0].type === token.type) {
                            val.column = token.type;
                        }
                    });
                }
            });

            if (typeof row.row !== "string") {
                if (isCellValue(row.row) && !nonTerminals.includes(row.row.value)) {
                    const lexer = new Lexer();
                    const tokensInput = lexer.tokenize(row.row.value);

                    tokensLexer.forEach(token => {
                        if (isCellValue(row.row) && row.row.value === token.literal) {
                            row.row.value = token.type;
                        } else if (isCellValue(row.row) && tokensInput[0].type === token.type) {
                            row.row.value = token.type;
                        }
                    });
                }
            }
        });

        return rows;
    }

    function isSameCellValue(tempStack: Cell[], row: CellValue): boolean {
        let result = false;
        tempStack.forEach(temp => {
            if (_.isEqual(temp, row)) {
                result = true;
            }
        });

        return result;
    }

    function isAct(object: any): object is Act {
        return "index" in object;
    }

    function isCellValue(object: any): object is CellValue {
        return "grammarIndex" in object;
    }

    function isSameCell(cells: Cell[], cell: Cell): boolean {
        let result = false;
        cells.forEach(c => {
            if (c.value === "OK") {
                return;
            }
            if (
                isAct(c.value) &&
                isAct(cell.value) &&
                c.column === cell.column &&
                c.value.value === cell.value.value &&
                c.value.index === cell.value.index
            ) {
                result = true;
            } else if (
                isCellValue(c.value) &&
                isCellValue(cell.value) &&
                c.value.value === cell.value.value &&
                c.value.grammarIndex === cell.value.grammarIndex &&
                c.value.positionIndex === cell.value.positionIndex
            ) {
                result = true;
            }
        });

        return result;
    }

    function getFirstRow(grammars: Grammar[], nonTerminals: Literal[], stack: Cell[], tempStack: Cell[]): Row {
        const cells: Cell[] = [];
        const row = grammars[0].nonTerminal;

        cells.push({
            value: State.OK,
            column: row,
        });

        let value = grammars[0].rightPart[0];

        const token = {
            value,
            grammarIndex: 0,
            positionIndex: 0,
        };

        if (grammars[0].rightPart.length === 1) {
            grammars.forEach((grammar, grammIndex) => {
                if (grammar.nonTerminal === grammars[0].rightPart[0] && grammar.rightPart[0] === EMPTY) {
                    pushStateR(END, grammIndex, cells);
                }
            });
        }

        pushToken(value, 0, 0, stack, cells, tempStack);
        getTokens(grammars, value, nonTerminals, stack, token, grammars[0], cells, tempStack);

        return {
            value: cells,
            row,
        };
    }

    function fillRow(
        nonTerminals: string[],
        first: CellValue,
        grammars: Grammar[],
        stack: Cell[],
        firstGrammar: Grammar,
        startToken: CellValue,
        grammarIndex: number,
        cells: Cell[],
        tempStack: Cell[],
    ) {
        // находим следующий элемент и добавляем его
        let next = "";
        grammars.forEach((grammar, ind) => {
            grammar.rightPart.forEach((element, index, array) => {
                const positionIndex = index + 1;
                const token = array[positionIndex];
                if (
                    element === first.value &&
                    index === first.positionIndex &&
                    ind === first.grammarIndex &&
                    token !== undefined
                ) {
                    next = token;
                    pushToken(next, ind, positionIndex, stack, cells, tempStack);
                }
            });
        });
        // если следующий элемент Нетерминал
        if (nonTerminals.includes(next)) {
            getTokens(grammars, next, nonTerminals, stack, startToken, firstGrammar, cells, tempStack);
        }

        // ищем first в правой части и добавляем следующий за ним
        grammars.forEach((grammar, grammIndex) => {
            if (
                grammar.nonTerminal === first.value &&
                grammar.rightPart[0] === first.value &&
                grammar.rightPart[1] !== undefined
            ) {
                pushToken(grammar.rightPart[1], grammIndex, 1, stack, cells, tempStack);
            }
        });

        // если это последний элемент в правиле
        const isLastElement =
            firstGrammar.rightPart[firstGrammar.rightPart.length - 1] === first.value &&
            firstGrammar.rightPart.length - 1 === first.positionIndex
                ? true
                : false;
        if (isLastElement) {
            // если это последний элемент в грамматике
            const lastElement = grammars[0].rightPart[grammars[0].rightPart.length - 1];
            const isLast =
                lastElement === first.value && grammars[0].rightPart.length - 1 === first.positionIndex ? true : false;

            let isLastEl = false;
            let flag = false;

            const lastEl = grammars[0].rightPart[grammars[0].rightPart.length - 1];
            flag = getLastElement(grammars, lastEl, nonTerminals, first, isLastEl);

            if (isLast || flag) {
                const column = END;
                pushStateR(column, grammarIndex, cells);
            }

            // если это последний элемент в правиле
            const nonTerminalsArray: string[] = [];
            recForLastElement(
                firstGrammar,
                grammars,
                grammarIndex,
                cells,
                nonTerminals,
                stack,
                startToken,
                tempStack,
                nonTerminalsArray,
            );
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

    function getTokens(
        grammars: Grammar[],
        first: string,
        nonTerminals: string[],
        stack: Cell[],
        startToken: CellValue,
        firstGrammar: Grammar,
        cells: Cell[],
        tempStack: Cell[],
    ) {
        grammars.forEach((grammar, grammIndex) => {
            if (first === grammar.nonTerminal) {
                const positionIndex = 0;
                const firstEl = grammar.rightPart[positionIndex];
                if (first === firstEl) {
                    grammars.forEach((gramm, index) => {
                        if (gramm.nonTerminal === firstEl && gramm.rightPart[0] === EMPTY) {
                            pushStateR(grammar.rightPart[positionIndex + 1], index, cells);
                        }
                    });
                    return;
                } else if (firstEl === EMPTY) {
                    firstGrammar.rightPart.forEach((cell, index, array) => {
                        if (cell === first && startToken.value === array[index - 1]) {
                            const next = array[index + 1];
                            if (next !== undefined) {
                                pushStateR(next, grammIndex, cells);
                            }
                        }
                    });
                    return;
                } else if (nonTerminals.includes(firstEl)) {
                    pushToken(firstEl, grammIndex, positionIndex, stack, cells, tempStack);
                    getTokens(grammars, firstEl, nonTerminals, stack, startToken, firstGrammar, cells, tempStack);
                } else {
                    pushToken(firstEl, grammIndex, positionIndex, stack, cells, tempStack);
                }
            }
        });
    }

    function getRTokens(
        grammars: Grammar[],
        first: string,
        nonTerminals: string[],
        stack: Cell[],
        startToken: CellValue,
        firstGrammar: Grammar,
        cells: Cell[],
        tempStack: Cell[],
        grammarIndex: number,
    ) {
        grammars.forEach(grammar => {
            if (first === grammar.nonTerminal) {
                const positionIndex = 0;
                const firstEl = grammar.rightPart[positionIndex];
                if (first === firstEl) {
                    grammars.forEach(gramm => {
                        if (gramm.nonTerminal === firstEl && gramm.rightPart[0] === EMPTY) {
                            pushStateR(grammar.rightPart[positionIndex + 1], grammarIndex, cells);
                        }
                    });
                    return;
                } else if (firstEl === EMPTY) {
                    return;
                } else if (nonTerminals.includes(firstEl)) {
                    pushStateR(firstEl, grammarIndex, cells);
                    getRTokens(
                        grammars,
                        firstEl,
                        nonTerminals,
                        stack,
                        startToken,
                        firstGrammar,
                        cells,
                        tempStack,
                        grammarIndex,
                    );
                } else {
                    pushStateR(firstEl, grammarIndex, cells);
                }
            }
        });
    }

    function pushToken(
        column: string,
        grammarIndex: number,
        positionIndex: number,
        stack: Cell[],
        cells: Cell[],
        tempStack: Cell[],
    ) {
        const cell: any = {
            value: {
                value: column,
                grammarIndex,
                positionIndex,
            },
            column,
        };

        if (!isSameCell(cells, cell)) {
            cells.push(cell);
        }

        if (!isSameCellValue(tempStack, cell)) {
            stack.push(cell);
            tempStack.push(cell);
        }
    }

    function pushStateR(column: string, grammIndex: number, cells: Cell[]) {
        const cell = {
            value: {
                value: State.R,
                index: grammIndex,
            },
            column,
        };

        if (!isSameCell(cells, cell)) {
            cells.push(cell);
        }
    }

    function getLastElement(
        grammars: Grammar[],
        lastElement: string,
        nonTerminals: string[],
        first: CellValue,
        isLastEl: boolean,
    ): boolean {
        grammars.forEach((grammar, index) => {
            if (grammar.nonTerminal === lastElement) {
                const last = grammar.rightPart[grammar.rightPart.length - 1];
                if (
                    first.value === last &&
                    first.positionIndex === grammar.rightPart.length - 1 &&
                    first.grammarIndex === index
                ) {
                    isLastEl = true;
                    return isLastEl;
                }
                if (nonTerminals.includes(last) && last !== grammar.nonTerminal) {
                    isLastEl = getLastElement(grammars, last, nonTerminals, first, isLastEl);
                    return isLastEl;
                }
            }
        });

        return isLastEl;
    }

    function recForLastElement(
        firstGrammar: Grammar,
        grammars: Grammar[],
        grammarIndex: number,
        cells: Cell[],
        nonTerminals: string[],
        stack: Cell[],
        startToken: CellValue,
        tempStack: Cell[],
        nonTerminalsArray: string[],
    ) {
        const nonTerm = firstGrammar.nonTerminal;
        grammars.forEach(grammar => {
            grammar.rightPart.forEach((val, index, array) => {
                const isLast = index === array.length - 1;
                if (val === nonTerm) {
                    if (isLast) {
                        if (!nonTerminalsArray.includes(nonTerm)) {
                            nonTerminalsArray.push(nonTerm);
                            recForLastElement(
                                grammar,
                                grammars,
                                grammarIndex,
                                cells,
                                nonTerminals,
                                stack,
                                startToken,
                                tempStack,
                                nonTerminalsArray,
                            );
                        }
                    } else {
                        const column = array[index + 1];
                        pushStateR(column, grammarIndex, cells);

                        if (nonTerminals.includes(column)) {
                            getRTokens(
                                grammars,
                                column,
                                nonTerminals,
                                stack,
                                startToken,
                                firstGrammar,
                                cells,
                                tempStack,
                                grammarIndex,
                            );
                        }
                    }
                }
            });
        });
    }
}
