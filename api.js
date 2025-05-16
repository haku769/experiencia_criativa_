import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import multer from 'multer';
const storage = multer.memoryStorage(); // imagem será salva em buffer
const upload = multer({ storage });


const app = express();
const PORT = 3000;
const JWT_SECRET = '110055';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('./pages'));
app.use(express.static('./pages/routes'));
app.use('/uploads', express.static('uploads'));




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
  
  if (!token) {
    console.log('⚠️ Token não fornecido');
    return res.sendStatus(401);
  }

  console.log('📜 Token recebido:', token);
  
  jwt.verify(token, JWT_SECRET, (err, usuario) => {
    if (err) {
      console.log('❌ Token inválido ou expirado');
      return res.sendStatus(403); // Token inválido
    }
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
  const query = 'SELECT CPF, NOME, EMAIL, TELEFONE, FUNCAO FROM Usuario';
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar usuários:', err);
      return res.status(500).json({ erro: 'Erro ao buscar usuários' });
    }
    console.log('✅ Usuários encontrados:', results.length);
    res.status(200).json(results);
  });
});
// GET /usuarios/:cpf (protegido)

userRouter.get('/:cpf', autenticarToken, (req, res) => {
  const cpf = req.params.cpf;

  const query = 'SELECT CPF, NOME, EMAIL, TELEFONE, FUNCAO FROM Usuario WHERE CPF = ?';
  db.query(query, [cpf], (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar usuário por CPF:', err);
      return res.status(500).json({ erro: 'Erro ao buscar usuário' });
    }

    if (results.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    res.status(200).json(results[0]);
  });
});





userRouter.post('/', async (req, res) => {
  const { cpf, nome, email, telefone, senha } = req.body;
  const hashedSenha = await bcrypt.hash(senha, 10);

  const query = 'INSERT INTO Usuario (CPF, NOME, EMAIL, TELEFONE, SENHA) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [cpf, nome, email, telefone, hashedSenha], (err) => {
    if (err) {
      console.error('❌ Erro ao cadastrar usuário:', err);
      return res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
    }
    console.log('✅ Usuário cadastrado com sucesso!');
    res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso' });
  });
});


// ==============================
// ✅ ROTEADOR: Perfil
// ============================== 

//  GET /usuario/perfil (protegido)
app.get('/usuario/perfil', autenticarToken, async (req, res) => {
  const cpf = req.usuario.cpf;

  try {
    const [resultados] = await db.promise().query(
      'SELECT NOME, EMAIL, TELEFONE, FOTO FROM Usuario WHERE CPF = ?',
      [cpf]
    );

    if (resultados.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    res.json({
      CPF: cpf,
      ...resultados[0]
    });
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    res.status(500).json({ erro: 'Erro ao buscar perfil' });
  }
});


// Buscar foto do usuário

app.get('/imagem/:cpf', async (req, res) => {
  const cpf = req.params.cpf;

  try {
    const [results] = await db.promise().query(
      'SELECT FOTO FROM Usuario WHERE CPF = ?',
      [cpf]
    );

    if (results.length === 0 || !results[0].FOTO) {
      return res.status(404).send('Imagem não encontrada');
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.send(results[0].FOTO); // buffer da imagem BLOB
  } catch (err) {
    console.error('Erro ao buscar imagem:', err);
    return res.status(500).send('Erro no servidor');
  }
});


app.put('/usuario/perfil', autenticarToken, upload.single('foto'), async (req, res) => {
  const { nome, email, telefone, senha } = req.body;
  const cpf = req.usuario.cpf;
  const novaFoto = req.file ? req.file.buffer : null;

  if (!nome || !email || !telefone) {
    return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos.' });
  }

  try {
    const [results] = await db.promise().query('SELECT * FROM Usuario WHERE CPF = ?', [cpf]);

    if (results.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    let query = 'UPDATE Usuario SET NOME = ?, EMAIL = ?, TELEFONE = ?';
    let params = [nome, email, telefone];

    if (senha) {
      const hash = await bcrypt.hash(senha, 10);
      query += ', SENHA = ?';
      params.push(hash);
    }

    if (novaFoto) {
      query += ', FOTO = ?';
      params.push(novaFoto);
    }

    query += ' WHERE CPF = ?';
    params.push(cpf);

    await db.promise().query(query, params);

    res.json({ mensagem: 'Perfil atualizado com sucesso.' });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    console.log(req.body);
    console.log(req.file);

    res.status(500).json({ erro: 'Erro interno ao atualizar perfil.' });
  }
});






// PUT /usuarios/:cpf
userRouter.put('/:cpf', (req, res) => {
  const { cpf } = req.params;
  const { nome, email, telefone } = req.body;
  console.log(`📥 Requisição PUT /usuarios/${cpf}`, req.body);
  const query = 'UPDATE Usuario SET NOME = ?, EMAIL = ?, TELEFONE = ? WHERE CPF = ?';
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
  const query = 'DELETE FROM Usuario WHERE CPF = ?';
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

authRouter.post('/registro', upload.single('foto'), async (req, res) => {
  const { nome, email, cpf, telefone, senha } = req.body;
  const cpfSemFormatacao = cpf.replace(/[^\d]/g, '');
  const telefoneSemFormatacao = telefone.replace(/[^\d]/g, '');
  const fotoBuffer = req.file ? req.file.buffer : null;

  db.query('SELECT * FROM Usuario WHERE EMAIL = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro ao verificar email' });
    if (results.length > 0) {
      return res.status(400).json({ erro: 'Email já está cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const insertQuery = `
      INSERT INTO Usuario (CPF, NOME, EMAIL, TELEFONE, SENHA, FOTO)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(insertQuery, [cpfSemFormatacao,nome,email,telefoneSemFormatacao,hashedPassword,fotoBuffer], (err) => {
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

  db.query('SELECT * FROM Usuario WHERE EMAIL = ?', [email], async (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar usuário:', err);
      return res.status(500).json({ erro: 'Erro ao buscar usuário' });
    }

    if (results.length === 0) {
      console.warn('⚠️ Login falhou. Email não encontrado:', email);
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    const usuario = results[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.SENHA);

    if (!senhaCorreta) {
      console.warn('⚠️ Senha incorreta para o email:', email);
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    const token = jwt.sign(
      {
        cpf: usuario.CPF,
        nome: usuario.NOME,
        email: usuario.EMAIL
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { cpf: usuario.CPF },
      JWT_SECRET,
      { expiresIn: '7d' } // válido por 7 dias
    );

   console.log('✅ Login bem-sucedido para:', email);

    res.status(200).json({
      mensagem: 'Login bem-sucedido!',
      token,
      refreshToken,
      usuario: {
        cpf: usuario.CPF,
        nome: usuario.NOME,
        email: usuario.EMAIL,
        foto: usuario.FOTO,
        funcao: usuario.FUNCAO
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
