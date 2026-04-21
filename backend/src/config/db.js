import { Database } from "arangojs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const db = new Database({
    url: process.env.DATABASE_URL,
    databaseName: process.env.DB_NAME
});

db.useBasicAuth(
    process.env.DB_USER,
    process.env.DB_PASSWORD
);

export default db;