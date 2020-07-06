import { TokenTable, Pointer, Stack, Literal } from "../common/common";
import { exceptions } from "./exceptions";
import { lexer } from "../lexer";

export namespace analyzer {
    type ExecError =
        | exceptions.analyzer.EmptyStackException
        | exceptions.analyzer.IncorrectSequenceOrderException
        | exceptions.analyzer.IncorrectTokens;

    export interface ExecResult {
        ok: boolean;
        error: ExecError | null;
    }

    export function exec(table: TokenTable, input: string[]): ExecResult {
        const stack: Stack<Pointer> = [];

        const inputFile: string = "./lexer.txt";
        let pointer: Pointer = 0;
        let top = table.get(pointer);

        let end = false;

        const inputTokens: string[] = getTokensSymbol(input, 1);

        const seq: Iterator<string> = inputTokens[Symbol.iterator]();

        let offsetArray: string[] = getTokensSymbol(input, 0);

        const tokensArray: string[] = getTokens(inputFile);

        let i: number = 0;
        let first: string = offsetArray[i];
        while (!(end && !stack.length && top?.end)) {
            if (!top?.error && ((first && !top?.first.has(first)) || first == null)) {
                const array = Array.from(table.entries());
                while (first && !top?.first.has(first) && !top?.error) {
                    const [index] = array.find(([, token]) => token === top)!;
                    top = table.get(index + 1);
                }
            }

            if (top?.stack) {
                const array = Array.from(table.entries());
                const [index] = array.find(([, token]) => token === top)!;
                stack.push(index + 1);
            }

            if (top?.error && first && !top?.first.has(first) && first === "EMPTY") {
                const result: ExecResult = {
                    ok: false,
                    error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                };
                return result;
            }

            if (first && top?.first.has(first) && top?.offset) {
                const it = seq.next();
                if (!tokensArray.includes(first) && first != "END") {
                    const result: ExecResult = {
                        ok: false,
                        error: new exceptions.analyzer.IncorrectTokens(),
                    };
                    return result;
                }
                i++;
                first = offsetArray[i];
                end = !!it.done;
            } else if (first && !top?.first.has(first) && top?.offset) {
                const result: ExecResult = {
                    ok: false,
                    error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                };
                return result;
            }

            if (first == "END") {
                end = true;
            }

            if (!top?.pointer && stack.length) {
                let nullStackPointer = true;
                while (nullStackPointer) {
                    const head = stack.pop();
                    top = table.get(head!);
                    nullStackPointer = first === "END" && top?.first.has(first) ? false : !top?.pointer;
                    if (first && top?.first.has(first) && top?.offset) {
                        const it = seq.next();
                        i++;
                        first = offsetArray[i];
                        end = !!it.done;
                    }
                }
            } else if (top?.pointer == null && !stack.length && !top?.end && !end) {
                const result: ExecResult = {
                    ok: false,
                    error: new exceptions.analyzer.EmptyStackException(),
                };
                return result;
            }

            pointer = top?.pointer ?? null;
            if (pointer != null) {
                top = table.get(pointer);
                if (first && !top?.first.has(first) && top?.pointer == null) {
                    const result: ExecResult = {
                        ok: false,
                        error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                    };
                    return result;
                }
            }
        }

        const result: ExecResult = {
            ok: true,
            error: null,
        };
        return result;
    }
}

function getTokens(inputFile: string): string[] {
    let tokensLexer: string[] = [];
    tokensLexer = lexer.main(inputFile, tokensLexer);
    let tokensArray: string[] = [];

    tokensLexer.forEach(token => {
        const array = token.split(" ");
        tokensArray.push(array[0]);
    });

    return tokensArray;
}

function getTokensSymbol(inputTokens: string[], position: number): string[] {
    let tokensArray: string[] = [];

    inputTokens.forEach(token => {
        const array = token.split(" ");
        tokensArray.push(array[position]);
    });

    return tokensArray;
}
