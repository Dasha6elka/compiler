import _ from "lodash";
import { Row, Grammar, State, Literal } from "../common/common";
import { exceptions } from "./exceptions";
import { Lexer, Token, TokenType } from "lexer4js";
import { EMPTY } from "../common/constants";
import { SymbolsTable } from "./symbolsTable";
import postfix from "./postfix";

export namespace analyzer {
    type ExecError = exceptions.analyzer.IncorrectSequenceOrderException;

    export interface ExecResult {
        ok: boolean;
        error: ExecError | null;
    }

    export interface PositionError {
        offset: string;
        symbol: string;
        line: number;
        position: number;
    }

    export interface ExecResultFailed extends ExecResult {
        ok: boolean;
        error: ExecError | null;
        token: string;
        line: number;
        position: number;
    }

    interface Value {
        value: string;
        typeNum: TokenType;
    }

    export function exec(rows: Row[], grammars: Grammar[], tokensLexer: Token[], source: string): ExecResult {
        const nonTerminals: Literal[] = _.uniq(_.map(grammars, "nonTerminal"));

        const tokensStack: any[] = [];
        const inputStack: any[] = [];
        const statesStack: any[] = [];
        statesStack.push({
            value: State.S,
            index: 0,
        });

        const lexer = new Lexer();
        const tokensInput = lexer
            .tokenize(source)
            .map(token => `${token.type} ${token.literal} ${token.line} ${token.position}`);

        const errors: PositionError[] = getTokensSymbol(tokensLexer);

        const grammarsArray: Grammar[] = [];

        grammars.forEach(grammar => {
            let toks: string[] = [];
            grammar.rightPart.forEach(token => {
                if (token === EMPTY) {
                    return;
                }
                if (!nonTerminals.includes(token)) {
                    const lexer = new Lexer();
                    let tokInput = lexer.tokenize(token);

                    tokensLexer.forEach(t => {
                        if (token === t.literal && !toks.includes(t.type)) {
                            toks.push(t.type);
                        } else if (tokInput[0].type === t.type && !toks.includes(t.type)) {
                            toks.push(t.type);
                        }
                    });
                } else {
                    toks.push(token);
                }
            });
            grammarsArray.push({
                nonTerminal: grammar.nonTerminal,
                rightPart: toks,
                elements: grammar.elements,
            });
        });

        inputStack.push("END");
        for (let j = tokensInput.length - 1; j >= 0; j--) {
            const array = tokensInput[j].split(" ");
            inputStack.push(array[0]);
        }

        let end = false;
        let state = statesStack[statesStack.length - 1];
        let i: number = 0;
        let isParams = false;
        let isExpression = false;
        let isCondition = false;
        let type = "";
        const table = new SymbolsTable();
        table.create();
        let stack: string[] = [];
        let prevSymbol = "";
        let identifier = "";

        let value: Value = {
            value: "",
            typeNum: TokenType.INT,
        };

        let tokenList: string = "";
        let ast: (string | number | undefined)[][] = [];

        let symbol = "";

        while (!end) {
            if (state.value === State.S) {
                const curr = inputStack[inputStack.length - 1];
                if (i < errors.length) {
                    symbol = errors[i].symbol;
                }
                const isType = curr === "INT" || curr === "DOUBLE" || curr === "BOOLEAN" || curr === "STRING";
                const isAssign = curr === "ASSIGNMENT";

                if (isType) {
                    isParams = true;
                    if (curr === "INT") {
                        type = "INT_LITERAL";
                    } else if (curr === "DOUBLE") {
                        type = "DOUBLE_LITERAL";
                    } else if (curr === "STRING") {
                        type = "STRING_LITERAL";
                    } else {
                        type = curr;
                    }
                }

                if (isAssign) {
                    identifier = prevSymbol;
                    isExpression = true;
                }

                if (symbol === ";" && curr === "SEMICOLON") {
                    if (isParams) {
                        isParams = false;
                    }
                    if (isExpression) {
                        const postfixExpr = postfix(tokenList);
                        ast.push(postfixExpr);
                        tokenList = "";
                        isExpression = false;
                    }
                }

                if (prevSymbol === "if" && symbol === "(") {
                    isCondition = true;
                }

                if (isCondition && symbol === "{") {
                    isCondition = false;
                    if (stack.length === 1) {
                        stack.pop();
                    }
                }

                const a = table.isHas(symbol, type);

                if (isParams && curr === "IDENTIFIER" && !isType && !a) {
                    table.addSymbol(symbol, type, undefined);
                }

                const currRow = rows[state.index];
                let isError = true;

                currRow.value.forEach(cell => {
                    if (cell.column === curr) {
                        state = cell.value;

                        if (state === State.OK) {
                            end = true;
                            isError = false;
                            return;
                        }

                        if (state.value !== State.R) {
                            statesStack.push(state);
                            inputStack.pop();
                            tokensStack.push(curr);

                            if (nonTerminals.includes(curr)) {
                                i--;
                            } else if (!nonTerminals.includes(curr) && (isExpression || isCondition) && !isAssign) {
                                if (
                                    curr === "INT_LITERAL" ||
                                    curr === "DOUBLE_LITERAL" ||
                                    curr === "ADDITION" ||
                                    curr === "DIVISION" ||
                                    curr === "MULTIPLICATION" ||
                                    curr === "SUBTRACTION" ||
                                    curr === "TRUE" ||
                                    curr === "FALSE" ||
                                    curr === "STRING_LITERAL"
                                ) {
                                    stack.push(symbol);
                                    tokenList += `${symbol} `;
                                } else if (curr === "OPENING_BRACE" || curr === "CLOSING_BRACE") {
                                    tokenList += `${symbol} `;
                                } else if (curr === "IDENTIFIER" && (isExpression || isCondition)) {
                                    const valueId = table.getValue(symbol);

                                    if (valueId !== undefined) {
                                        stack.push(valueId);
                                        tokenList += `${valueId} `;
                                    } else {
                                        const result: ExecResultFailed = {
                                            ok: false,
                                            error: new exceptions.analyzer.IncorrectUseUnassignedVariable(),
                                            token: errors[i].offset,
                                            line: errors[i].line,
                                            position: errors[i].position,
                                        };

                                        return result;
                                    }
                                }
                            }

                            i++;

                            isError = false;
                            return;
                        }

                        isError = false;
                    }
                });

                prevSymbol = symbol;

                if (isError) {
                    const result: ExecResultFailed = {
                        ok: false,
                        error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                        token: errors[i].offset,
                        line: errors[i].line,
                        position: errors[i].position,
                    };

                    return result;
                }
            } else if (state.value === State.R) {
                const grammar = grammarsArray[state.index];
                const rightPart: string[] = grammar.rightPart.reverse();

                if (rightPart.includes("EQUALS")) {
                    const right = stack.pop()!;
                    const left = stack.pop()!;

                    let tokRight = new Lexer().tokenize(right);
                    let tokLeft = new Lexer().tokenize(left);

                    if (!tokRight[0] && !tokLeft[0] && tokRight[0].type !== tokLeft[0].type) {
                        const result: ExecResultFailed = {
                            ok: false,
                            error: new exceptions.analyzer.IncorrectTypeException(),
                            token: errors[i].offset,
                            line: errors[i].line,
                            position: errors[i].position,
                        };

                        return result;
                    }

                    value.value = "";
                    value.typeNum = TokenType.INT;
                }

                if (rightPart.includes("ADDITION")) {
                    let second = stack.pop()!;
                    exp(stack, value, "ADDITION", second, errors, i);
                }

                if (rightPart.includes("SUBTRACTION")) {
                    if (rightPart.length === 2) {
                        const number = stack.pop();
                        const minus = stack.pop();
                        if (minus === "-") {
                            stack.push(`${minus}${number}`);
                        } else {
                            const realMinus = stack.pop();
                            stack.push(`${realMinus}${minus}`, `${number}`);
                        }
                    } else {
                        let second = stack.pop()!;
                        exp(stack, value, "SUBTRACTION", second, errors, i);
                    }
                }

                if (rightPart.includes("MULTIPLICATION")) {
                    let second = stack.pop()!;
                    exp(stack, value, "MULTIPLICATION", second, errors, i);
                }

                if (rightPart.includes("DIVISION")) {
                    let second = stack.pop()!;
                    if (second === "0") {
                        const result: ExecResultFailed = {
                            ok: false,
                            error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                            token: errors[i].offset,
                            line: errors[i].line,
                            position: errors[i].position,
                        };

                        return result;
                    }
                    exp(stack, value, "DIVISION", second, errors, i);
                }

                if (!isExpression && !isCondition && stack.length === 1) {
                    let val = stack.pop()!;

                    if (val[0] === "-") {
                        val = val.replace("-", "");
                        value.value = `-${val}`;
                    } else {
                        value.value = val;
                    }

                    if (isInt(val)) {
                        value.typeNum = TokenType.INT_LITERAL;
                    } else if (val[0] === '"') {
                        value.typeNum = TokenType.STRING_LITERAL;
                    } else if (val === "true" || val === "false") {
                        value.typeNum = TokenType.BOOLEAN;
                    } else {
                        value.typeNum = TokenType.DOUBLE_LITERAL;
                    }

                    if (rightPart.includes("INT_LITERAL")) {
                        value.typeNum = TokenType.INT_LITERAL;
                    } else if (rightPart.includes("DOUBLE_LITERAL")) {
                        value.typeNum = TokenType.DOUBLE_LITERAL;
                    } else if (rightPart.includes("TRUE") || rightPart.includes("FALSE")) {
                        value.typeNum = TokenType.BOOLEAN;
                    } else if (rightPart.includes("STRING_LITERAL")) {
                        value.typeNum = TokenType.STRING_LITERAL;
                    }
                }

                if (rightPart.includes("ASSIGNMENT")) {
                    const typeId = table.getType(identifier);
                    if (typeId !== value.typeNum || value.value == "NaN") {
                        if (typeId === TokenType.DOUBLE_LITERAL && value.typeNum === TokenType.INT_LITERAL) {
                            table.update(identifier, `${value.value}.0`);
                            value.value = "";
                            value.typeNum = TokenType.INT;
                        } else {
                            const result: ExecResultFailed = {
                                ok: false,
                                error: new exceptions.analyzer.IncorrectTypeException(),
                                token: errors[i].offset,
                                line: errors[i].line,
                                position: errors[i].position,
                            };
                            return result;
                        }
                    } else {
                        table.update(identifier, value.value.toString());
                        value.value = "";
                        value.typeNum = TokenType.INT;
                    }
                }

                for (let j = 0, i = rightPart.length - 1; j < rightPart.length, i >= 0; j++, i--) {
                    if (rightPart.length !== 0) {
                        const token = tokensStack.pop();
                        if (rightPart[j] !== token && rightPart[i] !== token) {
                            const result: ExecResultFailed = {
                                ok: false,
                                error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                                token: errors[i].offset,
                                line: errors[i].line,
                                position: errors[i].position,
                            };

                            return result;
                        }
                    }
                }

                inputStack.push(grammar.nonTerminal);
                for (let j = 0; j < rightPart.length; j++) {
                    statesStack.pop();
                }
                state = statesStack[statesStack.length - 1];
            }
        }

        table.delete();

        const result: ExecResult = {
            ok: true,
            error: null,
        };

        return result;
    }

