export function Schemas() {
    this.schemas = [];

    this.loadFromLocalStorage = () => {
        if (localStorage.schemas) {
            // load schemas in localStorge
            let json = JSON.parse(localStorage.schemas);
            this.splice(0, this.length);
            json.forEach(schema => this.push(Object.assign(new Schema(), schema)));
        }
    }
}
Schemas.prototype = Object.create(Array.prototype);
Schemas.prototype.constructor = Schemas;

export function Schema() {
    this.name = '';
    this.userid = '';
    this.password = '';
    this.dbname = '';
    this.role = '';
    this.tables = new SchemaObject('tables', 'SELECT TABLE_NAME FROM USER_TABLES');
    this.views = new SchemaObject('views', 'SELECT VIEW_NAME FROM USER_VIEWS');
    this.indexes = new SchemaObject('indexes', 'SELECT INDEX_NAME FROM USER_INDEXES');

    this.objects = [
            ['tables', this.tables],
            ['views', this.views],
            ['indexes', this.indexes]
        ];

}

export function SchemaObject(name, selectSql) {
    this.name = name;
    this.selectSql = selectSql;
}
SchemaObject.prototype = Object.create(Array.prototype);
SchemaObject.prototype.constructor = SchemaObject;
