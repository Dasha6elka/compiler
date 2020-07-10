import { CellValue, Grammar, Row } from "../common/common";
import { END } from "../common/constants";
import { generator } from "./generator";
import _ from "lodash";

describe("generator", () => {
    const LITERALS = {
        IDLIST: "idlist",
        ID: "id",
        REAL: "real",
        A: "A",
        S: "S",
        R: "R",
        COMMA: ",",
        OK: "OK",
    };

    const grammars: Grammar[] = [
        {
            nonTerminal: LITERALS.S,
            rightPart: [LITERALS.REAL, LITERALS.IDLIST],
            elements: [LITERALS.REAL],
        },
        {
            nonTerminal: LITERALS.IDLIST,
            rightPart: [LITERALS.IDLIST, LITERALS.COMMA, LITERALS.ID],
            elements: [LITERALS.IDLIST, LITERALS.ID, LITERALS.A],
        },
        {
            nonTerminal: LITERALS.IDLIST,
            rightPart: [LITERALS.ID],
            elements: [LITERALS.ID, LITERALS.A],
        },
        {
            nonTerminal: LITERALS.ID,
            rightPart: [LITERALS.A],
            elements: [LITERALS.A],
        },
    ];

    it("should success table return", () => {
        const expected: Row[] = [];

        const actual: Row[] = generator.exec(grammars);

        expected.push(
            {
                row: LITERALS.S,
                value: [
                    {
                        column: LITERALS.S,
                        value: LITERALS.OK,
                    },
                    {
                        column: LITERALS.REAL,
                        value: {
                            index: 1,
                            value: LITERALS.S,
                        },
                    },
                ],
            },
            {
                row: {
                    grammarIndex: 0,
                    positionIndex: 0,
                    value: LITERALS.REAL,
                },
                value: [
                    {
                        column: LITERALS.IDLIST,
                        value: {
                            index: 4,
                            value: LITERALS.S,
                        },
                    },
                    {
                        column: LITERALS.ID,
                        value: {
                            index: 3,
                            value: LITERALS.S,
                        },
                    },
                    {
                        column: LITERALS.A,
                        value: {
                            index: 2,
                            value: LITERALS.S,
                        },
                    },
                ],
            },
            {
                row: {
                    grammarIndex: 3,
                    positionIndex: 0,
                    value: LITERALS.A,
                },
                value: [
                    {
                        column: END,
                        value: {
                            index: 3,
                            value: LITERALS.R,
                        },
                    },
                    {
                        column: LITERALS.COMMA,
                        value: {
                            index: 3,
                            value: LITERALS.R,
                        },
                    },
                ],
            },
            {
                row: {
                    grammarIndex: 2,
                    positionIndex: 0,
                    value: LITERALS.ID,
                },
                value: [
                    {
                        column: END,
                        value: {
                            index: 2,
                            value: LITERALS.R,
                        },
                    },
                    {
                        column: LITERALS.COMMA,
                        value: {
                            index: 2,
                            value: LITERALS.R,
                        },
                    },
                ],
            },
            {
                row: {
                    grammarIndex: 0,
                    positionIndex: 1,
                    value: LITERALS.IDLIST,
                },
                value: [
                    {
                        column: END,
                        value: {
                            index: 0,
                            value: LITERALS.R,
                        },
                    },
                    {
                        column: LITERALS.COMMA,
                        value: {
                            index: 5,
                            value: LITERALS.S,
                        },
                    },
                ],
            },
            {
                row: {
                    grammarIndex: 1,
                    positionIndex: 1,
                    value: LITERALS.COMMA,
                },
                value: [
                    {
                        column: LITERALS.ID,
                        value: {
                            index: 6,
                            value: LITERALS.S,
                        },
                    },
                    {
                        column: LITERALS.A,
                        value: {
                            index: 2,
                            value: LITERALS.S,
                        },
                    },
                ],
            },
            {
                row: {
                    grammarIndex: 1,
                    positionIndex: 2,
                    value: LITERALS.ID,
                },
                value: [
                    {
                        column: END,
                        value: {
                            index: 1,
                            value: LITERALS.R,
                        },
                    },
                    {
                        column: LITERALS.COMMA,
                        value: {
                            index: 1,
                            value: LITERALS.R,
                        },
                    },
                ],
            },
        );

        for (let i = 0; i < expected.length; i++) {
            if (_.isString(expected[i].row)) {
                expect(expected[i].row).toEqual(actual[i].row);
            }

            expect(expected.length).toEqual(actual.length);
        }
    });
});
