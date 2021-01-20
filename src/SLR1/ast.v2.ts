import graphviz, { Node as GrapNode } from "graphviz";
import { nanoid } from "nanoid";
import { escapeRegExp, map } from "lodash";

import acorn = require("acorn");

const walk = require("acorn-walk");

type AcornNode = Record<string, any> & acorn.Node;
type TreeFunctions = Record<string, (node: AcornNode, _: unknown, c: (node: AcornNode, _: unknown) => void) => void>;

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

    const g = graphviz.digraph("G");
    const addNode = makeAddNode(g);
    const stack: GrapNode[] = [];

    const ast = acorn.parse(source, { ecmaVersion: "latest" });
    walk.recursive(ast, undefined, {
        BinaryExpression: (node, _, c) => {
            let _root: GrapNode | undefined;
            if ((_root = stack.pop())) {
                const _operator = addNode(node.operator);

                if (isLiteral(node.left)) {
                    const _left = addNode(node.left.value);
                    g.addEdge(_operator, _left);
                }

                if (isLiteral(node.right)) {
                    const _right = addNode(node.right.value);
                    g.addEdge(_operator, _right);
                }

                if (isIdentifier(node.left)) {
                    const _left = addNode(node.left.name);
                    g.addEdge(_operator, _left);
                }

                if (isIdentifier(node.right)) {
                    const _right = addNode(node.right.name);
                    g.addEdge(_operator, _right);
                }

                if (isBinaryExpression(node.left)) {
                    stack.push(_operator);
                    c(node.left, _);
                }

                if (isBinaryExpression(node.right)) {
                    stack.push(_operator);
                    c(node.right, _);
                }

                g.addEdge(_root, _operator);
            }
        },

        AssignmentExpression: (node, _, c) => {
            const _operator = addNode(node.operator);
            const _left = addNode(node.left.name);

            if (isBinaryExpression(node.right)) {
                stack.push(_operator);
                c(node.right, _);
            } else if (isLiteral(node.right)) {
                const _right = addNode(node.right.value);
                g.addEdge(_operator, _right);
            }

            g.addEdge(_operator, _left);

            let _root: GrapNode | undefined;
            if ((_root = stack.pop())) {
                g.addEdge(_root, _operator);
            }
        },

        IfStatement: (node, _, c) => {
            const test = node.test as AcornNode;

            const _if = addNode("if");
            const _then = addNode("then");
            const _else = addNode("else");

            const _test = addNode(test.operator);
            const _left = addNode(test.left.name);
            const _right = addNode(test.right.raw);

            g.addEdge(_test, _left);
            g.addEdge(_test, _right);

            g.addEdge(_if, _test);
            g.addEdge(_if, _then);
            g.addEdge(_if, _else);

            {
                const body = node.consequent.body as AcornNode[];
                const expressions = map(body, "expression") as AcornNode[];

                expressions.forEach(node => {
                    stack.push(_then);
                    c(node, _);
                });
            }

            {
                const body = node.alternate.body as AcornNode[];
                const expressions = map(body, "expression") as AcornNode[];

                expressions.forEach(node => {
                    stack.push(_else);
                    c(node, _);
                });
            }
        },

        WhileStatement: (node, _, c) => {
            const test = node.test as AcornNode;

            const _while = addNode("while");
            const _do = addNode("do");

            const _test = addNode(test.operator);
            const _left = addNode(test.left.name);
            const _right = addNode(test.right.raw);

            g.addEdge(_test, _left);
            g.addEdge(_test, _right);

            g.addEdge(_while, _test);
            g.addEdge(_while, _do);

            const body = node.body.body as AcornNode[];
            const expressions = map(body, "expression") as AcornNode[];

            expressions.forEach(node => {
                stack.push(_do);
                c(node, _);
            });
        },
    } as TreeFunctions);

    g.output("png", "graph.png", (_, stdout, stderr) => {
        process.stdout.write(stdout);
        process.stderr.write(stderr);
    });
}

function makeAddNode(g: graphviz.Graph) {
    return function addNode(id: string): GrapNode {
        return g.addNode(`${id}\n${nanoid(4)}`);
    };
}

function isLiteral(node: AcornNode): boolean {
    return node.type === "Literal";
}

function isBinaryExpression(node: AcornNode): boolean {
    return node.type === "BinaryExpression";
}

function isIdentifier(node: AcornNode): boolean {
    return node.type === "Identifier";
}
