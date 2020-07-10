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

        let act: Act = {
            value: State.OK,
            index: 0,
        };

        rowStack.push(grammars[0].nonTerminal);

        let isError = true;
        rows[0].value.forEach(cell => {
            if (cell.column === symbol) {
                act = cell.value;
                rowStack.push(act);
                isError = false;

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

        while (!end && stack.length !== 0) {
            if (act.value === State.S) {
                const nextRow = rows[act.index];
                let isError = true;
                nextRow.value.forEach(cell => {
                    if (cell.column === symbol) {
                        act = cell.value;
                        rowStack.push(act);
                        isError = false;

                        symbol = input[++i];
                        if (symbol === undefined) {
                            return;
                        }

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
            } else if (act.value === State.R) {
                const grammar = grammars[act.index];
                act = rowStack.pop();
                const tokens: string[] = grammar.rightPart.reverse();
                for (let j = 0; j < tokens.length; j++) {
                    act = rowStack.pop();

                    if (tokens[j] !== stack.pop()) {
                        const result: ExecResult = {
                            ok: false,
                            error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                        };

                        return result;
                    }
                }
                stack.push(grammar.nonTerminal);
            }

            if (symbol === END && stack.length === 0 && rowStack.length === 0) {
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
