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
userRouter.post('/', async (req, res) => {
  const { cpf, nome, email, telefone, senha} = req.body;
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


const veiculoRouter = express.Router();

// GET /veiculos - listar todos
veiculoRouter.get('/', (req, res) => {
  console.log('📥 Requisição GET /veiculos');
  
  // Construir a consulta SQL base
  let query = 'SELECT * FROM Veiculo';
  const params = [];
  
  // Adicionar filtros se existirem
  const filtros = [];
  
  if (req.query.marca) {
    filtros.push('MARCA = ?');
    params.push(req.query.marca);
  }
  
  if (req.query.modelo) {
    filtros.push('MODELO = ?');
    params.push(req.query.modelo);
  }
  
  // Adicionar cláusula WHERE se houver filtros
  if (filtros.length > 0) {
    query += ' WHERE ' + filtros.join(' AND ');
  }
  
  // Executar a consulta
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar veículos:', err);
      return res.status(500).json({ erro: 'Erro ao buscar veículos' });
    }
    
    // Converter BLOBs para base64 para enviar ao cliente
    const veiculosComImagens = results.map(veiculo => {
      if (veiculo.IMAGEM) {
        // Converter o BLOB para base64
        const imagemBase64 = `data:image/jpeg;base64,${veiculo.IMAGEM.toString('base64')}`;
        return { ...veiculo, IMAGEM: imagemBase64 };
      }
      return veiculo;
    });
    
    console.log('✅ Veículos encontrados:', results.length);
    res.status(200).json(veiculosComImagens);
  });
});

// POST /veiculos - cadastrar novo
veiculoRouter.post('/', upload.single('imagem'), (req, res) => {
  const { marca, modelo, ano, valor, quilometragem, combustivel, cambio, condicao } = req.body;
  
  // Verificar se há uma imagem
  const imagem = req.file ? req.file.buffer : null;
  
  let query;
  let params;
  
  if (imagem) {
    query = `
      INSERT INTO Veiculo (MARCA, MODELO, ANO, VALOR, QUILOMETRAGEM, COMBUSTIVEL, CAMBIO, CONDICAO, IMAGEM)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    params = [marca, modelo, ano, valor, quilometragem, combustivel, cambio, condicao, imagem];
  } else {
    query = `
      INSERT INTO Veiculo (MARCA, MODELO, ANO, VALOR, QUILOMETRAGEM, COMBUSTIVEL, CAMBIO, CONDICAO)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    params = [marca, modelo, ano, valor, quilometragem, combustivel, cambio, condicao];
  }
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error('❌ Erro ao cadastrar veículo:', err);
      return res.status(500).json({ erro: 'Erro ao cadastrar veículo' });
    }
    console.log('✅ Veículo cadastrado com sucesso!');
    res.status(201).json({ mensagem: 'Veículo cadastrado com sucesso', id: result.insertId });
  });
});

// PUT /veiculos/:id - atualizar veículo
veiculoRouter.put('/:id', upload.single('imagem'), (req, res) => {
  const { id } = req.params;
  const { marca, modelo, ano, valor, quilometragem, combustivel, cambio, condicao, removerImagem } = req.body;
  
  // Verificar se há uma imagem
  const imagem = req.file ? req.file.buffer : null;
  
  let query;
  let params;
  
  if (imagem) {
    query = `
      UPDATE Veiculo
      SET MARCA = ?, MODELO = ?, ANO = ?, VALOR = ?, QUILOMETRAGEM = ?, COMBUSTIVEL = ?, CAMBIO = ?, CONDICAO = ?, IMAGEM = ?
      WHERE ID_VEICULO = ?
    `;
    params = [marca, modelo, ano, valor, quilometragem, combustivel, cambio, condicao, imagem, id];
  } else {
    // Se não houver nova imagem, verificar se devemos remover a imagem existente
    if (removerImagem === 'true') {
      query = `
        UPDATE Veiculo
        SET MARCA = ?, MODELO = ?, ANO = ?, VALOR = ?, QUILOMETRAGEM = ?, COMBUSTIVEL = ?, CAMBIO = ?, CONDICAO = ?, IMAGEM = NULL
        WHERE ID_VEICULO = ?
      `;
      params = [marca, modelo, ano, valor, quilometragem, combustivel, cambio, condicao, id];
    } else {
      query = `
        UPDATE Veiculo
        SET MARCA = ?, MODELO = ?, ANO = ?, VALOR = ?, QUILOMETRAGEM = ?, COMBUSTIVEL = ?, CAMBIO = ?, CONDICAO = ?
        WHERE ID_VEICULO = ?
      `;
      params = [marca, modelo, ano, valor, quilometragem, combustivel, cambio, condicao, id];
    }
  }
  
  db.query(query, params, (err) => {
    if (err) {
      console.error(`❌ Erro ao atualizar veículo ${id}:`, err);
      return res.status(500).json({ erro: 'Erro ao atualizar veículo' });
    }
    console.log(`✅ Veículo ${id} atualizado`);
    res.status(200).json({ mensagem: 'Veículo atualizado com sucesso!' });
  });
});

// DELETE /veiculos/:id - deletar veículo
veiculoRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM Veiculo WHERE ID_VEICULO = ?';
  db.query(query, [id], (err) => {
    if (err) {
      console.error(`❌ Erro ao deletar veículo ${id}:`, err);
      return res.status(500).json({ erro: 'Erro ao deletar veículo' });
    }
    console.log(`✅ Veículo ${id} deletado`);
    res.status(200).json({ mensagem: 'Veículo deletado com sucesso!' });
  });
});

// GET /veiculos/:id - Buscar veículo por ID
veiculoRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  console.log(`📥 Requisição GET /veiculos/${id}`);

  const query = 'SELECT * FROM Veiculo WHERE ID_VEICULO = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error(`❌ Erro ao buscar veículo ${id}:`, err);
      return res.status(500).json({ erro: 'Erro ao buscar veículo' });
    }

    if (results.length === 0) {
      return res.status(404).json({ mensagem: 'Veículo não encontrado' });
    }

    // Converter BLOB para base64
    const veiculo = results[0];
    if (veiculo.IMAGEM) {
      veiculo.IMAGEM = `data:image/jpeg;base64,${veiculo.IMAGEM.toString('base64')}`;
    }

    console.log(`✅ Veículo ${id} encontrado`);
    res.status(200).json(veiculo);
  });
});


app.use('/veiculos', veiculoRouter);


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