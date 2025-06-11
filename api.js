import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';

import multer from 'multer';
const storage = multer.memoryStorage(); 
const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } 
});


const app = express();
const PORT = 3000;
const JWT_SECRET = '110055';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('./pages'));
app.use(express.static('./pages/routes'));
app.use('/uploads', express.static('uploads'));

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ erro: 'Arquivo muito grande. Tamanho máximo permitido: 2MB.' });
  }
  next(err);
});



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
    console.log('⚠️ Token não fornecido necessário login ');
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
  const query = 'SELECT CPF, NOME, EMAIL, TELEFONE, FOTO, FUNCAO  FROM Usuario';
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

  const query = 'SELECT CPF, NOME, EMAIL, TELEFONE, FOTO, FUNCAO FROM Usuario WHERE CPF = ?';
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

userRouter.get('/:cpf/foto', (req, res) => {
  const { cpf } = req.params;

  const query = 'SELECT FOTO FROM Usuario WHERE CPF = ?';
  db.query(query, [cpf], (err, results) => {
    if (err) {
      console.error(`❌ Erro ao buscar foto do usuário ${cpf}:`, err);
      return res.status(500).json({ erro: 'Erro ao buscar foto' });
    }

    if (results.length === 0 || !results[0].FOTO) {
      return res.status(404).json({ erro: 'Foto não encontrada' });
    }

    const fotoBuffer = results[0].FOTO;

    // Define o tipo de conteúdo genérico ou detecta com base na imagem se necessário
    res.set('Content-Type', 'image/jpeg'); // ou image/png se souber o tipo
    res.send(fotoBuffer);
  });
});






userRouter.post('/', upload.single('foto'), async (req, res) => {
  try {
    let { cpf, nome, email, telefone, funcao, senha } = req.body;

    if (!cpf || !nome || !email || !telefone || !funcao || !senha) {
      return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
    }

    try {
      cpf = cpf.replace(/\D/g, '');
    } catch {
      return res.status(400).json({ erro: 'Formato de CPF inválido' });
    }

    const hashedSenha = await bcrypt.hash(senha, 10);

    let fotoBuffer = null;

    if (req.file) {
      // Redimensiona a imagem para 300x300, mantendo o formato original
      try {
        fotoBuffer = await sharp(req.file.buffer)
          .resize(300, 300, { fit: 'cover' }) // pode ajustar conforme quiser (cover, contain...)
          .toBuffer();
      } catch (err) {
        console.error('Erro ao processar imagem com Sharp:', err);
        return res.status(500).json({ erro: 'Erro ao processar imagem' });
      }
    }

    const query = 'INSERT INTO Usuario (CPF, NOME, EMAIL, TELEFONE, FUNCAO, SENHA, FOTO) VALUES (?, ?, ?, ?, ?, ?, ?)';

    db.query(query, [cpf, nome, email, telefone, funcao, hashedSenha, fotoBuffer], (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ erro: 'CPF já cadastrado' });
        }
        return res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
      }
      res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso' });
    });
  } catch (error) {
    console.error('Erro inesperado no POST /usuarios:', error);
    res.status(500).json({ erro: 'Erro inesperado no servidor' });
  }
});






userRouter.put('/:cpf', (req, res, next) => {
  upload.single('foto')(req, res, async function(err) {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ erro: 'Arquivo muito grande. Tamanho máximo permitido: 2MB.' });
      }
      return res.status(500).json({ erro: 'Erro no upload da imagem' });
    }

    const { cpf } = req.params;
    const { nome, email, telefone, funcao } = req.body;
    let foto = null;

    if (req.file) {
      try {
        foto = await sharp(req.file.buffer)
          .resize(300, 300, { fit: 'cover' })  // redimensiona para 300x300 fixo
          .toBuffer();
      } catch (error) {
        console.error('Erro ao processar a imagem:', error);
        return res.status(500).json({ erro: 'Erro ao processar a imagem' });
      }
    }

    let query = 'UPDATE Usuario SET NOME = ?, EMAIL = ?, TELEFONE = ?, FUNCAO = ?';
    const params = [nome, email, telefone, funcao];

    if (foto) {
      query += ', FOTO = ?';
      params.push(foto);
    }

    query += ' WHERE CPF = ?';
    params.push(cpf);

    db.query(query, params, (error) => {
      if (error) {
        console.error(`❌ Erro ao atualizar usuário ${cpf}:`, error);
        return res.status(500).json({ erro: 'Erro ao atualizar usuário' });
      }

      res.status(200).json({
        mensagem: 'Usuário atualizado com sucesso!',
        CPF: cpf,
        NOME: nome,
        EMAIL: email,
        TELEFONE: telefone,
        FUNCAO: funcao,
        FOTO: foto ? 'Imagem atualizada' : null
      });
    });
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


// ==============================
// ✅ ROTEADOR: VEÍCULOS (CRUD)

const veiculoRouter = express.Router();
// No seu arquivo de rotas do backend (ex: veiculoRouter.js)

