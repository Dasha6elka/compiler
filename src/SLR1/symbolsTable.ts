export interface Symbol {
    name: string;
    type: string; // int double boolean
}

export class SymbolsTable {
    table: Symbol[] = [];

    create(): Symbol[] {
        return this.table;
    }

    addSymbol(name: string, type: string) {
        this.table.push({
            name,
            type,
        });
    }

    delete() {
        this.table = [];
    }

    info(name: string): string{
        return this.table.find(x => x.name = name)?.type!;
    }

    isHas(name: string, type: string): boolean {
        let same = false;
        this.table.forEach(row => {
            if (row.name === name && row.type === type) {
                same = true;
            }
        })

        return same;
    }
}
