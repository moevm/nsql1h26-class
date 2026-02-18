const { Database, aql } = require("arangojs");

async function run() {
  const server = new Database({
    url: "http://127.0.0.1:8529",
    auth: { username: "root", password: "" },
  });

  try {
    const dbName = "lab_test";
    const colName = "test";

    const dbs = await server.listDatabases();
    if (!dbs.includes(dbName)) {
      await server.createDatabase(dbName);
    }
    
    const db = server.database(dbName);

    const cols = await db.listCollections();
    if (!cols.find(c => c.name === colName)) {
      await db.collection(colName).create();
    }

    const bookings = db.collection(colName);

    const newDoc = await bookings.save({
      student: "Иван Иванов",
      class: "Аудитория 104",
      computerIndex: Math.floor(Math.random() * 20) + 1,
      timestamp: new Date().toISOString()
    });
    console.log("Запись добавлена:", newDoc._key);

    const cursor = await db.query(aql`
      FOR b IN ${bookings}
      SORT b.timestamp DESC
      RETURN b
    `);

    const result = await cursor.all();
    console.log("\n Текущие записи:");
    console.table(result);

  } catch (err) {
    console.error(err.message);
  }
}

run();