veiculoRouter.get('/', (req, res) => {
    console.log('📥 Requisição GET /veiculos com filtros:', req.query);
    
    let query = 'SELECT * FROM Veiculo';
    const params = [];
    const filtros = [];
    
    // Filtros existentes (mantidos)
    if (req.query.marca) {
        filtros.push('MARCA = ?');
        params.push(req.query.marca);
    }
    if (req.query.modelo) {
        filtros.push('MODELO = ?');
        params.push(req.query.modelo);
    }
    
    // ADICIONADO: Filtros de Preço
    if (req.query.precoMin) {
        filtros.push('VALOR >= ?');
        params.push(req.query.precoMin);
    }
    if (req.query.precoMax) {
        filtros.push('VALOR <= ?');
        params.push(req.query.precoMax);
    }
    
    // ADICIONADO: Filtros de Ano
    if (req.query.anoMin) {
        filtros.push('ANO >= ?');
        params.push(req.query.anoMin);
    }
    if (req.query.anoMax) {
        filtros.push('ANO <= ?');
        params.push(req.query.anoMax);
    }
    
    // ADICIONADO: Filtros de Quilometragem
    if (req.query.kmMin) {
        filtros.push('QUILOMETRAGEM >= ?');
        params.push(req.query.kmMin);
    }
    if (req.query.kmMax) {
        filtros.push('QUILOMETRAGEM <= ?');
        params.push(req.query.kmMax);
    }

    // Adicione aqui outros filtros como combustivel, cambio, etc., se desejar.
    // Exemplo:
    if (req.query.combustivel) {
        filtros.push('COMBUSTIVEL = ?');
        params.push(req.query.combustivel);
    }
    
    // Adiciona a cláusula WHERE se houver filtros
    if (filtros.length > 0) {
        query += ' WHERE ' + filtros.join(' AND ');
    }
    
    // ADICIONADO: Lógica de Ordenação
    const ordenacao = req.query.ordenacao || 'relevancia';
    const ordenadores = {
        "preco-asc": " ORDER BY VALOR ASC",
        "preco-desc": " ORDER BY VALOR DESC",
        "ano-desc": " ORDER BY ANO DESC",
        "ano-asc": " ORDER BY ANO ASC",
        "km-asc": " ORDER BY QUILOMETRAGEM ASC",
        "km-desc": " ORDER BY QUILOMETRAGEM DESC"
    };

    if (ordenadores[ordenacao]) {
        query += ordenadores[ordenacao];
    }
    
    console.log("Executando Query:", query); // Log para depuração
    console.log("Com Parâmetros:", params);   // Log para depuração

    // Executar a consulta
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('❌ Erro ao buscar veículos com filtros:', err);
            return res.status(500).json({ erro: 'Erro ao buscar veículos' });
        }
        
        // Sua lógica de conversão de imagem (mantida, está perfeita)
        const veiculosComImagens = results.map(veiculo => {
            if (veiculo.IMAGEM) {
                const imagemBase64 = `data:image/jpeg;base64,${veiculo.IMAGEM.toString('base64')}`;
                return { ...veiculo, IMAGEM: imagemBase64 };
            }
            return veiculo;
        });
        
        console.log('✅ Veículos encontrados:', veiculosComImagens.length);
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

// ========================================================
//  coração      ROTAS DA API DE FAVORITOS      coração
// ========================================================

// ✅ GET /api/favoritos - Buscar todos os favoritos do usuário logado
app.get('/api/favoritos', autenticarToken, (req, res) => {
  const usuarioCpf = req.usuario.cpf; 

  const query = `
    SELECT 
          v.ID_VEICULO AS id,
          v.MARCA AS marca,          -- ADICIONADO
          v.MODELO AS modelo,        -- RENOMEADO DE 'nome' PARA 'modelo'
          v.VALOR AS preco,
          v.IMAGEM AS imagem,
          v.ANO AS ano,
          v.QUILOMETRAGEM AS km,
          v.COMBUSTIVEL AS combustivel,  -- ADICIONADO
          v.CAMBIO AS cambio,          -- ADICIONADO
          v.CONDICAO AS condicao,      -- ADICIONADO
          f.DATA_FAVORITO as dataAdicionado
      FROM Veiculo v
      JOIN Favoritos f ON v.ID_VEICULO = f.ID_VEICULO
      WHERE f.CPF = ?
  `;

  db.query(query, [usuarioCpf], (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar favoritos:', err);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
    
    const favoritosComImagens = results.map(veiculo => {
            if (veiculo.imagem && Buffer.isBuffer(veiculo.imagem)) {
                // Converte o BLOB para base64
                const imagemBase64 = `data:image/jpeg;base64,${veiculo.imagem.toString('base64')}`;
                return { ...veiculo, imagem: imagemBase64 }; // Retorna o veículo com a imagem convertida
            }
            return veiculo; // Retorna o veículo como está se não houver imagem
        });
        
        res.status(200).json(favoritosComImagens);
  });
});


// ❤️ POST /api/favoritos - Adicionar um veículo aos favoritos
app.post('/api/favoritos', autenticarToken, (req, res) => {
  const usuarioCpf = req.usuario.cpf;
  const { veiculoId } = req.body; 

  if (!veiculoId) {
    return res.status(400).json({ erro: 'O ID do veículo é obrigatório.' });
  }
  
  const query = 'INSERT INTO Favoritos (CPF, ID_VEICULO) VALUES (?, ?)';

  db.query(query, [usuarioCpf, veiculoId], (err, results) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Este veículo já está nos seus favoritos.' });
      }
      console.error('❌ Erro ao adicionar favorito:', err);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
    res.status(201).json({ mensagem: 'Veículo adicionado aos favoritos!' });
  });
});


