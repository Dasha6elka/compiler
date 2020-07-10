import { Row, Act, Grammar, State, CellValue } from "../common/common";
import { exceptions } from "./exceptions";
import { END } from "../common/constants";

export namespace analyzer {
    type ExecError = exceptions.analyzer.IncorrectSequenceOrderException;

    export interface ExecResult {
        ok: boolean;
        error: ExecError | null;
    }

    export function exec(rows: Row[], input: string[], grammars: Grammar[]): ExecResult {
        const stack: string[] = [];
        const rowStack: any[] = [];

        let i: number = 0;
        let symbol: string = input[i];
        stack.push(symbol);

        let state: Act = {
            value: State.OK,
            index: 0,
        };

        rowStack.push(rows[0].row);

        let isError = true;
        rows[0].value.forEach(cell => {
            if (cell.column === symbol) {
                state = cell.value;
                isError = false;

                if (input[i + 1] === undefined) {
                    return;
                }

                symbol = input[++i];
                if (symbol === undefined) {
                    return;
                }

                if (symbol === END) {
                    end = true;
                } else {
                    stack.push(symbol);
                }
            }
        });

        if (isError) {
            const result: ExecResult = {
                ok: false,
                error: new exceptions.analyzer.IncorrectSequenceOrderException(),
            };

            return result;
        }

        let end = false;

        while (!end) {
            if (state.value === State.S) {
                const nextRow = rows[state.index];
                rowStack.push(nextRow.row);
                let isError = true;
                nextRow.value.forEach(cell => {
                    if (cell.column === symbol) {
                        state = cell.value;
                        isError = false;

                        if (input[i + 1] === undefined) {
                            return;
                        }

                        symbol = input[++i];

                        if (symbol === END) {
                            return;
                        } else {
                            stack.push(symbol);
                        }
                    }
                });
                if (isError) {
                    const result: ExecResult = {
                        ok: false,
                        error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                    };

                    return result;
                }
            } else if (state.value === State.R) {
                const grammar = grammars[state.index];
                const tokens: string[] = grammar.rightPart.reverse();
                for (let j = 0; j < tokens.length; j++) {
                    rowStack.pop();

                    if (tokens[j] !== stack.pop()) {
                        const result: ExecResult = {
                            ok: false,
                            error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                        };

                        return result;
                    }
                }
                const lastRow = rowStack[rowStack.length - 1];
                stack.push(grammar.nonTerminal);

                rows.forEach(row => {
                    if (row.row === lastRow) {
                        row.value.forEach(value => {
                            if (value.column === stack[stack.length - 1]) {
                                if (value.value === State.OK) {
                                    state.value = State.OK;
                                    state.index = 0;
                                } else {
                                    state = value.value;
                                }
                            }
                        });
                    }
                });
            }

            if (state.value === State.OK) {
                end = true;
            }
        }

        const result: ExecResult = {
            ok: true,
            error: null,
        };

        return result;
    }
}
