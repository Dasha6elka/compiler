import {
    Literal,
    TokenTable,
    LiteralToken,
    SymbolType,
    InputToken,
    LiteralSet,
    RuleValue,
    GrammarValue,
} from "./common";
import { END } from "./constants";
import { exceptions } from "./exceptions";
import { factory } from "./factory";

export namespace generator {
    export function exec(rules: RuleValue[], grammars: GrammarValue[]): TokenTable {
        const table = factory.createTokenTable();

        const tokens: RuleToken[] = [];

        let index = 0;

        for (const pair of rules) {
            const { literal: key, set: values } = pair;
            const row = new RuleToken(index, key, values!, pair.last);
            tokens.push(row);
            row.visit(table);
            index++;
        }

        for (const pair of grammars) {
            const { literal: key, options: values } = pair;

            let row: GrammarToken | null = null;
            if (values.type === SymbolType.Terminal) {
                row = new GrammarToken(index, key, values.set, values.type, tokens, values.last, values.end);
            } else if (values.type === SymbolType.Nonterminal) {
                row = new GrammarToken(index, key, values.set, values.type, tokens, values.last, values.end);
            } else if (values.type === SymbolType.Empty) {
                row = new GrammarToken(index, key, values.set, values.type, tokens, values.last, values.end);
            }

            row?.visit(table);
            index++;
        }

        return table;
    }

    class RuleToken implements InputToken {
        constructor(private _index: number, private _rule: Literal, private first: LiteralSet, private last: boolean) {}

        get index() {
            return this._index;
        }

        get rule() {
            return this._rule;
        }

        visit(table: TokenTable): void {
            const token: LiteralToken = {
                rule: this._rule,
                first: this.first,
                pointer: null,
                offset: false,
                error: this.last ? true : false,
                stack: false,
                end: false,
            };
            table.set(this._index, token);
        }
    }

    class GrammarToken implements InputToken {
        constructor(
            private index: number,
            private rule: Literal,
            private first: LiteralSet,
            private type: SymbolType,
            private rules: RuleToken[],
            private last: boolean,
            private end: boolean = false,
        ) {}

        visit(table: TokenTable): void {
            switch (this.type) {
                case SymbolType.Nonterminal: {
                    const left = this.findFirstTokenBy(this.rule); // FIXME: Все время undefined
                    if (left) {
                        const token = this.createNonterminalToken(left);
                        table.set(this.index, token);
                    } else {
                        throw new exceptions.generator.LeftTokenNotFound();
                    }
                    break;
                }

                case SymbolType.Terminal: {
                    const token = this.createTerminalToken();
                    table.set(this.index, token);
                    break;
                }

                case SymbolType.Empty: {
                    const token = this.createEmptyToken();
                    table.set(this.index, token);
                    break;
                }
            }
        }

        private findFirstTokenBy(literal: Literal): RuleToken | undefined {
            return this.rules.find(rule => rule.rule === literal);
        }

        private createNonterminalToken(left: RuleToken): LiteralToken {
            return {
                rule: this.rule,
                first: this.first,
                pointer: left.index,
                offset: false,
                error: true,
                stack: !this.last,
                end: this.end,
            };
        }

        private createTerminalToken(): LiteralToken {
            return {
                rule: this.rule,
                first: this.first,
                pointer: !this.last ? this.index + 1 : null,
                offset: true,
                error: true,
                stack: false,
                end: this.end,
            };
        }

        private createEmptyToken(): LiteralToken {
            return {
                rule: this.rule,
                first: factory.createLiteralSet([END]),
                pointer: null,
                offset: false,
                error: true,
                stack: false,
                end: this.end,
            };
        }
    }
}
