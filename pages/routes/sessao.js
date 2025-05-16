document.addEventListener("DOMContentLoaded", function () {
  const userInfo = document.getElementById("user-info");
  const userForm = document.getElementById('user-form');
  const loginLink = document.getElementById("login-link");
  const usuarioJSON = localStorage.getItem("usuarioLogado");
  const token = localStorage.getItem("token");



  if (!usuarioJSON) {
    document.getElementById("CrudUsuario").remove()
    document.getElementById("CrudVeiculos").remove()
    if (token){
       console.warn("[LIMPEZA] Removendo token inválido (usuário anônimo)");
       localStorage.removeItem("token");
    }
  }

  if (usuarioJSON) {
  try {
    const usuario = JSON.parse(usuarioJSON);
    console.log(usuario.FUNCAO);

    if (usuario && usuario.nome) {
      if (userInfo) {
        let fotoHTML = "";
        if (usuario.cpf) {
          fotoHTML = `<img src="http://localhost:3000/imagem/${usuario.cpf}" alt="FotoDoUsuario" class="foto-usuario">`;
        }


        userInfo.innerHTML = `
          <span class="user-welcome"> ${fotoHTML} <strong>${usuario.nome.split(" ")[0]}</strong></span>
          <button id="logout-btn" class="btn-login">Sair</button>
          <button id="editar-perfil-btn" class="btn-login">Editar Perfil</button>
        `;

        const logoutBtn = document.getElementById("logout-btn");
        logoutBtn?.addEventListener("click", function () {
          localStorage.removeItem("usuarioLogado");
          localStorage.removeItem("token");
          window.location.reload();
        });

        const editarPerfilBtn = document.getElementById("editar-perfil-btn");
        editarPerfilBtn?.addEventListener("click", function () {
          window.location.href = "/perfil.html"; // Redireciona para a página de edição
        });

        // Verifica a função do usuário (Admin ou outro)
        if (usuario.funcao !== "Admin") {
          document.getElementById("CrudUsuario").remove();
          document.getElementById("CrudVeiculos").remove();
        }

        console.log(usuario.funcao);
      }
    }
  } catch (e) {
    console.error("Erro ao ler usuário do localStorage:", e);
  }
}

carregarUsuarios();


  document.getElementById('user-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const telefone = document.getElementById('telefone').value;
    const funcao = document.getElementById('user-role').value;
    const senha = document.getElementById('senha').value;
    const bodyObj = { nome, email, telefone, funcao };
    if (senha) bodyObj.senha = senha;
    const body = JSON.stringify(bodyObj);

    console.log(currentUserId)

    if (currentUserId) {
      // Atualiza o usuario 
      await fetchAutenticado(`http://localhost:3000/usuarios/${currentUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body
      })
        .then(res => res.json())
        .then(() => {
          showPopup('Usuário atualizado com sucesso!');
          closeModal();
          setTimeout(() => location.reload(), 500);
        });
    } else {
      // Cria novo usuario
      const cpf = document.getElementById('cpf').value;
      const senha = document.getElementById('senha').value;
      const novoBody = JSON.stringify({ cpf, nome, email, telefone, senha });

      await fetchAutenticado('http://localhost:3000/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: novoBody
      })
      .then(res => res.json())
      .then(() => {
        showPopup('Usuário adicionado com sucesso!');
        closeModal();
        carregarUsuarios(); 
      });
      
    }
  });

  document.querySelector('.avatar-preview')?.addEventListener('click', () => {
    document.getElementById('avatar-upload').click();
  });

  document.querySelector('.avatar-upload-btn button')?.addEventListener('click', () => {
    document.getElementById('avatar-upload').click();
  });

  document.getElementById('avatar-upload')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        document.getElementById('avatar-preview-img').src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
});

let currentUserId = null;

function bufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function carregarUsuarios() {
  await fetchAutenticado('http://localhost:3000/usuarios')
    .then(res => res.json())
    .then(usuarios => {
      const tabela = document.getElementById('users-table-body');
      if (!tabela) return;

      tabela.innerHTML = '';
      usuarios.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><img src="/fotos/comercial.png" class="avatar-table"></td>
          <td>${usuario.NOME}</td>
          <td>${usuario.EMAIL}</td>
          <td>${usuario.FUNCAO || 'Cliente'}</td>
          <td>
            <button onclick="viewUser('${usuario.CPF}')">👁️</button>
            <button onclick="editUser('${usuario.CPF}')">✏️</button>
            <button onclick="deleteUser('${usuario.CPF}')">🗑️</button>
          </td>
        `;
        tabela.appendChild(tr);
      });
      console.log('Tabela de usuários carregada com sucesso!', usuarios);
    });
}

