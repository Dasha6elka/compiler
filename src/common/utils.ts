export namespace utils {
    const STACK_REG_EXP = new RegExp("<(?:(?!<|>).)+>|([^-<> ]+)", "gi");

    export function useSafePush<T, P extends T[] | Set<T>>(map: Map<T, P>, factory: (value: T) => P) {
        const isP = (v: T | P): v is P => Array.isArray(v) || v instanceof Set;
        const isT = (v: T | P): v is T => !isP(v);
        const isArray = (v: unknown): v is Array<T> => Array.isArray(v);
        const isSet = (v: unknown): v is Set<T> => v instanceof Set;

        return (key: T, value: T | P) => {
            if (map.has(key)) {
                const row = map.get(key);
                if (isP(value) && isArray(row)) {
                    row?.push(...value);
                } else if (isP(value) && isSet(row)) {
                    value.forEach((v: T) => row.add(v));
                } else if (isT(value)) {
                    if (isArray(row)) {
                        row?.push(value);
                    } else if (isSet(row)) {
                        row?.add(value);
                    }
                }
            } else {
                if (isP(value)) {
                    map.set(key, value);
                } else {
                    map.set(key, factory(value));
                }
            }
        };
    }

    export function flatten(acc: string[], value: string): string[] {
        return value.length > 1 ? [...acc, ...value.split("")] : [...acc, value];
    }

    export function uniq<T>(array: T[]): T[] {
        return Array.from(new Set(array));
    }

    export namespace Input {
        export function normalize(value: string): string[] {
            return value
                .split("\n")
                .map(line => line.trim())
                .filter(Boolean);
        }

        export function stack(input: string): string[] {
            const stack = input.match(STACK_REG_EXP) ?? [];
            stack.shift();
            return stack;
        }

        export function key(input: string): string {
            const stack = input.match(STACK_REG_EXP) ?? [];
            const key = stack[0];
            return key;
        }
    }

    export namespace NonTerminal {
        export function normalize(value: string): string {
            return value.replace(/<|>/g, "");
        }
    }

    export function compare(arr1: string[], arr2: string[]): boolean {
        if (!arr1) {
            return false;
        }

        if (arr1.length != arr1.length) {
            return false;
        }

        for (var i = 0, l = arr2.length; i < l; i++) {
            if (arr1[i] && arr2[i]) {
                if (arr2[i] != arr1[i]) {
                    return false;
                }
            } else if (arr2[i] != arr1[i]) {
                return false;
            }
        }
        return true;
    }
}
