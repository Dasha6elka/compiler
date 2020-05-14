import { TokenTable, Pointer, Stack, Literal, LiteralToken } from "./common";
import { exceptions } from "./exceptions";

export namespace analyzer {
    type ExecError =
        | exceptions.analyzer.EmptyStackException
        | exceptions.analyzer.IncorrectSequenceOrderException;

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

        while (!(end && !stack.length && top?.end)) {
            if (!top?.error && offset && !top?.first.has(offset)) {
                const array = Array.from(table.entries());
                const [index] = array.find(([, token]) => token === top)!;
                top = table.get(index + 1);
            }

            if (top?.stack) {
                const array = Array.from(table.entries());
                const [index] = array.find(([, token]) => token === top)!;
                stack.push(index + 1);
            }

            if (top?.error && offset && !top?.first.has(offset)) {
                const result: ExecResult = {
                    ok: false,
                    error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                };
                return result;
            }

            if (top?.offset) {
                const it = seq.next();
                offset = it.value ?? null;
                end = !!it.done;
            }

            if (!top?.pointer && stack.length) {
                let nullStackPointer = true;
                while (nullStackPointer) {
                    const head = stack.pop();
                    top = table.get(head!);
                    nullStackPointer = !!top?.pointer;
                }
            } else if (!top?.pointer && !stack.length && !top?.end) {
                const result: ExecResult = {
                    ok: false,
                    error: new exceptions.analyzer.EmptyStackException(),
                };
                return result;
            }

            pointer = top?.pointer ?? null;
            if (pointer) {
                top = table.get(pointer);
            }
        }

        const result: ExecResult = {
            ok: true,
            error: null,
        };
        return result;
    }
}