    function getTokensSymbol(tokens: Token[]): PositionError[] {
        let errors: PositionError[] = [];

        tokens.forEach(token => {
            errors.push({
                offset: token.type,
                symbol: token.literal,
                line: token.line,
                position: token.position,
            });
        });

        return errors;
    }

    function isInt(str: string): boolean {
        return /^\+?(0|[1-9]\d*)$/.test(str);
    }

    function exp(
        stack: string[],
        value: Value,
        name: string,
        second: string,
        errors: PositionError[],
        i: number,
    ): Value | ExecResultFailed {
        stack.pop();
        let first = stack.pop();
        if (second !== undefined && first !== undefined) {
            if (first[0] === "-") {
                first = first.replace("-", "");
                if (second[0] === "-") {
                    second = second.replace("-", "");
                    setValue(first, second, name, value, true, true);
                } else {
                    setValue(first, second, name, value, true, false);
                }
            } else if (second[0] === "-") {
                second = second.replace("-", "");
                setValue(first, second, name, value, false, true);
            } else if (first[0] === '"' || second[0] === '"') {
                string(name, first, second, value, errors, i);
            } else {
                setValue(first, second, name, value, false, false);
            }
            stack.push(value.value.toString());
        }

        return value;
    }

    function string(
        name: string,
        first: string,
        second: string,
        value: Value,
        errors: PositionError[],
        i: number,
    ): Value | ExecResultFailed {
        if (name === "ADDITION") {
            if (first[0] === '"') {
                first = first.slice(1, -1);
            }
            if (second[0] === '"') {
                second = second.slice(1, -1);
            }
            value.value = '"' + first + second + '"';
            value.typeNum = TokenType.STRING_LITERAL;
        } else {
            const result: ExecResultFailed = {
                ok: false,
                error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                token: errors[i].offset,
                line: errors[i].line,
                position: errors[i].position,
            };

            return result;
        }

        return value;
    }

    function setValue(
        first: string,
        second: string,
        name: string,
        value: Value,
        firstMinus: boolean,
        secondMinus: boolean,
    ): Value {
        let left = 0;
        let right = 0;

        if (isInt(second) && isInt(first)) {
            left = parseInt(first);
            right = parseInt(second);
            value.typeNum = TokenType.INT_LITERAL;
        } else {
            left = parseFloat(first);
            right = parseFloat(second);
            value.typeNum = TokenType.DOUBLE_LITERAL;
        }

        if (firstMinus) {
            left = -left;
        }
        if (secondMinus) {
            right = -right;
        }

        let val =
            name === "ADDITION"
                ? left + right
                : name === "MULTIPLICATION"
                ? left * right
                : name === "DIVISION"
                ? parseInt((left / right).toString())
                : left - right;
        value.value = val.toString();

        return value;
    }
}
