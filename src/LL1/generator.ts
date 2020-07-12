import {
    Literal,
    TokenTable,
    LiteralToken,
    SymbolType,
    InputToken,
    LiteralSet,
    RuleValue,
    GrammarValue,
} from "../common/common";
import { exceptions } from "./exceptions";
import { factory } from "../common/factory";
import { lexer } from "../lexer";
import { END } from "../common/constants";

export namespace generator {
    export function exec(rules: RuleValue[], grammars: GrammarValue[], tokensLexer: string[]): TokenTable {
        const table = factory.createTokenTable();

        const tokens: RuleToken[] = [];

        let index = 0;

        for (const pair of rules) {
            const { literal: key, set: values } = pair;
            const row = new RuleToken(index, key, values!, pair.last);
            tokens.push(row);
            row.visit(table, tokensLexer);
            index++;
        }

        for (const pair of grammars) {
            const { literal: key, options: values } = pair;

            const row: GrammarToken = new GrammarToken(
                index,
                key,
                values.set,
                values.type,
                tokens,
                values.last,
                values.end,
            );

            row?.visit(table, tokensLexer);
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

        visit(table: TokenTable, tokensLexer: string[]): void {
            let first: Set<Literal> = isLexerToken(tokensLexer, this.first);

            if (first.size === 0) {
                first = this.first;
            }

            const token: LiteralToken = {
                rule: this._rule,
                first,
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

        visit(table: TokenTable, tokensLexer: string[]): void {
            switch (this.type) {
                case SymbolType.Nonterminal: {
                    const left = this.findFirstTokenBy(this.rule);
                    if (left) {
                        const token = this.createNonterminalToken(left, tokensLexer);
                        table.set(this.index, token);
                    } else {
                        throw new exceptions.generator.LeftTokenNotFound();
                    }
                    break;
                }

                case SymbolType.Terminal: {
                    const token = this.createTerminalToken(tokensLexer);
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

        private createNonterminalToken(left: RuleToken, tokensLexer: string[]): LiteralToken {
            const first: Set<Literal> = isLexerToken(tokensLexer, this.first);

            return {
                rule: this.rule,
                first,
                pointer: left.index,
                offset: false,
                error: true,
                stack: !this.last,
                end: this.end,
            };
        }

        private createTerminalToken(tokensLexer: string[]): LiteralToken {
            let rule = "";

            const tok = getTokens([this.rule]);
            tokensLexer.forEach(token => {
                const array = token.split(" ")[0];
                if (tok[0] === array) {
                    rule = array;
                }
            });

            const first: Set<Literal> = new Set<Literal>();
            first.add(rule);

            return {
                rule,
                first,
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
                first: factory.createLiteralSet(["END"]),
                pointer: null,
                offset: false,
                error: true,
                stack: false,
                end: this.end,
            };
        }
    }

    function isLexerToken(tokensLexer: string[], thisFirst: LiteralSet): Set<Literal> {
        const first: Set<Literal> = new Set<Literal>();
        let rule = "";

        let tokens: string[] = [];
        thisFirst.forEach(token => {
            tokens.push(token);
        });

        const tokensInput = getTokens(tokens);

        tokensLexer.forEach(token => {
            const array = token.split(" ");
            if (tokensInput.includes(array[0])) {
                rule = array[0];
                first.add(rule);
            }
        });

        if (tokens.includes(END)) {
            first.add("END");
        }

        return first;
    }

    function getTokens(input: string[]): string[] {
        let tokensLexer: string[] = [];
        tokensLexer = lexer.main(input, tokensLexer);
        let tokensArray: string[] = [];

        tokensLexer.forEach(token => {
            const array = token.split(" ");
            tokensArray.push(array[0]);
        });

        return tokensArray;
    }
}
