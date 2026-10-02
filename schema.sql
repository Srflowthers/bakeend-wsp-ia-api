CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    prompt TEXT NOT NULL,
    phone_number TEXT,
    webhook_secret TEXT,
    sheet_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    source TEXT NOT NULL, -- e.g. 'inventory', 'products'
    data TEXT NOT NULL, -- JSON data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses (id)
);

-- Insertar usuario admin
INSERT INTO users (email, password, role) VALUES ('centinalwsp.cl@gmail.com', 'Chripan2026', 'admin');

-- Insertar un negocio de prueba
INSERT INTO businesses (user_id, name, prompt) VALUES (1, 'Centinal Store', 'Eres un asistente experto en la tienda Centinal. Responde preguntas sobre nuestros productos basándote en la información de inventario que recibimos. Sé siempre amable y servicial.');
