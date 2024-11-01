const doc_0_v2 = {
    watches: {
        date: (oldValue, newValue, state) => {
            console.log("date", oldValue, newValue, state);
        }
    },
    validators: {
        "client": "required",
        "problems": (value) => {
            return value.length > 0;
        },
    },
    pages: [
        {
            pdfPage: 1,
            components: [
                {
                    type: 'client',
                    name: "client"
                },
                {
                    location: "bottom",
                    type: 'date',
                    name: 'date',
                    className: "w-full",
                    label: "Kelt"
                }
            ]
        },
        {
            pdfPage: 1,
            components: [
                {
                    type: 'client',
                    name: "client",
                    small: true
                },
                {
                    name: "biztositochk",
                    type: "checkbox",
                    label: "Biztosítók",
                    options: [
                        "Alfa",
                        "Allianz",
                        "CIG-Pannónia",
                        "Colonnade",
                        "D.A.S",
                        "EUB",
                        "Generali",
                        "Genertel",
                        "Grawe",
                        "Groupama",
                        "HDI",
                        "KÖBE",
                        "K&H",
                        "MetLife",
                        "Magyar Posta",
                        "MAPFRE",
                        "NN",
                        "Signal-Iduna",
                        "Union",
                        "Uniqa",
                        "Gránit",
                        "OH VVaG"
                    ],
                    columns: 2,
                    selectAll: "Mindegyik kijelölése",
                }
            ]
        },
        {
            pdfPage: 1,
            components: [
                {
                    type: 'client',
                    name: "client",
                    small: true
                },
                {
                    name: "modozatchk",
                    type: "checkbox",
                    label: "Módozatok",
                    options: [
                        "Befektetési egység",
                        "Hagyományos életbizt.",
                        "Kockázati életbizt",
                        "Egyéni egyészség-baleset",
                        "Szolgáltatás finanszírozói",
                        "Csop. egészség-baleset",
                        "Utasbizt.",
                        "Lakásbizt.",
                        "Társasházbizt.",
                        "Gépjárműbizt.",
                        "Jogvédelem",
                        "Vállalkozói vagyon",
                        "Felelősségbizt.",
                        "Szakmai felelősségbizt.",
                        "Technikai bizt.",
                        "Szállítmánybizt.",
                        "Egyedi vagyonbizt.",
                        "Mezőgazdasági bizt.",
                        "ÖNYP, EP"
                    ],
                    columns: 2,
                    selectAll: "Mindegyik kijelölése",
                    custom: "Egyéb"
                }
            ]
        },
        {
            pdfPage: 1,
            components: [
                {
                    type: 'client',
                    name: "client",
                    small: true
                },
                {
                    type: "stringlist",
                    name: "problems",
                    label: "Tanácsadásra váró problémák",
                    placeholder: "Igény",
                    maxLines: 4
                },
                {
                    type: "file",
                    name: "file",
                    location: "bottom"
                }
            ]
        }
    ],
    defaults: {
        biztositochk: {mask:0},
        modozatchk: {mask:0},
    }
}

const document = {
    type: 0,
    version: 2,
    name: "1. számú alkuszi megbízás",
    doc: doc_0_v2,
    pdf: "1_szamu_alkuszi_megbizas.pdf",
    validFrom: "2024.03.14"
}

import pg from 'pg';
const {Client} = pg;
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'alkepro',
    password: 'password',
    port: 5432,
})
await client.connect();



await client.query('DELETE FROM descriptors.fields')
await client.query('DELETE FROM descriptors.field_types')
await client.query('DELETE FROM descriptors.pages')
await client.query('DELETE FROM descriptors.validators')
await client.query('DELETE FROM descriptors.watches')
await client.query('DELETE FROM descriptors.documents')

let query = 'INSERT INTO descriptors.documents (name, pdf_path, type, validfrom) VALUES ($1, $2, $3, $4) RETURNING id';
let res = await client.query(query, [document.name, document.pdf, document.type, document.validFrom]);
const docId = res.rows[0].id;

for (let i = 0; i < document.doc.pages.length; i++) {
    const page = document.doc.pages[i];

    const ids = await insertFields(page.components, i);


    query = 'INSERT INTO descriptors.pages (document_id, num_order, children, pdf_page, version) VALUES ($1, $2, $3, $4, $5) RETURNING id';
    res = await client.query(query, [docId, i, ids, page.pdfPage, document.version]);
}

query = 'INSERT INTO descriptors.validators (document_id, validator, version) VALUES ($1, $2, $3)';
res = await client.query(query, [docId, serialize(document.doc.validators), document.version]);

query = 'INSERT INTO descriptors.watches (document_id, watch, version) VALUES ($1, $2, $3)';
res = await client.query(query, [docId, serialize(document.doc.watches), document.version]);

async function insertFields(fields, p) {
    const ids = []
    for (let j = 0; j < fields.length; j++) {
        const field = fields[j];
        res = await client.query('SELECT id from descriptors.field_types WHERE type = $1', [field.type]);
        if (res.rows.length === 0) {
            res = await client.query('INSERT INTO descriptors.field_types (type) VALUES ($1) RETURNING id', [field.type]);
        }
        const fieldTypeId = res.rows[0].id;

        query = "INSERT INTO descriptors.fields (document_id, key, type, name, children, default_value, metadata, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id";
        res = await client.query(query, [docId, field.name + "-" + p, fieldTypeId, serialize(field.name), field.components ? insertFields(field.components) : null, doc_0_v2.defaults[field.name], serialize(field), document.version]);
        ids.push(res.rows[0].id);
    }
    return ids;
}

function serialize(obj) {
    if(typeof obj !== 'object') return obj;
    return JSON.stringify(obj, function(key, value) {
        if (typeof value === 'function') {
            return value.toString();
        }
        return value;}
    )
}


await client.end();