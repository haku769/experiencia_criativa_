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

  if (!token) {
    if (mensagem) mensagem.textContent = 'Não autorizado. Faça login novamente.';
    return;
  }

  // Buscar dados do perfil
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

      if (nome) nome.value = NOME || '';
      if (email) email.value = EMAIL || '';
      if (telefone) telefone.value = TELEFONE || '';

      // Atualiza localStorage
      localStorage.setItem('usuarioLogado', JSON.stringify({
        nome: NOME,
        email: EMAIL,
        telefone: TELEFONE,
        cpf: CPF
      }));

      // Exibe imagem de perfil se existir
      if (CPF && imagemAtual) {
        imagemAtual.src = `http://localhost:3000/imagem/${CPF}`;
        imagemAtual.style.display = 'block';
      } else if (imagemAtual) {
        imagemAtual.style.display = 'none';
      }

      // Atualizar UI superior
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

  // Submeter alterações do perfil
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (senha && confirmarSenha && senha.value && senha.value !== confirmarSenha.value) {
        if (mensagem) mensagem.textContent = 'As senhas não coincidem.';
        return;
      }

      const formData = new FormData();
      if (nome) formData.append('nome', nome.value);
      if (email) formData.append('email', email.value);
      if (telefone) formData.append('telefone', telefone.value);
      if (fotoPerfilInput?.files[0]) formData.append('foto', fotoPerfilInput.files[0]);
      if (senha?.value) formData.append('senha', senha.value);

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
            if (mensagem) mensagem.textContent = 'Erro: ' + data.erro;
          } else {
           const mensagemTexto = document.getElementById('mensagemTexto');
            if (mensagem && mensagemTexto) {
              mensagemTexto.textContent = 'Perfil atualizado com sucesso!';
              mensagem.classList.remove('hidden');
              setTimeout(() => {
                mensagem.classList.add('opacity-100');
              }, 50); // pequeno delay para transição suave

              // Oculta após 4 segundos
              setTimeout(() => {
                mensagem.classList.remove('opacity-100');
                setTimeout(() => mensagem.classList.add('hidden'), 500);
              }, 4000);
            }

            if (senha) senha.value = '';
            if (confirmarSenha) confirmarSenha.value = '';

            // Atualiza os dados exibidos no localStorage, incluindo CPF atualizado
            const usuarioAtual = JSON.parse(localStorage.getItem('usuarioLogado')) || {};
            const usuarioAtualizado = {
              ...usuarioAtual,
              nome: nome?.value,
              email: email?.value,
              telefone: telefone?.value,
              cpf: data.CPF || usuarioAtual.cpf  // <-- Aqui a alteração
            };
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtualizado));

            const nomeUsuarioElement = document.getElementById('nome-usuario');
            if (nomeUsuarioElement) nomeUsuarioElement.textContent = nome.value;

            // Atualiza imagem de perfil com versão única (timestamp)
            const timestamp = Date.now();
            if (usuarioAtualizado?.cpf && imagemAtual) {
              imagemAtual.src = `http://localhost:3000/imagem/${usuarioAtualizado.cpf}?v=${timestamp}`;
              imagemAtual.style.display = 'block';
            }

            const fotoPerfilSuperior = document.getElementById('foto-perfil');
            if (usuarioAtualizado?.cpf && fotoPerfilSuperior) {
              fotoPerfilSuperior.src = `http://localhost:3000/imagem/${usuarioAtualizado.cpf}?v=${timestamp}`;
            }
          }
        })
        .catch(err => {
          if (mensagem) mensagem.textContent = 'Erro ao atualizar perfil.';
          console.error(err);
        });
    });
  }

  // Pré-visualização da imagem antes do envio
  if (fotoPerfilInput) {
    fotoPerfilInput.addEventListener('change', () => {
      const file = fotoPerfilInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (imagemAtual) {
            imagemAtual.src = e.target.result;
            imagemAtual.style.display = 'block';
          }
          const fotoPerfilSuperior = document.getElementById('foto-perfil');
          if (fotoPerfilSuperior) {
            fotoPerfilSuperior.src = e.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
});