// 🗑️ DELETE /api/favoritos/:veiculoId - Remover um veículo dos favoritos
app.delete('/api/favoritos/:veiculoId', autenticarToken, (req, res) => {
  const usuarioCpf = req.usuario.cpf;
  const { veiculoId } = req.params;

  const query = 'DELETE FROM Favoritos WHERE CPF = ? AND ID_VEICULO = ?';

  db.query(query, [usuarioCpf, veiculoId], (err, results) => {
    if (err) {
      console.error('❌ Erro ao remover favorito:', err);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
    if (results.affectedRows === 0) {
        return res.status(404).json({ erro: 'Favorito não encontrado.' });
    }
    res.status(200).json({ mensagem: 'Veículo removido dos favoritos.' });
  });
});

// 🗑️ DELETE /api/favoritos - Limpar TODOS os favoritos do usuário
app.delete('/api/favoritos', autenticarToken, (req, res) => {
    const usuarioCpf = req.usuario.cpf;

    const query = 'DELETE FROM Favoritos WHERE CPF = ?';

    db.query(query, [usuarioCpf], (err, results) => {
        if (err) {
            console.error('❌ Erro ao limpar todos os favoritos:', err);
            return res.status(500).json({ erro: 'Erro interno do servidor.' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: 'Nenhum favorito para remover.' });
        }
        res.status(200).json({ mensagem: 'Todos os veículos foram removidos dos favoritos.' });
    });
});
// propostas


// POST /api/propostas - Usuário cria uma nova proposta
app.post('/api/propostas', autenticarToken, (req, res) => {
    const usuarioCpf = req.usuario.cpf;
    const { veiculoId, valorProposta, mensagem } = req.body;

    if (!veiculoId || !valorProposta) {
        return res.status(400).json({ erro: 'O ID do veículo e o valor da proposta são obrigatórios.' });
    }

    const query = 'INSERT INTO Propostas (usuario_cpf, veiculo_id, valor_proposta, mensagem) VALUES (?, ?, ?, ?)';
    const params = [usuarioCpf, veiculoId, valorProposta, mensagem || null];

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('❌ Erro ao registrar proposta:', err);
            return res.status(500).json({ erro: 'Erro ao registrar proposta.' });
        }
        res.status(201).json({ mensagem: 'Proposta enviada com sucesso!' });
    });
});

// GET /api/propostas - Admin visualiza todas as propostas
// A rota é protegida por dois middlewares: primeiro autentica, depois verifica se é admin.
app.get('/api/propostas', autenticarToken, (req, res) => {
    // Query que junta as 3 tabelas para trazer informações completas
    const query = `
        SELECT 
            p.id, p.valor_proposta, p.mensagem, p.status, p.data_proposta,
            u.NOME AS nome_usuario, u.EMAIL AS email_usuario, u.TELEFONE AS telefone_usuario,
            v.MARCA AS marca_veiculo, v.MODELO AS modelo_veiculo
        FROM Propostas p
        JOIN Usuario u ON p.usuario_cpf = u.CPF
        JOIN Veiculo v ON p.veiculo_id = v.ID_VEICULO
        ORDER BY p.data_proposta DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Erro ao buscar propostas:', err);
            return res.status(500).json({ erro: 'Erro ao buscar propostas.' });
        }
        res.status(200).json(results);
    });
});

// PUT /api/propostas/:id - Admin atualiza o status de uma proposta
app.put('/api/propostas/:id', autenticarToken, (req, res) => {
    const { id } = req.params;
    const { novoStatus } = req.body;

    if (!novoStatus) {
        return res.status(400).json({ erro: 'O novo status é obrigatório.' });
    }

    const query = 'UPDATE Propostas SET status = ? WHERE id = ?';
    db.query(query, [novoStatus, id], (err, results) => {
        if (err) {
            console.error('❌ Erro ao atualizar status da proposta:', err);
            return res.status(500).json({ erro: 'Erro ao atualizar proposta.' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: 'Proposta não encontrada.' });
        }
        res.status(200).json({ mensagem: 'Status da proposta atualizado com sucesso!' });
    });
});
app.delete('/api/propostas/:id', autenticarToken, (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM Propostas WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('❌ Erro ao deletar proposta:', err);
            return res.status(500).json({ erro: 'Erro ao deletar proposta.' });
        }
        // Se nenhuma linha foi afetada, a proposta com o ID fornecido não existe.
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: 'Proposta não encontrada.' });
        }
        res.status(200).json({ mensagem: 'Proposta deletada com sucesso!' });
    });
});
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