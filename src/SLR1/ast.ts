import graphviz, { Node } from "graphviz";
import { infixToPostfix } from "./postfix";
import { nanoid } from "nanoid";
import { escapeRegExp } from "lodash";

interface ExtendedNode extends Node {
    operator: boolean;
}

/** @deprecated */
export function createAst(text: string) {
    let source = text
        .replace(/int .+;/gm, "")
        .replace(/double .+;/gm, "")
        .replace(/boolean .+;/gm, "")
        .replace(/string .+;/gm, "")
        .replace(/;/g, " ");

    let match: RegExpMatchArray | null = null;
    while ((match = source.match(/(?<=\s|\()-(([0-9]\.?([0-9]+)?)|[a-z]|\(.*\))/))) {
        const exp = match[0];
        const regexp = new RegExp(escapeRegExp(exp), "m");
        const replacement = `(0${exp})`;
        source = source.replace(regexp, replacement);
    }

    const filtered = ["\n", "{", "}"];
    const postfix = infixToPostfix(source).filter(token => !filtered.includes(token));

    const stack: ExtendedNode[] = [];

    const g = graphviz.digraph("G");

    function addNode(id: string, options: { operator: boolean }): ExtendedNode {
        const node = g.addNode(`${id}\n${nanoid(4)}`) as ExtendedNode;
        node.operator = options.operator;
        return node;
    }

    const reservedWords = ["if", "while"];

    postfix.forEach(token => {
        function testNonOp(value: string) {
            return value && /\w/.test(value) && !reservedWords.includes(value);
        }

        if (testNonOp(token)) {
            const node = addNode(token, { operator: false });
            stack.push(node);
        } else {
            const head = addNode(token, { operator: true });

            const left = stack.pop()!;
            const right = stack.pop()!;

            g.addEdge(head, left);
            g.addEdge(head, right);

            stack.push(head);
        }
    });

    console.log(postfix.join(" "));

    g.output("png", "graph.png", (_, stdout, stderr) => {
        process.stdout.write(stdout);
        process.stderr.write(stderr);
    });

    return postfix;
}
