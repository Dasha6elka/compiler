export type Literal = string;

export type Pointer = number | null;

export type LiteralSet = Set<string>;

export interface LiteralOption {
    rule: Literal;
    first: LiteralSet;
    grammar: LiteralSet;
}

export interface Grammar {
    nonTerminal: Literal;
    rightPart: Literal[];
    elements: Literal[];
}

export const State = {
    OK: "OK",
    S: "S",
    R: "R",
};

export interface Row {
    value: Cell[];
    row: CellValue | string;
}

export interface Cell {
    value: any;
    column: string;
}

export interface CellValue {
    value: string;
    grammarIndex: number;
    positionIndex: number;
}

export interface Act {
    value: string;
    index: number;
}

export type LiteralOptions = Set<LiteralOption>;

export type Grammars = Grammar[];

export interface LiteralToken {
    rule: Literal;
    first: LiteralSet;
    pointer: Pointer;
    offset: boolean;
    error: boolean;
    stack: boolean;
    end: boolean;
}

export type TokenTable = Map<number, LiteralToken>;

export type LiteralTable = Map<Literal, LiteralSet>;

export type Stack<T> = T[];

export enum SymbolType {
    Terminal,
    Empty,
    Nonterminal,
}

export interface InputToken {
    visit(table: TokenTable, tokensLexer: string[]): void;
}

export class LiteralIterator implements Iterator<Literal> {
    private index = 0;
    private readonly length: number;
    private readonly it: Iterator<Literal>;

    constructor(private readonly literals: Literal[]) {
        this.it = literals[Symbol.iterator]();
        this.length = literals.length;
    }

    next(): IteratorResult<Literal> {
        return {
            value: this.it.next().value,
            done: this.index++ === this.length - 1,
        };
    }
}

export interface RightLiteralOption {
    set: LiteralSet;
    type: SymbolType;
    last: boolean;
    end: boolean;
}

export interface GrammarValue {
    literal: Literal;
    options: RightLiteralOption;
}

export interface RuleValue {
    literal: Literal;
    set: LiteralSet;
    last: boolean;
}
