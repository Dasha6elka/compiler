import { lexer } from ".";

describe("lexer", () => {
    it("should pass", () => {
        let actual: string[] = [];
        actual = lexer.main("./test.txt", actual);
        const expected: string[] = [];

        expected.push("CLASS class 1 1");
        expected.push("IDENTIFICATION Foo 1 7");
        expected.push("BRACE_OPEN { 1 11");
        expected.push("PRIVATE private 2 5");
        expected.push("DOUBLE double 2 13");
        expected.push("IDENTIFICATION small 2 20");
        expected.push("ASSIGNMENT = 2 26");
        expected.push("MINUS - 2 28");
        expected.push("FLOAT_NUMBER 4.70e-9 2 29");
        expected.push("SEMICOLON ; 2 36");
        expected.push("ONE_LINE_COMMENT // 2 38");
        expected.push("PRIVATE private 3 5");
        expected.push("STRING String 3 13");
        expected.push("IDENTIFICATION message 3 20");
        expected.push("ASSIGNMENT = 3 28");
        expected.push(`STRING_PARAM "Foo >> " 3 30`);
        expected.push("SEMICOLON ; 3 39");
        expected.push("PRIVATE private 4 5");
        expected.push("INT int 4 13");
        expected.push("IDENTIFICATION hex 4 17");
        expected.push("ASSIGNMENT = 4 21");
        expected.push("HEX 0x0A0B0C 4 23");
        expected.push("SEMICOLON ; 4 31");
        expected.push("MULTILINE_COMMENT /* 7 5");
        expected.push("BRACE_CLOSE } 8 1");

        expect(expected).toEqual(actual);
    });
});
