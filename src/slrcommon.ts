import { Literal } from "./common";

export interface Grammar {
    non_terminal: Literal;
    right_part: Literal[];
    elements: Literal[];
}
