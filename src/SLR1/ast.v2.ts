import graphviz, { Node as GrapNode } from "graphviz";
import { nanoid } from "nanoid";
import { map } from "lodash";

import acorn = require("acorn");

const walk = require("acorn-walk");

type AcornNode = Record<string, any> & acorn.Node;
type TreeFunctions = Record<string, (node: AcornNode, _: unknown, c: (node: AcornNode, _: unknown) => void) => void>;

export function createAst(text: string) {
    const source = text
        .replace(/int .+;/gm, "")
        .replace(/double .+;/gm, "")
        .replace(/boolean .+;/gm, "")
        .replace(/string .+;/gm, "")
        .replace(/;/g, " ");

    const g = graphviz.digraph("G");
    const addNode = makeAddNode(g);
    const stack: GrapNode[] = [];

    const ast = acorn.parse(source, { ecmaVersion: "latest" });
    walk.recursive(ast, undefined, {
        UnaryExpression: (node, _, c) => {
            let _root: GrapNode | undefined;
            if ((_root = stack.pop())) {
                const _operator = addNode(node.operator);

                if (isLiteral(node.argument)) {
                    const _argument = addNode(node.argument.value);
                    g.addEdge(_operator, _argument);
                }

                if (isBinaryOrUnaryExpression(node.argument)) {
                    stack.push(_operator);
                    c(node.argument, _);
                }

                g.addEdge(_root, _operator);
            }
        },

        BinaryExpression: (node, _, c) => {
            let _root: GrapNode | undefined;
            if ((_root = stack.pop())) {
                const _operator = addNode(node.operator);

                if (isLiteral(node.left)) {
                    const _left = addNode(node.left.value);
                    g.addEdge(_operator, _left);
                }

                if (isIdentifier(node.left)) {
                    const _left = addNode(node.left.name);
                    g.addEdge(_operator, _left);
                }

                if (isBinaryOrUnaryExpression(node.left)) {
                    stack.push(_operator);
                    c(node.left, _);
                }

                if (isLiteral(node.right)) {
                    const _right = addNode(node.right.value);
                    g.addEdge(_operator, _right);
                }

                if (isIdentifier(node.right)) {
                    const _right = addNode(node.right.name);
                    g.addEdge(_operator, _right);
                }

                if (isBinaryOrUnaryExpression(node.right)) {
                    stack.push(_operator);
                    c(node.right, _);
                }

                g.addEdge(_root, _operator);
            }
        },

        AssignmentExpression: (node, _, c) => {
            const _operator = addNode(node.operator);
            const _left = addNode(node.left.name);

            if (isBinaryOrUnaryExpression(node.right)) {
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

        ExpressionStatement: (node, _, c) => {
            if (isExpressionStatement(node)) {
                c(node.expression, _);
            } else {
                c(node, _);
            }
        },

        IfStatement: (node, _, c) => {
            const _if = addNode("if");
            const _test = addNode("test");

            if (isBinaryOrUnaryExpression(node.test)) {
                stack.push(_test);
                c(node.test, _);
            }

            g.addEdge(_if, _test);

            if (node.consequent != null) {
                const _then = addNode("then");
                g.addEdge(_if, _then);

                const body = node.consequent.body as AcornNode[];
                body.forEach(node => {
                    stack.push(_then);
                    c(node, _);
                });
            }

            if (node.alternate != null) {
                const _else = addNode("else");
                g.addEdge(_if, _else);

                const body = node.alternate.body as AcornNode[];
                body.forEach(node => {
                    stack.push(_else);
                    c(node, _);
                });
            }

            let _root: GrapNode | undefined;
            if ((_root = stack.pop())) {
                g.addEdge(_root, _if);
            }
        },

        WhileStatement: (node, _, c) => {
            const _while = addNode("while");
            const _test = addNode("test");

            if (isBinaryOrUnaryExpression(node.test)) {
                stack.push(_test);
                c(node.test, _);
            }

            g.addEdge(_while, _test);

            const _do = addNode("do");
            g.addEdge(_while, _do);

            const body = node.body.body as AcornNode[];
            const expressions = map(body, node => {
                if (isExpressionStatement(node)) {
                    return node.expression;
                }
                if (isWhileStatement(node) || isIfStatement(node)) {
                    return node;
                }
            }) as AcornNode[];

            expressions.forEach(node => {
                stack.push(_do);
                c(node, _);
            });

            let _root: GrapNode | undefined;
            if ((_root = stack.pop())) {
                g.addEdge(_root, _while);
            }
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

function isBinaryOrUnaryExpression(node: AcornNode): boolean {
    return node.type === "BinaryExpression" || node.type === "UnaryExpression";
}

function isIdentifier(node: AcornNode): boolean {
    return node.type === "Identifier";
}

function isExpressionStatement(node: AcornNode): boolean {
    return node.type === "ExpressionStatement";
}

function isWhileStatement(node: AcornNode): boolean {
    return node.type === "WhileStatement";
}

function isIfStatement(node: AcornNode): boolean {
    return node.type === "IfStatement";
}
