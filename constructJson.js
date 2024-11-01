import pg from 'pg';

const {Client} = pg;


export default async function constructJson(data) {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'alkepro',
        password: 'password',
        port: 5432,
    })
    await client.connect();
    const query = 'SELECT * FROM descriptors.documents';
    const docs = await client.query(query);
    const documents = [];
    for (let i = 0; i < docs.rows.length; i++) {
        const doc = docs.rows[i];
        const [pages, defaults] = await getPages(doc.id);
        const validators = await getValidators(doc.id);
        const watches = await getWatches(doc.id);
        documents.push({
            name: doc.name,
            pdf: doc.pdf_path,
            type: doc.type,
            validFrom: doc.validfrom,
            version: doc.version,
            doc: {
                pages,
                validators,
                watches,
                defaults
            }
        });
    }
    return JSON.stringify(documents);


    async function getPages(docId) {
        const query = 'SELECT * FROM descriptors.pages WHERE document_id = $1';
        const pages = await client.query(query, [docId]);
        const pageArray = [];
        const defaults = {};
        for (let i = 0; i < pages.rows.length; i++) {
            const page = pages.rows[i];

            const [fields, d] = await getFields(page.children);
            for (const key in d) {
                defaults[key] = d[key];
            }


            pageArray.push({
                pdfPage: page.pdf_page,
                components: fields
            });
        }
        return [pageArray, defaults];

    }

    async function getFields(fieldIds) {
        const fields = [];
        const defaults = {};
        for (let i = 0; i < fieldIds.length; i++) {
            const query = 'SELECT * FROM descriptors.fields WHERE id = $1';
            const field = await client.query(query, [fieldIds[i]]);
            const f = field.rows[0];
            const components = f.children ? await getFields(f.children) : null;
            fields.push({
                name: f.name,
                type: f.type,
                components,
                metadata: f.metadata
            })
            if(f.default_value)
                defaults[f.name] = f.default_value
        }
        return [fields, defaults];
    }

    async function getValidators(docId) {
        const query = 'SELECT * FROM descriptors.validators WHERE document_id = $1';
        const validators = await client.query(query, [docId]);
        return validators.rows.length === 0 ? null : validators.rows[0].validator;
    }

    async function getWatches(docId) {
        const query = 'SELECT * FROM descriptors.watches WHERE document_id = $1';
        const watches = await client.query(query, [docId]);
        return watches.rows.length === 0 ? null : watches.rows[0].watch;
    }

}