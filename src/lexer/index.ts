import { TokenType } from "./tokenType";
import fs from "fs";

export namespace lexer {
    export function main(inputFile: string | string[], result: string[]): string[] {
        let input: string[] = [];
        if (Array.isArray(inputFile)) {
            input = inputFile;
        } else {
            input = fs
                .readFileSync(inputFile, "utf8")
                .split(/[\r\n]+/)
                .filter(Boolean);
        }

        let lineCount = 1;

        for (let k = 0; k < input.length; k++) {
            let resultString: string[] = [];
            let output = "";
            let i = 0;
            let line = input[k];

            while (i < line.length) {
                let currVal = line.charAt(i);
                let nextVal = i < line.length - 1 ? line.charAt(i + 1) : currVal;
                const prevVal = i > 0 ? line.charAt(i - 1) : currVal;
                let currToken = TokenType.INIT;
                const position = i + 1;

                switch (currVal) {
                    case "!":
                        if (nextVal == "=") {
                            output = "!=";
                            currToken = TokenType.NOT_EQUAL;
                            i++;
                        } else {
                            output = "!";
                            currToken = TokenType.ERROR;
                        }
                        break;
                    case "=":
                        if (nextVal != "=" && i != line.length - 1) {
                            output = "=";
                            currToken = TokenType.ASSIGNMENT;
                        } else {
                            output = "==";
                            currToken = TokenType.COMPARISON;
                            i++;
                        }
                        break;
                    case "+":
                        output = "+";
                        currToken = TokenType.PLUS;
                        break;
                    case "-":
                        output = "-";
                        currToken = TokenType.MINUS;
                        break;
                    case "*":
                        output = "*";
                        currToken = TokenType.MULTIPLICATION;
                        break;
                    case "/":
                        if (nextVal == "/" && i != line.length - 1) {
                            output = "//";
                            currToken = TokenType.ONE_LINE_COMMENT;
                        } else if (nextVal == "*") {
                            output = "/*";
                            currToken = TokenType.MULTILINE_COMMENT;
                        } else if (i != line.length - 1 && prevVal != "*") {
                            output = "/";
                            currToken = TokenType.DIVISION;
                        }
                        break;
                    case "^":
                        output = "^";
                        currToken = TokenType.EXPONENTIATION;
                        break;
                    case "(":
                        output = "(";
                        currToken = TokenType.BRACKET_OPEN;
                        break;
                    case ")":
                        output = ")";
                        currToken = TokenType.BRACKET_CLOSE;
                        break;
                    case "{":
                        output = "{";
                        currToken = TokenType.BRACE_OPEN;
                        break;
                    case "}":
                        output = "}";
                        currToken = TokenType.BRACE_CLOSE;
                        break;
                    case ".":
                        output = ".";
                        currToken = TokenType.POINT;
                        break;
                    case ",":
                        output = ",";
                        currToken = TokenType.COMMA;
                        break;
                    case ":":
                        output = ":";
                        currToken = TokenType.COLON;
                        break;
                    case ";":
                        output = ";";
                        currToken = TokenType.SEMICOLON;
                        break;
                    case "[":
                        output = "[";
                        currToken = TokenType.SQUARE_BRACKETS_OPEN;
                        break;
                    case "]":
                        output = "]";
                        currToken = TokenType.SQUARE_BRACKETS_CLOSE;
                        break;
                    case "<":
                        if (nextVal == "=") {
                            output = "<=";
                            currToken = TokenType.LESS_EQUAL;
                            i++;
                        } else {
                            output = "<";
                            currToken = TokenType.SMALLER;
                        }
                        break;
                    case ">":
                        if (nextVal == "=") {
                            output = ">=";
                            currToken = TokenType.MORE_EQUAL;
                            i++;
                        } else {
                            output = ">";
                            currToken = TokenType.MORE;
                        }
                        break;
                    case " ":
                        currToken = TokenType.SPACE;
                        break;
                    case "⊥":
                        output = "⊥";
                        currToken = TokenType.END;
                        break;
                    default:
                        if (currVal == '"') {
                            currToken = TokenType.STRING_PARAM;
                            let string: string = currVal;
                            while (nextVal != '"') {
                                i++;
                                if (i == line.length) {
                                    if (k++ < input.length) {
                                        line = input[k];
                                    }
                                    i = 0;
                                    lineCount++;
                                }
                                currVal = line.charAt(i);
                                nextVal = i < line.length - 1 ? line.charAt(i + 1) : currVal;
                                string += currVal;
                            }
                            output = string + '"';
                            i++;
                        } else if (Number.isInteger(parseInt(currVal))) {
                            let isInt = true;
                            let isDouble = false;
                            let isFloat = false;
                            let isOctal = true;
                            let isHex = false;
                            let isBinary = false;
                            output = currVal;
                            if (
                                currVal == "0" &&
                                (Number.isInteger(parseInt(nextVal)) ||
                                    nextVal == "b" ||
                                    nextVal == "B" ||
                                    nextVal == "x" ||
                                    nextVal == "X" ||
                                    nextVal == "A" ||
                                    nextVal == "C" ||
                                    nextVal == "D" ||
                                    nextVal == "E" ||
                                    nextVal == "F")
                            ) {
                                while (
                                    Number.isInteger(parseInt(currVal)) ||
                                    currVal == "b" ||
                                    currVal == "B" ||
                                    currVal == "x" ||
                                    currVal == "X" ||
                                    currVal == "A" ||
                                    currVal == "C" ||
                                    currVal == "D" ||
                                    currVal == "E" ||
                                    currVal == "F"
                                ) {
                                    if ((currVal == "B" || currVal == "b") && !isHex) {
                                        isBinary = true;
                                        isOctal = false;
                                    }
                                    if (currVal == "X" || currVal == "x") {
                                        isHex = true;
                                        isOctal = false;
                                    }
                                    if (
                                        isBinary &&
                                        currVal != "0" &&
                                        currVal != "1" &&
                                        currVal != "b" &&
                                        currVal != "B"
                                    ) {
                                        currToken = TokenType.ERROR;
                                        break;
                                    }
                                    if (isOctal && (currVal == "8" || currVal == "9")) {
                                        currToken = TokenType.ERROR;
                                        break;
                                    }
                                    if (
                                        isHex &&
                                        currVal != "x" &&
                                        currVal != "X" &&
                                        currVal != "B" &&
                                        currVal != "A" &&
                                        currVal != "C" &&
                                        currVal != "D" &&
                                        currVal != "E" &&
                                        currVal != "F" &&
                                        !Number.isInteger(parseInt(currVal))
                                    ) {
                                        currToken = TokenType.ERROR;
                                        break;
                                    }
                                    i++;
                                    if (i >= line.length) {
                                        break;
                                    }
                                    currVal = line.charAt(i);
                                    nextVal = i < line.length - 1 ? line.charAt(i + 1) : currVal;
                                    if (
                                        Number.isInteger(parseInt(currVal)) ||
                                        currVal == "b" ||
                                        currVal == "B" ||
                                        currVal == "x" ||
                                        currVal == "X" ||
                                        currVal == "A" ||
                                        currVal == "C" ||
                                        currVal == "D" ||
                                        currVal == "E" ||
                                        currVal == "F"
                                    ) {
                                        output += currVal;
                                    }
                                }
                                if (!Number.isInteger(parseInt(currVal))) {
                                    i--;
                                }
                                if (isBinary) {
                                    currToken = TokenType.BINARY;
                                } else if (isOctal) {
                                    currToken = TokenType.OCTAL;
                                } else if (isHex) {
                                    currToken = TokenType.HEX;
                                }
                            } else {
                                while (
                                    Number.isInteger(parseInt(currVal)) ||
                                    currVal == "." ||
                                    currVal == "E" ||
                                    currVal == "e" ||
                                    currVal == "-"
                                ) {
                                    if (currVal == ".") {
                                        isInt = false;
                                        isDouble = true;
                                    }
                                    if (currVal == "E" || currVal == "e") {
                                        isInt = false;
                                        isDouble = false;
                                        isFloat = true;
                                    }
                                    i++;
                                    currVal = line.charAt(i);
                                    nextVal = i < line.length - 1 ? line.charAt(i + 1) : currVal;
                                    if (
                                        Number.isInteger(parseInt(currVal)) ||
                                        currVal == "." ||
                                        currVal == "E" ||
                                        currVal == "e" ||
                                        currVal == "-"
                                    ) {
                                        output += currVal;
                                    }
                                }
                                if (!Number.isInteger(parseInt(currVal))) {
                                    i--;
                                }
                                if (isInt) {
                                    currToken = TokenType.INT_NUMBER;
                                } else if (isDouble) {
                                    currToken = TokenType.DOUBLE_NUMBER;
                                } else if (isFloat) {
                                    currToken = TokenType.FLOAT_NUMBER;
                                }
                            }
                        } else if (isLetter(currVal) || currVal == "_") {
                            let ident: string = "";
                            while (isLetter(currVal) || currVal == "_") {
                                if (isLetter(currVal) || currVal == "_" || Number.isInteger(parseInt(currVal))) {
                                    ident += currVal;
                                    i++;
                                    if (i >= line.length) {
                                        break;
                                    }
                                    currVal = line.charAt(i);
                                    nextVal = i < line.length - 1 ? line.charAt(i + 1) : currVal;
                                }
                            }
                            if (!isLetter(currVal) && currVal != "_" && !Number.isInteger(parseInt(currVal))) {
                                i--;
                            }
                            output = ident;
                            switch (ident) {
                                case "private":
                                    currToken = TokenType.PRIVATE;
                                    break;
                                case "public":
                                    currToken = TokenType.PUBLIC;
                                    break;
                                case "void":
                                    currToken = TokenType.VOID;
                                    break;
                                case "var":
                                    currToken = TokenType.VAR;
                                    break;
                                case "class":
                                    currToken = TokenType.CLASS;
                                    break;
                                case "int":
                                    currToken = TokenType.INT;
                                    break;
                                case "double":
                                    currToken = TokenType.DOUBLE;
                                    break;
                                case "bool":
                                    currToken = TokenType.BOOL;
                                    break;
                                case "char":
                                    currToken = TokenType.CHAR;
                                    break;
                                case "String":
                                    currToken = TokenType.STRING;
                                    break;
                                case "if":
                                    currToken = TokenType.IF;
                                    break;
                                case "else":
                                    currToken = TokenType.ELSE;
                                    break;
                                case "while":
                                    currToken = TokenType.WHILE;
                                    break;
                                case "for":
                                    currToken = TokenType.FOR;
                                    break;
                                case "read":
                                    currToken = TokenType.READ;
                                    break;
                                case "write":
                                    currToken = TokenType.WRITE;
                                    break;
                                default:
                                    currToken = TokenType.IDENTIFICATION;
                                    break;
                            }
                        } else {
                            currToken = TokenType.ERROR;
                        }
                        break;
                }

                if (equals(currToken, TokenType.ONE_LINE_COMMENT)) {
                    i = line.length;
                }

                if (equals(currToken, TokenType.MULTILINE_COMMENT)) {
                    while (currVal != "*" || nextVal != "/") {
                        i++;
                        if (i == line.length - 1) {
                            if (k++ < input.length) {
                                line = input[k];
                            }
                            i = 1;
                            lineCount++;
                        }
                        currVal = line.charAt(i);
                        nextVal = i < line.length - 1 ? line.charAt(i + 1) : currVal;
                    }
                }

                if (
                    !equals(currToken, TokenType.SPACE) &&
                    !equals(currToken, TokenType.ERROR) &&
                    !equals(currToken, TokenType.INIT)
                ) {
                    resultString.push(currToken.toString() + " " + output + " " + lineCount + " " + position);
                } else if (equals(currToken, TokenType.ERROR)) {
                    resultString.push(
                        currToken.toString() + " " + output + " in line " + lineCount + " position " + position,
                    );
                }
                i++;
            }
            lineCount++;

            result.push(...resultString);
        }

        return result;
    }
}

function isLetter(letter: string): boolean {
    const regex: RegExp = /^[A-Za-z]+$/;
    if (letter.match(regex)) {
        return true;
    }
    return false;
}

function equals(left: TokenType, right: TokenType): boolean {
    return left === right;
}
