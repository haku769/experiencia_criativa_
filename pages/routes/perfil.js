document.addEventListener('DOMContentLoaded', () => {
  const nome = document.getElementById('nome');
  const email = document.getElementById('email');
  const telefone = document.getElementById('telefone');
  const senha = document.getElementById('senha');
  const confirmarSenha = document.getElementById('confirmarSenha');
  const fotoPerfilInput = document.getElementById('fotoPerfil');
  const imagemAtual = document.getElementById('imagemAtual');
  const form = document.getElementById('form-perfil');
  const mensagem = document.getElementById('mensagemPerfil');
  const token = localStorage.getItem('token');

  // Mensagens de erro
  const erroNome = document.getElementById('erro-nome');
  const erroEmail = document.getElementById('erro-email');
  const erroTelefone = document.getElementById('erro-telefone');
  const erroFoto = document.getElementById('erro-foto');
  const erroSenha = document.getElementById('erro-senha');
  const erroConfirmarSenha = document.getElementById('erro-confirmar-senha');

  const telefoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

  if (!token) {
    if (mensagem) mensagem.textContent = 'Não autorizado. Faça login novamente.';
    return;
  }
  
  // Busca dados do perfil
  fetch('http://localhost:3000/usuario/perfil', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.erro) {
        if (mensagem) mensagem.textContent = data.erro;
        return;
      }

      const { CPF, NOME, EMAIL, TELEFONE } = data;

      nome.value = NOME || '';
      email.value = EMAIL || '';
      telefone.value = TELEFONE || '';

      localStorage.setItem('usuarioLogado', JSON.stringify({
        nome: NOME,
        email: EMAIL,
        telefone: TELEFONE,
        cpf: CPF,
        funcao: FUNCAO
      }));

      if (CPF && imagemAtual) {
        imagemAtual.src = `http://localhost:3000/imagem/${CPF}`;
        imagemAtual.style.display = 'block';
      } else if (imagemAtual) {
        imagemAtual.style.display = 'none';
      }

      const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
      const loginLink = document.getElementById('login-link');
      const perfilArea = document.getElementById('perfil-area');
      const nomeUsuarioElement = document.getElementById('nome-usuario');
      const fotoPerfilSuperior = document.getElementById('foto-perfil');

      if (loginLink) loginLink.style.display = 'none';
      if (perfilArea) perfilArea.style.display = 'flex';
      if (nomeUsuarioElement) nomeUsuarioElement.textContent = usuario.nome || 'Perfil';
      if (usuario.cpf && fotoPerfilSuperior) {
        fotoPerfilSuperior.src = `http://localhost:3000/imagem/${usuario.cpf}`;
      }
    })
    .catch(err => {
      if (mensagem) mensagem.textContent = 'Erro ao buscar dados do perfil.';
      console.error(err);
    });

  // Máscara para telefone: impede letras e símbolos inválidos
  telefone?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^\d\s()-+]/g, '');
  });

  // Validação e envio do formulário
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    let valido = true;

    // Limpar mensagens de erro
    erroNome?.classList.add('hidden');
    erroEmail?.classList.add('hidden');
    erroTelefone?.classList.add('hidden');
    erroFoto?.classList.add('hidden');
    erroSenha?.classList.add('hidden');
    erroConfirmarSenha?.classList.add('hidden');
    mensagem.textContent = '';

    // Validações
    if (!nome.value || nome.value.trim().length < 3) {
      erroNome?.classList.remove('hidden');
      valido = false;
    }

    if (!email.value || !email.value.includes('@')) {
      erroEmail?.classList.remove('hidden');
      valido = false;
    }

    if (fotoPerfilInput?.files.length > 0) {
      const file = fotoPerfilInput.files[0];
      const tiposValidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      if (!tiposValidos.includes(file.type)) {
        erroFoto.textContent = 'Formato de imagem inválido. Use JPG, PNG, GIF ou WEBP.';
        erroFoto.classList.remove('hidden');
        valido = false;
      } else if (file.size > 2 * 1024 * 1024) {
        erroFoto.textContent = 'A imagem deve ter no máximo 2MB.';
        erroFoto.classList.remove('hidden');
        valido = false;
      }
    }

    if (senha.value || confirmarSenha.value) {
      if (senha.value.length < 6) {
        erroSenha?.classList.remove('hidden');
        valido = false;
      }

      if (senha.value !== confirmarSenha.value) {
        erroConfirmarSenha?.classList.remove('hidden');
        valido = false;
      }
    }

    if (!valido) return;

    // Preparar e enviar
    const formData = new FormData();
    formData.append('nome', nome.value);
    formData.append('email', email.value);
    formData.append('telefone', telefone.value);
    if (fotoPerfilInput?.files[0]) formData.append('foto', fotoPerfilInput.files[0]);
    if (senha.value) formData.append('senha', senha.value);

    fetch('http://localhost:3000/usuario/perfil', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.erro) {
          mensagem.textContent = 'Erro: ' + data.erro;
          return;
        }

        const mensagemTexto = document.getElementById('mensagemTexto');
        if (mensagem && mensagemTexto) {
          mensagemTexto.textContent = 'Perfil atualizado com sucesso!';
          mensagem.classList.remove('hidden');
          setTimeout(() => mensagem.classList.add('opacity-100'), 50);
          setTimeout(() => {
            mensagem.classList.remove('opacity-100');
            setTimeout(() => mensagem.classList.add('hidden'), 500);
          }, 4000);
        }

        senha.value = '';
        confirmarSenha.value = '';

        const usuarioAtual = JSON.parse(localStorage.getItem('usuarioLogado')) || {};
        const usuarioAtualizado = {
          ...usuarioAtual,
          nome: nome.value,
          email: email.value,
          telefone: telefone.value,
          cpf: data.CPF || usuarioAtual.cpf
        };
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtualizado));

        const nomeUsuarioElement = document.getElementById('nome-usuario');
        if (nomeUsuarioElement) nomeUsuarioElement.textContent = nome.value;

        const timestamp = Date.now();
        if (usuarioAtualizado.cpf && imagemAtual) {
          imagemAtual.src = `http://localhost:3000/imagem/${usuarioAtualizado.cpf}?v=${timestamp}`;
          imagemAtual.style.display = 'block';
        }

        const fotoPerfilSuperior = document.getElementById('foto-perfil');
        if (usuarioAtualizado.cpf && fotoPerfilSuperior) {
          fotoPerfilSuperior.src = `http://localhost:3000/imagem/${usuarioAtualizado.cpf}?v=${timestamp}`;
        }
      })
      .catch(err => {
        mensagem.textContent = 'Erro ao atualizar perfil.';
        console.error(err);
      });
  });

  // Alternar visibilidade da senha
  function alternarVisibilidadeSenha(input, icone) {
    const tipoAtual = input.getAttribute('type');
    const novoTipo = tipoAtual === 'password' ? 'text' : 'password';
    input.setAttribute('type', novoTipo);

    icone.innerHTML = novoTipo === 'password'
      ? `
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 
          9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      `
      : `
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M3.98 8.223A10.477 10.477 0 002.458 12c1.274 4.057 
          5.065 7 9.542 7 1.956 0 3.772-.564 
          5.29-1.523M6.228 6.228A10.477 10.477 0 
          0112 5c4.477 0 8.268 2.943 9.542 7a10.493 
          10.493 0 01-4.21 5.293M6.228 6.228L3 
          3m3.228 3.228L9.75 9.75m4.5 4.5L21 
          21M9.75 9.75l4.5 4.5" />
      `;
  }

  // Botões de alternar senha
  const senhaInput = document.getElementById('senha');
  const toggleSenhaBtn = document.getElementById('toggle-senha');
  const iconeSenha = document.getElementById('icone-senha');
  if (toggleSenhaBtn && senhaInput && iconeSenha) {
    toggleSenhaBtn.addEventListener('click', () => {
      alternarVisibilidadeSenha(senhaInput, iconeSenha);
    });
  }

  const confirmarInput = document.getElementById('confirmarSenha');
  const toggleConfirmarBtn = document.getElementById('toggle-confirmar-senha');
  const iconeConfirmar = document.getElementById('icone-confirmar');
  if (toggleConfirmarBtn && confirmarInput && iconeConfirmar) {
    toggleConfirmarBtn.addEventListener('click', () => {
      alternarVisibilidadeSenha(confirmarInput, iconeConfirmar);
    });
  }

});
