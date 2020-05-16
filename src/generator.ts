import { Literal, TokenTable, LiteralToken, SymbolType, InputToken, LiteralSet } from "./common";
import { END } from "./constants";
import { utils } from "./utils";
import { exceptions } from "./exceptions";
import { factory } from "./factory";

export namespace generator {
    export class RuleToken implements InputToken {
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

    export class GrammarToken implements InputToken {
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
