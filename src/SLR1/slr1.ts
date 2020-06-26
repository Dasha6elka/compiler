import { END } from "../common/constants";
import { Grammar, Literal } from "../common/common";

const States = {
    OK: "OK",
    S: "S",
    R: "R",
};

export namespace slr1 {
    export function slr1(grammars: Grammar[]): void {
        const rows: Set<Literal[]> = new Set<Literal[]>();
        const columns: Literal[] = [];
        const result: Literal[][] = [];

        const non_terminals: Literal[] = [];

        columns.push(grammars[0].non_terminal);
        grammars.forEach(grammar => {
            grammar.right_part.forEach(literal => {
                columns.push(literal);
            });

            non_terminals.push(grammar.non_terminal);
        });
        columns.push(END);

        let shift_index: number = 2;

        rows.add([grammars[0].non_terminal]);

        let right_part_index = 0;

        let token: Literal = grammars[0].non_terminal;
        let next_token: Literal = "";

        let result_index = 0;
        grammars.forEach((grammar, grammar_index) => {
            if (token === grammar.non_terminal) {
                next_token = grammar.right_part[right_part_index];
                columns.forEach(column => {
                    if (next_token === column) {
                        result[result_index].push(`${States.S}${shift_index}`);
                        rows.add([next_token, grammar_index.toString(), right_part_index.toString()]);
                        result_index++;
                    } else {
                        result[result_index].push("");
                        result_index++;
                    }
                });
                right_part_index++;
                result_index = 0;

                token = next_token;
                next_token = grammar.right_part[right_part_index];
                columns.forEach(column => {
                    if (next_token === undefined && END === column) {
                        result[result_index].push(`${States.R}${grammar_index}`);
                        rows.add([next_token, grammar_index.toString(), right_part_index.toString()]);
                        result_index++;
                    } else if (!non_terminals.includes(next_token)) {
                        result[result_index].push(`${States.S}${shift_index}`);
                        result_index++;
                    } else {
                        while (non_terminals.includes(next_token)) {
                            grammars.forEach((gramm, idx) => {
                                if (gramm.non_terminal === next_token) {
                                    columns.forEach((col, i) => {
                                        if (col === gramm.right_part[0]) {
                                            result[result_index].push(`${States.S}${shift_index}`);
                                            rows.add([next_token, idx.toString(), i.toString()]);
                                            result_index++;
                                        }
                                    });
                                }
                                next_token = grammar.right_part[0];
                            });
                        }
                    }
                });
            }
        });

        // result_index = 0;
        // columns.forEach(column => {
        //     nextToken = grammars[0].right_part[1];
        //     if (nextToken == undefined && column === END) {
        //         non_terminals.forEach((non_terminal, index) => {
        //             if (non_terminal.includes(grammars[0].non_terminal)) {
        //                 result[result_index].push(`R${index}`);
        //             }
        //         })
        //     } else if (non_terminals.includes(nextToken)){
        //         grammars.forEach(grammar => {
        //             if (grammar.non_terminal === nextToken) {
        //                 grammar.right_part.forEach(value => {
        //                     if (value === nextToken) {

        //                     }
        //                 })
        //             }
        //         })
        //     }
        // });
    }
}
