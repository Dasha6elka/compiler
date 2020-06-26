import { TokenTable, Pointer, Stack, Literal, LiteralToken } from "../common/common";
import { exceptions } from "./exceptions";
import { EMPTY, END } from "../common/constants";
import { lexer } from "../../../Lexer/src";

export namespace analyzer {
    type ExecError = exceptions.analyzer.EmptyStackException | exceptions.analyzer.IncorrectSequenceOrderException;

    export interface ExecResult {
        ok: boolean;
        error: ExecError | null;
    }

    export function exec(table: TokenTable, seq: Iterator<Literal>): ExecResult {
        const stack: Stack<Pointer> = [];

        let pointer: Pointer = 0;
        let top = table.get(pointer);

        let end = false;
        let offset: Literal | null = seq.next().value ?? null;

        let tokensLexer: string[] = [];
        tokensLexer = lexer.main("./lexer.txt", "./tokens.txt", tokensLexer);
        let tokensArray: string[] = [];

        tokensLexer.forEach(token => {
            const array = token.split(" ");
            tokensArray.push(array[1]);
        });

        while (!(end && !stack.length && top?.end)) {
            if (!top?.error && ((offset && !top?.first.has(offset)) || offset == null)) {
                const array = Array.from(table.entries());
                while (offset && !top?.first.has(offset) && !top?.error) {
                    const [index] = array.find(([, token]) => token === top)!;
                    top = table.get(index + 1);
                }
            }

            if (top?.stack) {
                const array = Array.from(table.entries());
                const [index] = array.find(([, token]) => token === top)!;
                stack.push(index + 1);
            }

            if (top?.error && offset && !top?.first.has(offset) && offset === EMPTY) {
                const result: ExecResult = {
                    ok: false,
                    error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                };
                return result;
            }

            if (offset && top?.first.has(offset) && top?.offset) {
                const it = seq.next();
                if (!tokensArray.includes(it.value) && it.value != END) {
                    const result: ExecResult = {
                        ok: false,
                        error: new exceptions.analyzer.IncorrectTokens(),
                    };
                    return result;
                }
                offset = it.value ?? null;
                end = !!it.done;
            } else if (offset && !top?.first.has(offset) && top?.offset) {
                const result: ExecResult = {
                    ok: false,
                    error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                };
                return result;
            }

            if (offset == END) {
                end = true;
            }

            if (!top?.pointer && stack.length) {
                let nullStackPointer = true;
                while (nullStackPointer) {
                    const head = stack.pop();
                    top = table.get(head!);
                    nullStackPointer = offset === END && top?.first.has(offset) ? false : !top?.pointer;
                    if (offset && top?.first.has(offset) && top?.offset) {
                        const it = seq.next();
                        offset = it.value ?? null;
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
                if (offset && !top?.first.has(offset) && top?.pointer == null) {
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
