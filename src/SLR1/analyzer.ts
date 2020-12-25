import _, { isNumber } from "lodash";
import { Row, Grammar, State, Literal } from "../common/common";
import { exceptions } from "./exceptions";
import { Lexer, Token, TokenType } from "lexer4js";
import { EMPTY } from "../common/constants";
import { SymbolsTable } from "./symbolsTable";

export namespace analyzer {
    type ExecError = exceptions.analyzer.IncorrectSequenceOrderException;

    export interface ExecResult {
        ok: boolean;
        error: ExecError | null;
    }

    export interface ExecResultFailed extends ExecResult {
        ok: boolean;
        error: ExecError | null;
        token: string;
        line: string;
        position: string;
    }

    interface Number {
        num: number;
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

        let offsetArray: string[] = getTokensSymbol(tokensInput, 0);
        let symbolsArray: string[] = getTokensSymbol(tokensInput, 1);
        let linesArray: string[] = getTokensSymbol(tokensInput, 2);
        let positionArray: string[] = getTokensSymbol(tokensInput, 3);

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

        let num = {
            num: Number.MAX_SAFE_INTEGER,
            typeNum: TokenType.INT,
        };

        let tokenList: string = "";
        let ast: (string | number | undefined)[][] = [];

        while (!end) {
            if (state.value === State.S) {
                const curr = inputStack[inputStack.length - 1];
                const symbol = symbolsArray[i];
                const isType = curr === "INT" || curr === "DOUBLE" || curr === "BOOLEAN";
                const isAssign = curr === "ASSIGNMENT";

                if (isType) {
                    isParams = true;
                    if (curr === "INT") {
                        type = "INT_LITERAL";
                    } else if (curr === "DOUBLE") {
                        type = "DOUBLE_LITERAL";
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
                        ast.push(infixToPostfix(tokenize(tokenList)));
                        tokenList = "";
                        isExpression = false;
                    }
                }

                if (prevSymbol === "if" && symbol === "(") {
                    isCondition = true;
                }

                if (isCondition && symbol === ")") {
                    isCondition = false;
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
                                    curr === "SUBTRACTION"
                                ) {
                                    stack.push(symbol);
                                    tokenList += `${symbol} `;
                                } else if (curr === "OPENING_BRACE" || curr === "CLOSING_BRACE") {
                                    tokenList += `${symbol} `;
                                } else if (curr === "IDENTIFIER") {
                                    const valueId = table.getValue(symbol);

                                    if (valueId !== undefined) {
                                        stack.push(valueId);
                                    } else {
                                        const result: ExecResultFailed = {
                                            ok: false,
                                            error: new exceptions.analyzer.IncorrectUseUnassignedVariable(),
                                            token: offsetArray[i],
                                            line: linesArray[i],
                                            position: positionArray[i],
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
                        token: offsetArray[i],
                        line: linesArray[i],
                        position: positionArray[i],
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

                    if (
                        (!tokRight[0] && !tokLeft[0]) ||
                        (tokRight[0].type !== tokLeft[0].type &&
                            tokRight[0].type !== "INT_LITERAL" &&
                            tokLeft[0].type !== "INT_LITERAL" &&
                            tokRight[0].type !== "DOUBLE_LITERAL" &&
                            tokLeft[0].type !== "DOUBLE_LITERAL")
                    ) {
                        const result: ExecResultFailed = {
                            ok: false,
                            error: new exceptions.analyzer.IncorrectTypeException(),
                            token: offsetArray[i],
                            line: linesArray[i],
                            position: positionArray[i],
                        };

                        return result;
                    }
                }

                if (rightPart.includes("ADDITION")) {
                    let second = stack.pop()!;
                    exp(stack, num, "ADDITION", second);
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
                        exp(stack, num, "SUBTRACTION", second);
                    }
                }

                if (rightPart.includes("MULTIPLICATION")) {
                    let second = stack.pop()!;
                    exp(stack, num, "MULTIPLICATION", second);
                }

                if (rightPart.includes("DIVISION")) {
                    let second = stack.pop()!;
                    if (second === "0") {
                        const result: ExecResultFailed = {
                            ok: false,
                            error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                            token: offsetArray[i],
                            line: linesArray[i],
                            position: positionArray[i],
                        };

                        return result;
                    }
                    exp(stack, num, "DIVISION", second);
                }

                if (!isExpression && !isCondition && stack.length === 1 && num.num === Number.MAX_SAFE_INTEGER) {
                    let number = stack.pop()!;
                    if (number[0] === "-") {
                        number = number.replace("-", "");
                        if (isInt(number)) {
                            num.num = -parseInt(number);
                            num.typeNum = TokenType.INT_LITERAL;
                        } else {
                            num.num = -parseFloat(number);
                            num.typeNum = TokenType.DOUBLE_LITERAL;
                        }
                    } else {
                        if (isInt(number)) {
                            num.num = parseInt(number);
                            num.typeNum = TokenType.INT_LITERAL;
                        } else {
                            num.num = parseFloat(number);
                            num.typeNum = TokenType.DOUBLE_LITERAL;
                        }
                    }

                    if (rightPart.includes("INT_LITERAL")) {
                        num.num = parseInt(number);
                        num.typeNum = TokenType.INT_LITERAL;
                    } else if (rightPart.includes("DOUBLE_LITERAL")) {
                        num.num = parseFloat(number);
                        num.typeNum = TokenType.DOUBLE_LITERAL;
                    }
                }

                if (rightPart.includes("ASSIGNMENT")) {
                    const typeId = table.getType(identifier);
                    if (
                        typeId === TokenType.INT_LITERAL &&
                        num.typeNum === TokenType.DOUBLE_LITERAL
                    ) {
                        const result: ExecResultFailed = {
                            ok: false,
                            error: new exceptions.analyzer.IncorrectTypeException(),
                            token: offsetArray[i],
                            line: linesArray[i],
                            position: positionArray[i],
                        };

                        return result;
                    } else {
                        if (typeId === TokenType.DOUBLE_LITERAL && isInt(num.num.toString())) {
                            table.update(identifier, `${num.num}.0`);
                        } else {
                            table.update(identifier, num.num.toString());
                        }
                        num.num = Number.MAX_SAFE_INTEGER;
                    }
                }

                for (let j = 0, i = rightPart.length - 1; j < rightPart.length, i >= 0; j++, i--) {
                    if (rightPart.length !== 0) {
                        const token = tokensStack.pop();
                        if (rightPart[j] !== token && rightPart[i] !== token) {
                            const result: ExecResultFailed = {
                                ok: false,
                                error: new exceptions.analyzer.IncorrectSequenceOrderException(),
                                token: offsetArray[i],
                                line: linesArray[i],
                                position: positionArray[i],
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

    function tokenize(exp: string): (string | number)[] {
        return exp
            .replace(/\s/g, "")
            .split("")
            .map(token => (/^\d$/.test(token) ? +token : token));
    }

    function infixToPostfix(infix: (string | number)[]): (string | number | undefined)[] {
        const presedences = ["-", "+", "*", "/"];

        var operationsStack = [],
            postfix = [];

        for (let token of infix) {
            if ("number" === typeof token) {
                postfix.push(token);
                continue;
            }

            let topOfStack = operationsStack[operationsStack.length - 1];
            if (!operationsStack.length || topOfStack == "(") {
                operationsStack.push(token);
                continue;
            }

            if (token == "(") {
                operationsStack.push(token);
                continue;
            }

            if (token == ")") {
                pushOperations(operationsStack, postfix);
                continue;
            }

            let prevPresedence = presedences.indexOf(topOfStack),
                currPresedence = presedences.indexOf(token);
            while (currPresedence < prevPresedence) {
                let op = operationsStack.pop();
                postfix.push(op);
                prevPresedence = presedences.indexOf(operationsStack[operationsStack.length - 1]);
            }
            operationsStack.push(token);
        }

        pushOperations(operationsStack, postfix);

        return postfix;
    }

    function pushOperations(opsStack: string[], postfix: (string | number | undefined)[]): void {
        while (opsStack.length) {
            let op = opsStack.pop();
            if (op == "(") break;
            postfix.push(op!);
        }
    }

    function getTokensSymbol(inputTokens: string[], position: number): string[] {
        let tokensArray: string[] = [];

        inputTokens.forEach(token => {
            const array = token.split(" ");
            tokensArray.push(array[position]);
        });

        return tokensArray;
    }

    function isInt(str: string): boolean {
        return /^\+?(0|[1-9]\d*)$/.test(str);
    }

    function exp(stack: string[], num: Number, name: string, second: string): Number {
        stack.pop();
        let first = stack.pop();
        if (second !== undefined && first !== undefined) {
            if (first[0] === "-") {
                first = first.replace("-", "");
                if (second[0] === "-") {
                    second = second.replace("-", "");
                    if (isInt(second) && isInt(first)) {
                        num.num =
                            name === "ADDITION"
                                ? -parseInt(first) - parseInt(second)
                                : name === "MULTIPLICATION"
                                ? -parseInt(first) * -parseInt(second)
                                : name === "DIVISION"
                                ? parseInt((-parseInt(first) / -parseInt(second)).toString())
                                : -parseInt(first) + parseInt(second);
                        num.typeNum = TokenType.INT_LITERAL;
                    } else {
                        num.num =
                            name === "ADDITION"
                                ? -parseFloat(first) - parseFloat(second)
                                : name === "MULTIPLICATION"
                                ? -parseFloat(first) * -parseFloat(second)
                                : name === "DIVISION"
                                ? -parseFloat(first) / -parseFloat(second)
                                : -parseFloat(first) + parseFloat(second);
                        num.typeNum = TokenType.DOUBLE_LITERAL;
                    }
                } else {
                    if (isInt(second) && isInt(first)) {
                        num.num =
                            name === "ADDITION"
                                ? -parseInt(first) + parseInt(second)
                                : name === "MULTIPLICATION"
                                ? -parseInt(first) * parseInt(second)
                                : name === "DIVISION"
                                ? parseInt((-parseInt(first) / parseInt(second)).toString())
                                : -parseInt(first) - parseInt(second);
                        num.typeNum = TokenType.INT_LITERAL;
                    } else {
                        num.num =
                            name === "ADDITION"
                                ? -parseFloat(first) + parseFloat(second)
                                : name === "MULTIPLICATION"
                                ? -parseFloat(first) * parseFloat(second)
                                : name === "DIVISION"
                                ? -parseFloat(first) / parseFloat(second)
                                : -parseFloat(first) - parseFloat(second);
                        num.typeNum = TokenType.DOUBLE_LITERAL;
                    }
                }
                stack.push(num.num.toString());
            } else if (second[0] === "-") {
                second = second.replace("-", "");
                if (isInt(second) && isInt(first)) {
                    num.num =
                        name == "ADDITION"
                            ? parseInt(first) - parseInt(second)
                            : name === "MULTIPLICATION"
                            ? parseInt(first) * -parseInt(second)
                            : name === "DIVISION"
                            ? parseInt((parseInt(first) / -parseInt(second)).toString())
                            : parseInt(first) + parseInt(second);
                    num.typeNum = TokenType.INT_LITERAL;
                } else {
                    num.num =
                        name == "ADDITION"
                            ? parseFloat(first) - parseFloat(second)
                            : name === "MULTIPLICATION"
                            ? parseFloat(first) * -parseFloat(second)
                            : name === "DIVISION"
                            ? parseFloat(first) / -parseFloat(second)
                            : parseFloat(first) + parseFloat(second);
                    num.typeNum = TokenType.DOUBLE_LITERAL;
                }
                stack.push(num.num.toString());
            } else {
                if (isInt(second) && isInt(first)) {
                    num.num =
                        name == "ADDITION"
                            ? parseInt(first) + parseInt(second)
                            : name === "MULTIPLICATION"
                            ? parseInt(first) * parseInt(second)
                            : name === "DIVISION"
                            ? parseInt((parseInt(first) / parseInt(second)).toString())
                            : parseInt(first) - parseInt(second);
                    num.typeNum = TokenType.INT_LITERAL;
                } else {
                    num.num =
                        name == "ADDITION"
                            ? parseFloat(first) + parseFloat(second)
                            : name === "MULTIPLICATION"
                            ? parseFloat(first) * parseFloat(second)
                            : name === "DIVISION"
                            ? parseFloat(first) / parseFloat(second)
                            : parseFloat(first) - parseFloat(second);
                    num.typeNum = TokenType.DOUBLE_LITERAL;
                }
                stack.push(num.num.toString());
            }
        }

        return num;
    }
}
