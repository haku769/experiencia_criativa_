const express = require("express");
const cors = require("cors");
const mysql = require('mysql2');

const app = express();
const router = express.Router();

const corsOption = {
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
} ;

app.use(express.json());
app.use(cors());
app.use(express.static("./pages")); // Para servir arquivos estáticos, se necessário

// Configuração de conexão com o banco de dados MySQL
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "PUC@1234",
  database: "trabalho_java" // Substitua pelo nome correto do seu banco de dados
});

con.connect((err) => {
  if (err) throw err;
  console.log("Conectado ao MySQL!");
});


/* ---------------------------------
   ROTAS PARA USUÁRIOS
--------------------------------- */



// Rota para obter todos os usuários
router.get("/api/usuarios", (req, res) => {
  let sql = "SELECT id, email, status FROM usuario";
  con.query(sql, (err, result) => {
    if (err) throw err;
    res.status(200).json(result); // Sucesso
  });
});



// Rota para capturar um usuário por ID
router.get("/api/usuarios/:id", (req, res) => {
  const { id } = req.params;
  let sql = "SELECT id, email, status FROM usuario WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) throw err;
    if (result.length === 0) return res.status(404).json({ message: "Usuário não encontrado" }); // Falha
    res.status(200).json(result[0]); // Sucesso
  });
});

// Rota para excluir um usuário
router.delete("/api/usuarios/:id", (req, res) => {
  const { id } = req.params;
  let sql = "DELETE FROM usuario WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) throw err;
    if (result.affectedRows === 0) return res.status(404).json({ message: "Usuário não encontrado" }); // Falha
    res.status(200).send(`Usuário com id ${id} excluído`); // Sucesso
  });
});

// Endpoint para o login
router.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  let sql = `SELECT * FROM usuario WHERE email = '${email}' AND senha = '${senha}'`;
  
  con.query(sql, function (err, result) {
      if (err) {
          console.error('Erro ao consultar o banco de dados:', err);
          return res.status(500).json({ message: 'Erro no servidor' });
      }
      if (result.length > 0) {
          // Se encontrou um usuário com as credenciais fornecidas, retorna sucesso
          res.status(200).json({ message: 'Login bem-sucedido', usuario: result[0] });
      } else {
          // Senão, retorna erro de credenciais inválidas
          res.status(401).json({ message: 'Credenciais inválidas' });
      }
    });
});
// registro de usuario

router.post('/api/usuarios', (req, res) => {
  const { email, senha } = req.body;
  
  const sql = "INSERT INTO usuario (email, senha) VALUES (?, ?)";
  
  con.query(sql, [email, senha], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao criar usuário", err });
    }
    res.status(201).json({ message: "Usuário cadastrado com sucesso" });
  });
});




/* ---------------------------------
   ROTAS PARA PRODUTOS
--------------------------------- */

// Rota para obter todos os produtos
router.get('/api/crudProdutos', (req, res) => {
  con.query('SELECT * FROM produtos', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Rota para criar um novo produto
router.post('/api/crudProdutos', (req, res) => {
  const { nome, categoria, descricao } = req.body;
  const sql = 'INSERT INTO produtos (nome, categoria, descricao) VALUES (?, ?, ?)';
  con.query(sql, [nome, categoria, descricao], (err, result) => {
    if (err) throw err;
    res.json({ id: result.insertId, nome, categoria, descricao });
  });
});

// Rota para atualizar um produto
router.put('/api/crudProdutos/:id', (req, res) => {
  const { nome, categoria, descricao } = req.body;
  const { id } = req.params;
  const sql = 'UPDATE produtos SET nome = ?, categoria = ?, descricao = ? WHERE id = ?';
  con.query(sql, [nome, categoria, descricao, id], (err) => {
    if (err) throw err;
    res.json({ id, nome, categoria, descricao });
  });
});

// Rota para deletar um produto
router.delete('/api/crudProdutos/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM produtos WHERE id = ?';
  con.query(sql, [id], (err) => {
    if (err) throw err;
    res.json({ id });
  });
});

/* ---------------------------------
   INICIALIZAÇÃO DO SERVIDOR
--------------------------------- */

// Usar as rotas
app.use(router);

// Porta onde o servidor vai rodar
const port = 5502;
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
