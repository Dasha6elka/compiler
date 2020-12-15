export interface Symbol {
    name: string;
    type: string; // int double boolean
    value: string | undefined;
}

export class SymbolsTable {
    table: Symbol[] = [];

    create(): Symbol[] {
        return this.table;
    }

    addSymbol(name: string, type: string, value: string | undefined) {
        this.table.push({
            name,
            type,
            value,
        });
    }

    update(name: string, value: string | undefined) {
        this.table.map(row => {
            if (row.name === name) {
                row.value = value;
            }
        });
    }

    delete() {
        this.table = [];
    }

    getType(name: string): string {
        return this.table.find(x => (x.name === name))?.type!;
    }

    getValue(name: string): string {
        return this.table.find(x => (x.name === name))?.value!;
    }

    isHas(name: string, type: string): boolean {
        let same = false;
        this.table.forEach(row => {
            if (row.name === name && row.type === type) {
                same = true;
            }
        });

        return same;
    }
}