function openModal(isEdit = false) {
  document.getElementById('modal-title').textContent = isEdit ? 'Editar Usuário' : 'Adicionar Usuário';
  document.getElementById('user-modal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function addUser() {
  openModal(false);
}

function closeModal() {
  document.getElementById('user-modal').style.display = 'none';
  document.body.style.overflow = '';
  resetForm();
}

function openDeleteModal(userId) {
  document.getElementById('delete-user-name').textContent = 'este usuário';
  currentUserId = userId;
  document.getElementById('delete-modal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
  document.getElementById('delete-modal').style.display = 'none';
  document.body.style.overflow = '';
  currentUserId = null;
}

function resetForm() {
  document.getElementById('user-form').reset();
  document.getElementById('avatar-preview-img').src = '/fotos/comercial.png';
  currentUserId = null;

  document.querySelectorAll('.form-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById('tab-personal').classList.add('active');
}

async function editUser(cpf) {
  currentUserId = cpf;

  await fetchAutenticado(`http://localhost:3000/usuarios/${cpf}`)
    .then(res => {
      if (!res.ok) throw new Error('Usuário não encontrado');
      return res.json();
    })
    .then(usuario => {
      document.getElementById('nome').value = usuario.NOME;
      document.getElementById('email').value = usuario.EMAIL;
      document.getElementById('telefone').value = usuario.TELEFONE;
      document.getElementById('cpf').value = usuario.CPF;
      document.getElementById('user-role').value = usuario.FUNCAO || '';
      document.getElementById('senha').value = '';

      openModal(true);
    })
    .catch(err => console.error('Erro ao buscar usuário:', err));
}


function viewUser(cpf) {
  showPopup(`Visualizando detalhes do usuário CPF ${cpf}`);
}

async function deleteUser(cpf) {
  openDeleteModal(cpf);
}
//  deletar o usuário
async function confirmDelete() {
  if (currentUserId) {
    await fetchAutenticado(`http://localhost:3000/usuarios/${currentUserId}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(() => {
        showPopup('Usuário excluído com sucesso!');
        closeDeleteModal();
        setTimeout(() => location.reload(), 500);
      });
  }
}

function showPopup(message) {
  // Se já existe um popup, remove
  const existingOverlay = document.getElementById('custom-popup-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // Cria o overlay de fundo
  const overlay = document.createElement('div');
  overlay.id = 'custom-popup-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '10000';

  // Cria o popup
  const popup = document.createElement('div');
  popup.style.backgroundColor = '#fff';
  popup.style.padding = '30px';
  popup.style.borderRadius = '10px';
  popup.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
  popup.style.width = '400px';
  popup.style.maxWidth = '90%';
  popup.style.textAlign = 'center';
  popup.style.fontFamily = 'Arial, sans-serif';
  popup.style.fontSize = '18px';
  popup.style.position = 'relative';

  // Mensagem
  const messageEl = document.createElement('div');
  messageEl.innerText = message;

  // Botão fechar
  const closeBtn = document.createElement('button');
  closeBtn.innerText = 'Fechar';
  closeBtn.style.marginTop = '20px';
  closeBtn.style.padding = '10px 20px';
  closeBtn.style.backgroundColor = '#333';
  closeBtn.style.color = '#fff';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '5px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.onclick = function() {
    overlay.remove();
  };

  // Monta o popup
  popup.appendChild(messageEl);
  popup.appendChild(closeBtn);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

// ========== NOVAS FUNÇÕES DE AUTENTICAÇÃO ==========

function isTokenExpirado(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const agora = Math.floor(Date.now() / 1000);

    console.log('[TOKEN] expira em:', payload.exp, '| agora:', agora);

    return payload.exp < agora;
  } catch (e) {
    console.error('[TOKEN] Erro ao verificar expiração:', e);
    return true;
  }
}


async function renovarToken() {
  const usuarioJSON = localStorage.getItem("usuarioLogado");
  if (!usuarioJSON) return null;

  try {
    const usuario = JSON.parse(usuarioJSON);
    const refreshToken = usuario.refreshToken;

    const res = await fetch('http://localhost:3000/autenticacao/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!res.ok) throw new Error('Erro ao renovar token');

    const { token } = await res.json();

    localStorage.setItem('token', token);

    return token;
  } catch (err) {
    console.error('Falha ao renovar token:', err);
    return null;
  }
}

async function fetchAutenticado(url, options = {}) {
  let token = localStorage.getItem('token');
  const usuarioJSON = localStorage.getItem('usuarioLogado');

  if (!usuarioJSON) {
    return fetch(url, options); 
  }

  if (isTokenExpirado(token)) {
    token = await renovarToken();
    if (!token) {
      alert('Sessão expirada. Faça login novamente.');
      localStorage.removeItem('token');
      localStorage.removeItem('usuarioLogado');
      window.location.href = '/autenticacao.html';
      return;
    }
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  const finalOptions = { ...options, headers };

  return fetch(url, finalOptions);
}
const usuario = JSON.parse(localStorage.getItem('usuarioLogado')); // chave correta

if (usuario) {
  const loginLink = document.getElementById('login-link');
  const perfilArea = document.getElementById('perfil-area');
  const nomeUsuario = document.getElementById('nome-usuario');
  const fotoPerfil = document.getElementById('foto-perfil');

  if (loginLink) loginLink.style.display = 'none';
  if (perfilArea) perfilArea.style.display = 'flex';
  if (nomeUsuario) nomeUsuario.textContent = usuario.nome?.split(" ")[0] || 'Perfil';
  if (fotoPerfil && usuario.foto && usuario.foto.data) {
    const fotoBase64 = bufferToBase64(usuario.foto.data);
    fotoPerfil.src = `data:image/jpeg;base64, ${fotoBase64}`;
  }
}
