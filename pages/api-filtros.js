// GET /veiculos com filtros
veiculoRouter.get('/', (req, res) => {
  console.log('📥 Requisição GET /veiculos com filtros:', req.query);
  
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
    console.log('✅ Veículos encontrados:', results.length);
    res.status(200).json(results);
  });
});