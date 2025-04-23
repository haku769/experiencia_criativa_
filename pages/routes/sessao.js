document.addEventListener("DOMContentLoaded", function () {
  const userInfo = document.getElementById("user-info");
  const loginLink = document.getElementById("login-link");
  const usuarioJSON = localStorage.getItem("usuarioLogado");
  const token = localStorage.getItem("token");



  if (!usuarioJSON && token) {
    console.warn("[LIMPEZA] Removendo token inválido (usuário anônimo)");
    localStorage.removeItem("token");
  }

  if (usuarioJSON) {
    try {
      const usuario = JSON.parse(usuarioJSON);
      if (usuario && usuario.nome) {
        if (userInfo) {
          let fotoHTML = "";
          if (usuario.foto && usuario.foto.data) {
            const fotoBase64 = bufferToBase64(usuario.foto.data);
            fotoHTML = `<img src="data:image/jpeg;base64, ${fotoBase64}" alt="FotoDoUsuario" class="foto-usuario">`;
          }
          userInfo.innerHTML = `
            <span class="user-welcome"> ${fotoHTML} <strong>${usuario.nome.split(" ")[0]}</strong></span>
            <button id="logout-btn" class="btn-login">Sair</button>
          `;

          const logoutBtn = document.getElementById("logout-btn");
          logoutBtn?.addEventListener("click", function () {
            localStorage.removeItem("usuarioLogado");
            localStorage.removeItem("token");
            window.location.reload();
          });
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

    const body = JSON.stringify({ nome, email, telefone });
    console.log(currentUserId)

    if (currentUserId) {
      // Atualiza
      await fetchAutenticado(`http://localhost:3000/usuarios/${currentUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body
      })
        .then(res => res.json())
        .then(() => {
          alert('Usuário atualizado com sucesso!');
          closeModal();
          setTimeout(() => location.reload(), 500);
        });
    } else {
      // Cria novo
      const cpf = document.getElementById('cpf').value;
      const senha = '123';

      const novoBody = JSON.stringify({ cpf, nome, email, telefone, senha });

      await fetchAutenticado('http://localhost:3000/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: novoBody
      })
      .then(res => res.json())
      .then(() => {
        alert('Usuário adicionado com sucesso!');
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
      const tabela = document.getElementById('user-table-body');
      if (!tabela) return;

      tabela.innerHTML = '';
      usuarios.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><img src="/fotos/comercial.png" class="avatar-table"></td>
          <td>${usuario.NomeUsuario}</td>
          <td>${usuario.EmailUsuario}</td>
          <td>${usuario.FuncaoUsuario || 'N/A'}</td>
          <td>
            <button onclick="viewUser('${usuario.CPFUsuario}')">👁️</button>
            <button onclick="editUser('${usuario.CPFUsuario}')">✏️</button>
            <button onclick="deleteUser('${usuario.CPFUsuario}')">🗑️</button>
          </td>
        `;
        tabela.appendChild(tr);
      });
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

  await fetchAutenticado('http://localhost:3000/usuarios')
    .then(res => res.json())
    .then(usuarios => {
      const usuario = usuarios.find(u => u.CPFUsuario === cpf);
      if (usuario) {
        document.getElementById('nome').value = usuario.NomeUsuario;
        document.getElementById('email').value = usuario.EmailUsuario;
        document.getElementById('telefone').value = usuario.TelUsuario;
        openModal(true);
      }
    });
}

function viewUser(cpf) {
  alert(`Visualizando detalhes do usuário CPF ${cpf}`);
}

async function deleteUser(cpf) {
  openDeleteModal(cpf);
}

async function confirmDelete() {
  if (currentUserId) {
    await fetchAutenticado(`http://localhost:3000/usuarios/${currentUserId}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(() => {
        alert('Usuário excluído com sucesso!');
        closeDeleteModal();
        setTimeout(() => location.reload(), 500);
      });
  }
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
      window.location.href = '/pages/autenticacao.html';
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
