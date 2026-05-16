const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { encrypt, decrypt } = require('./cryptoUtils');

// En Railway, usaremos una carpeta persistente montada en /app/database
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'database', 'pld_contable.db');

// Asegurar que el directorio existe
if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// --- Inicialización Multi-Usuario ---
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Función auxiliar para añadir columnas si no existen
function addUserIdColumn(tableName) {
    try {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN user_id TEXT`);
        console.log(`Columna user_id añadida a ${tableName}`);
    } catch (e) {
        // Probablemente ya existe
    }
}

// Asegurar que las tablas principales tengan user_id
['workspaces', 'purchases', 'sales', 'journal', 'honorarios', 'entities', 'costs', 'maintenance', 'movimientos_data', 'asientos', 'products', 'inventory_movements', 'cash_movements', 'fixed_assets', 'employees', 'balance_inicial'].forEach(addUserIdColumn);

const dbManager = {
    // --- Gestión de Usuarios ---
    createUser: (u) => {
        const stmt = db.prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)');
        return stmt.run(u.id, u.email, u.password, u.name);
    },

    getUserByEmail: (email) => {
        return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    },

    // --- Gestión de Workspaces (Filtrado por Usuario) ---
    getWorkspaces: (userId) => {
        const rows = db.prepare('SELECT * FROM workspaces WHERE user_id = ?').all(userId);
        return rows.map(r => ({
            ...r,
            sol_user: decrypt(r.sol_user),
            sol_pass: decrypt(r.sol_pass),
            sunatClientId: decrypt(r.sunatClientId),
            sunatClientSecret: decrypt(r.sunatClientSecret)
        }));
    },

    saveWorkspace: (w, userId) => {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO workspaces 
            (ruc, name, regimenTributario, location, address, support, period, logoBase64, sol_user, sol_pass, sunatClientId, sunatClientSecret, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            w.ruc, w.name, w.regimenTributario, w.location, w.address,
            w.support, w.period, w.logoBase64,
            encrypt(w.sol_user), encrypt(w.sol_pass),
            encrypt(w.sunatClientId), encrypt(w.sunatClientSecret),
            userId
        );
    },

    deleteWorkspace: (ruc, userId) => {
        db.prepare('DELETE FROM workspaces WHERE ruc = ? AND user_id = ?').run(ruc, userId);
    },

    getWorkspaceData: (ruc, userId) => {
        const wsInfo = db.prepare('SELECT * FROM workspaces WHERE ruc = ? AND user_id = ?').get(ruc, userId);
        if (!wsInfo) return null;

        const purchases = db.prepare('SELECT * FROM purchases WHERE workspace_id = ? AND user_id = ?').all(ruc, userId);
        const sales = db.prepare('SELECT * FROM sales WHERE workspace_id = ? AND user_id = ?').all(ruc, userId);
        const journal = db.prepare('SELECT * FROM journal WHERE workspace_id = ? AND user_id = ?').all(ruc, userId);
        const honorarios = db.prepare('SELECT * FROM honorarios WHERE workspace_id = ? AND user_id = ?').all(ruc, userId);
        const entities = db.prepare('SELECT * FROM entities WHERE workspace_id = ? AND user_id = ?').all(ruc, userId);
        const plan = db.prepare('SELECT * FROM plan_global').all();
        const costs = db.prepare('SELECT * FROM costs WHERE workspace_id = ? AND user_id = ?').all(ruc, userId);
        const maintenance = db.prepare('SELECT * FROM maintenance WHERE workspace_id = ? AND user_id = ?').all(ruc, userId);
        const movimientosData = db.prepare('SELECT * FROM movimientos_data WHERE workspace_id = ? AND user_id = ?').all(ruc, userId);
        const asientos = db.prepare('SELECT * FROM asientos WHERE workspace_id = ? AND user_id = ?').all(ruc, userId).map(a => ({
            ...a,
            header: JSON.parse(a.header_json),
            lines: JSON.parse(a.lines_json)
        }));
        const glosasHabituales = db.prepare('SELECT * FROM glosas_habituales WHERE workspace_id = ? AND user_id = ?').all(ruc, userId).map(g => ({
            ...g,
            lines: JSON.parse(g.lines_json)
        }));
        const products = db.prepare('SELECT * FROM products WHERE workspace_id = ? AND user_id = ?').all(ruc, userId);
        const inventoryMovements = db.prepare('SELECT * FROM inventory_movements WHERE workspace_id = ? AND user_id = ?').all(ruc, userId);
        const cashMovements = db.prepare('SELECT * FROM cash_movements WHERE workspace_id = ? AND user_id = ?').all(ruc, userId);
        const fixedAssets = db.prepare('SELECT * FROM fixed_assets WHERE workspace_id = ? AND user_id = ?').all(ruc, userId);
        const employees = db.prepare('SELECT * FROM employees WHERE workspace_id = ? AND user_id = ?').all(ruc, userId);
        const balanceInicial = db.prepare('SELECT * FROM balance_inicial WHERE workspace_id = ? AND user_id = ?').all(ruc, userId);

        return {
            currentCompany: {
                ...wsInfo,
                sol_user: decrypt(wsInfo.sol_user),
                sol_pass: decrypt(wsInfo.sol_pass),
                sunatClientId: decrypt(wsInfo.sunatClientId),
                sunatClientSecret: decrypt(wsInfo.sunatClientSecret)
            },
            purchases, sales, journal, honorarios, entities, plan, costs,
            maintenanceRecords: maintenance,
            movimientosData,
            asientos,
            glosasHabituales,
            products,
            inventoryMovements,
            cashMovements,
            fixedAssets,
            employees,
            balanceInicial
        };
    },

    run: (sql, params = []) => db.prepare(sql).run(...params),
    queryAll: (sql, params = []) => db.prepare(sql).all(...params),
    
    saveSirePurchases: (ruc, records, userId) => {
        const insert = db.prepare(`
            INSERT OR REPLACE INTO purchases 
            (id, workspace_id, registro, fecha, fecVcto, tipo_doc, serie, numero, doc_tipo, doc_num, nombre, tc, bi, igv, noGravada, isc, icbper, otros_tributos, total, car, estado_sire, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const transaction = db.transaction((recs) => {
            for (const r of recs) {
                insert.run(r.id, ruc, r.registro, r.fecha, r.fecVcto, r.tipo_doc, r.serie, r.numero, r.doc_tipo, r.doc_num, r.nombre, r.tc, r.bi, r.igv, r.noGravada, r.isc, r.icbper, r.otros_tributos, r.total, r.car, r.estado_sire, userId);
            }
        });
        transaction(records);
    },

    saveSireSales: (ruc, records, userId) => {
        const insert = db.prepare(`
            INSERT OR REPLACE INTO sales 
            (id, workspace_id, registro, fecha, fecVcto, tipo_doc, serie, numero, doc_tipo, doc_num, nombre, tc, bi, igv, noGravada, isc, icbper, otros_tributos, total, car, estado_sire, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const transaction = db.transaction((recs) => {
            for (const r of recs) {
                insert.run(r.id, ruc, r.registro, r.fecha, r.fecVcto, r.tipo_doc, r.serie, r.numero, r.doc_tipo, r.doc_num, r.nombre, r.tc, r.bi, r.igv, r.noGravada, r.isc, r.icbper, r.otros_tributos, r.total, r.car, r.estado_sire, userId);
            }
        });
        transaction(records);
    }
};

module.exports = dbManager;
