import fs from "fs";
import { parser } from "./parser";
import { generator } from "./generator";
import { analyzer } from "./analyzer";
import { Grammars, Row } from "../common/common";
import { Lexer } from "lexer4js";

/*
<Z>-><S>
<S>-><S>+<T>
<S>-><T>
<S>->e
<T>-><T>*<A>
<T>-><A>
<A>->-<A>
<A>->(<S>)
<A>->55
<A>->identification
<A>->5.5
<A>->0xABC

<Z>-><S>
<S>-><S>a
<S>->e

<S>->real<idlist>
<idlist>-><idlist>,<id>
<idlist>-><id>
<id>->A

<E>-><T>+<T>
<T>-><F>*<F>
<F>->(<F>)
<F>->id
<F>->5

<E>-><E>+<T>
<E>-><T>
<T>-><T>*<F>
<T>-><F>
<F>->-<F>
<F>->(<E>)
<F>->id
<F>->5

<S>-><A><B><C>
<A>-><A>a
<A>->4
<B>-><B>b
<B>->+
<C>-><C>c
<C>->6

<S>-><A><B><C>
<A>->a
<A>->4
<B>->b
<B>->+
<C>->c
<C>->5

*/

const inputString: string = "-3.5+(-3*5+7+8)+a";

function main() {
    const lexer = new Lexer();
    const source = fs.readFileSync("./lexer.txt", "utf8");
    const tokensInput = lexer.tokenize(source);

    let input = fs.readFileSync("./inputSLR.txt", "utf-8").trim();
    const set: Grammars = parser.exec(input);
    const table: Row[] = generator.exec(set, tokensInput);
    const result = analyzer.exec(table, [inputString], set, tokensInput);
    console.log(result);
}

try {
    main();
} catch (error) {
    console.error(error);
}
