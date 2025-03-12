import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 5173;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Використовуємо папку public для статичних файлів
app.use(express.static(path.join(__dirname, "../../public")));

// Якщо хочете вручну віддавати index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public", "index.html"));
});

app.listen(port, () => {
  console.log(`Сервер запущено на http://localhost:${port}`);
});
