/**
 * Operator precedence mapping.
 */
const PRECEDENCE: Record<string, number> = {
    "if": 10,
    "while": 10,
    "(": 9,
    "!": 8,
    "*": 7,
    "/": 7,
    "%": 7,
    "+": 6,
    "-": 6,
    "<": 5,
    "<=": 5,
    ">": 5,
    ">=": 5,
    "==": 4,
    "!=": 4,
    "&&": 3,
    "||": 2,
    "?": 1,
    "=": 0,
    "\n": 0,
    "}": 0,
    "{": 0,
};

/**
 * Characters which signal pair opening, to be terminated by terminators.
 */
const OPENERS: string[] = ["(", "?", "if", "while"];

/**
 * Characters which signal pair termination, the value an array with the
 * opener as its first member. The second member is an optional operator
 * replacement to push to the stack.
 */
const TERMINATORS: Record<string, string[]> = {
    ")": ["("],
    ":": ["?"],
};

/**
 * Pattern matching operators and openers.
 *
 * @type {RegExp}
 */
const PATTERN: RegExp = /<=|>=|==|!=|&&|\|\||\(|!|\*|\/|%|\+|-|<|>|\?|\)|:|if|while|}|{|\n|=/;

/**
 * Given a C expression, returns the equivalent postfix (Reverse Polish)
 * notation terms as an array.
 *
 * If a postfix string is desired, simply `.join( ' ' )` the result.
 *
 * @example
 *
 * ```js
 * import postfix from '@tannin/postfix';
 *
 * postfix( 'n > 1' );
 * // ⇒ [ 'n', '1', '>' ]
 * ```
 */
export function infixToPostfix(expression: string): string[] {
    let terms: string[] = [];
    let stack: string[] = [];

    let match: RegExpMatchArray | null = null;
    let operator: string | undefined;
    let term: string | undefined;
    let element: string | undefined;

    while ((match = expression.match(PATTERN))) {
        operator = match[0];

        // Term is the string preceding the operator match. It may contain
        // whitespace, and may be empty (if operator is at beginning).
        term = expression.substr(0, match.index).trim();
        if (term) {
            terms.push(term);
        }

        while ((element = stack.pop())) {
            if (TERMINATORS[operator]) {
                if (TERMINATORS[operator][0] === element) {
                    // Substitution works here under assumption that because
                    // the assigned operator will no longer be a terminator, it
                    // will be pushed to the stack during the condition below.
                    operator = TERMINATORS[operator][1] || operator;
                    break;
                }
            } else if (OPENERS.indexOf(element) >= 0 || PRECEDENCE[element] < PRECEDENCE[operator]) {
                // Push to stack if either an opener or when pop reveals an
                // element of lower precedence.
                stack.push(element);
                break;
            }

            // For each popped from stack, push to terms.
            terms.push(element);
        }

        if (!TERMINATORS[operator]) {
            stack.push(operator);
        }

        // Slice matched fragment from expression to continue match.
        expression = expression.substr(match.index! + operator.length);
    }

    // Push remainder of operand, if exists, to terms.
    expression = expression.trim();
    if (expression) {
        terms.push(expression);
    }

    // Pop remaining items from stack into terms.
    return terms.concat(stack.reverse());
}
