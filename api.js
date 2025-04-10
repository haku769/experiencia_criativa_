import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


const app = express();
const PORT = 3000;
const JWT_SECRET = '110055';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('./pages'));

// Conexão com banco
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'PUC@1234',
  database: 'loja'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('✅ Conectado ao banco de dados com sucesso!');
  }
});

// ==============================
// 🔐 Middleware: Autenticar JWT
// ==============================
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401); // Não autorizado

  jwt.verify(token, JWT_SECRET, (err, usuario) => {
    if (err) return res.sendStatus(403); // Token inválido
    req.usuario = usuario;
    next();
  });
}

// ==============================
// ✅ ROTEADOR: USUÁRIOS (CRUD)
// ==============================
const userRouter = express.Router();

// GET /usuarios (protegido)
userRouter.get('/', autenticarToken, (req, res) => {
  console.log('📥 Requisição GET /usuarios');
  const query = 'SELECT CPFUsuario, NomeUsuario, EmailUsuario, TelUsuario FROM Usuario';
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar usuários:', err);
      return res.status(500).json({ erro: 'Erro ao buscar usuários' });
    }
    console.log('✅ Usuários encontrados:', results.length);
    res.status(200).json(results);
  });
});

// PUT /usuarios/:cpf
userRouter.put('/:cpf', (req, res) => {
  const { cpf } = req.params;
  const { nome, email, telefone } = req.body;
  console.log(`📥 Requisição PUT /usuarios/${cpf}`, req.body);
  const query = 'UPDATE Usuario SET NomeUsuario = ?, EmailUsuario = ?, TelUsuario = ? WHERE CPFUsuario = ?';
  db.query(query, [nome, email, telefone, cpf], (err) => {
    if (err) {
      console.error(`❌ Erro ao atualizar usuário ${cpf}:`, err);
      return res.status(500).json({ erro: 'Erro ao atualizar usuário' });
    }
    console.log(`✅ Usuário ${cpf} atualizado`);
    res.status(200).json({ mensagem: 'Usuário atualizado com sucesso!' });
  });
});

// DELETE /usuarios/:cpf
userRouter.delete('/:cpf', (req, res) => {
  const { cpf } = req.params;
  console.log(`📥 Requisição DELETE /usuarios/${cpf}`);
  const query = 'DELETE FROM Usuario WHERE CPFUsuario = ?';
  db.query(query, [cpf], (err) => {
    if (err) {
      console.error(`❌ Erro ao deletar usuário ${cpf}:`, err);
      return res.status(500).json({ erro: 'Erro ao deletar usuário' });
    }
    console.log(`✅ Usuário ${cpf} deletado`);
    res.status(200).json({ mensagem: 'Usuário deletado com sucesso!' });
  });
});

app.use('/usuarios', userRouter);

// ==============================
// ✅ ROTEADOR: AUTENTICAÇÃO
// ==============================
const authRouter = express.Router();

// POST /autenticacao/registro
authRouter.post('/registro', async (req, res) => {
  const { nome, email, cpf, telefone, senha } = req.body;
  const cpfSemFormatacao = cpf.replace(/[^\d]/g, ''); 
  const telefoneSemFormatacao = telefone.replace(/[^\d]/g, '');

  db.query('SELECT * FROM Usuario WHERE EmailUsuario = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro ao verificar email' });
    if (results.length > 0) {
      return res.status(400).json({ erro: 'Email já está cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const insertQuery = 'INSERT INTO Usuario (CPFUsuario, NomeUsuario, EmailUsuario, TelUsuario, SenhaUsuario) VALUES (?, ?, ?, ?, ?)';
    db.query(insertQuery, [cpfSemFormatacao, nome, email, telefoneSemFormatacao, hashedPassword], (err) => {
      if (err) {
        console.error('Erro ao registrar usuário:', err);
        return res.status(500).json({ erro: 'Erro ao registrar usuário' });
      }
      res.status(201).json({ mensagem: 'Usuário registrado com sucesso!' });
    });
  });
});

// POST /autenticacao/login
authRouter.post('/login', (req, res) => {
  const { email, senha } = req.body;
  console.log('📥 Tentativa de login:', email);

  db.query('SELECT * FROM Usuario WHERE EmailUsuario = ?', [email], async (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar usuário:', err);
      return res.status(500).json({ erro: 'Erro ao buscar usuário' });
    }
    if (results.length === 0) {
      console.warn('⚠️ Login falhou. Email não encontrado:', email);
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    const usuario = results[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.SenhaUsuario);

    if (!senhaCorreta) {
      console.warn('⚠️ Senha incorreta para o email:', email);
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    const token = jwt.sign(
      {
        cpf: usuario.CPFUsuario,
        nome: usuario.NomeUsuario,
        email: usuario.EmailUsuario
      },
      JWT_SECRET,
      { expiresIn: '1h' } // Token válido por 1 hora
    );

    console.log('✅ Login bem-sucedido para:', email);
    res.status(200).json({
      mensagem: 'Login bem-sucedido!',
      token,
      usuario: {
        cpf: usuario.CPFUsuario,
        nome: usuario.NomeUsuario,
        email: usuario.EmailUsuario
      }
    });
  });
});

app.use('/autenticacao', authRouter);

// ===================
// ✅ ROTA PRINCIPAL
// ===================
app.get('/', (req, res) => {
  console.log('🌐 Rota principal acessada');
  res.send('🔐 API de Usuários + Autenticação está funcionando!');
});

// ===================
// ✅ INICIAR SERVIDOR
// ===================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
