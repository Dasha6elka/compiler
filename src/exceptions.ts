export namespace exceptions {
    export namespace analyzer {
        export class EmptyStackException extends Error {}

        export class IncorrectSequenceOrderException extends Error {}
    }

    export namespace generator {
        export class LeftTokenNotFound extends Error {}
    }
}
