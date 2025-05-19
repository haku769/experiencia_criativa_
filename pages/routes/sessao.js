// Refatorado para melhor organização, clareza e modularidade

let currentUserId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem('token');
  const usuarioJSON = localStorage.getItem("usuarioLogado");

  if (!usuarioJSON) {
    removeCrudIfAnonymous();
    if (token) localStorage.removeItem("token");
  } else {
    try {
      const usuario = JSON.parse(usuarioJSON);
      if (usuario && usuario.nome) renderUserInfo(usuario);
    } catch (e) {
      console.error("Erro ao ler usuário do localStorage:", e);
    }
  }

  await carregarUsuarios();
  setupFormHandlers();
  setupAvatarHandlers();
});

// Funções de verificação de acesso - NOVAS FUNÇÕES
function isLoggedIn() {
  return localStorage.getItem('usuarioLogado') !== null;
}

function isAdmin() {
  try {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
    return usuario.funcao === 'Admin';
  } catch (e) {
    console.error("Erro ao verificar função do usuário:", e);
    return false;
  }
}

function protectAdminRoute() {
  if (!isLoggedIn()) {
    window.location.href = '/autenticacao.html';
    return false;
  }
  
  if (!isAdmin()) {
    window.location.href = '/unauthorized.html';
    return false;
  }
  
  return true;
}
// Fim das novas funções

function removeCrudIfAnonymous() {
  document.getElementById("CrudUsuario")?.remove();
  document.getElementById("CrudVeiculos")?.remove();
}

function renderUserInfo(usuario) {
  const userInfo = document.getElementById("user-info");
  if (!userInfo) return;

  const fotoHTML = usuario.cpf ? `<img src="http://localhost:3000/imagem/${usuario.cpf}" alt="FotoDoUsuario" class="foto-usuario">` : "";
  userInfo.innerHTML = `
    <span class="user-welcome">${fotoHTML} <strong>${usuario.nome.split(" ")[0]}</strong></span>
    <button id="logout-btn" class="btn-login">Sair</button>
    <button id="editar-perfil-btn" class="btn-login">Editar Perfil</button>
  `;

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("token");
    window.location.reload();
  });

  document.getElementById("editar-perfil-btn")?.addEventListener("click", () => {
    window.location.href = "/perfil.html";
  });

  if (usuario.funcao !== "Admin") removeCrudIfAnonymous();
}

// Resto do código original sem alterações
function addUser() { 
  resetForm();          
  openModal(false);     
}

async function carregarUsuarios() {
  const tabela = document.getElementById('users-table-body');
  if (!tabela) return;

  const usuarios = await fetchAutenticadoJson('http://localhost:3000/usuarios');
  tabela.innerHTML = '';

  usuarios.forEach(usuario => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <img src="http://localhost:3000/imagem/${usuario.CPF}" alt="Avatar" class="avatar-table" onerror="this.src='/fotos/comercial.png'">
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
}

function collectFormData() {
  return {
    nome: document.getElementById('nome').value,
    email: document.getElementById('email').value,
    telefone: document.getElementById('telefone').value,
    funcao: document.getElementById('user-role').value,
    senha: document.getElementById('senha').value
  };
}

function setupFormHandlers() {
  document.getElementById('user-form')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const data = collectFormData();
    const token = localStorage.getItem('token');

    if (currentUserId) {
      await fetchAutenticado(`http://localhost:3000/usuarios/${currentUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      showPopup('Usuário atualizado com sucesso!');
      closeModal();
      setTimeout(() => location.reload(), 500);
    } else {
      const cpf = document.getElementById('cpf').value;
      const senha = document.getElementById('senha').value;

      console.log('Dados para cadastro:', { cpf, ...data, senha });
      ;

      await fetchAutenticado('http://localhost:3000/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...data, cpf, senha })
      });
      showPopup('Usuário adicionado com sucesso!');
      closeModal();
      carregarUsuarios();
    }
  });
}

function setupAvatarHandlers() {
  document.querySelector('.avatar-preview')?.addEventListener('click', () => document.getElementById('avatar-upload').click());
  document.querySelector('.avatar-upload-btn button')?.addEventListener('click', () => document.getElementById('avatar-upload').click());
  document.getElementById('avatar-upload')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => document.getElementById('avatar-preview-img').src = e.target.result;
      reader.readAsDataURL(file);
    }
  });
}

function openModal(isEdit = false) {
  document.getElementById('modal-title').textContent = isEdit ? 'Editar Usuário' : 'Adicionar Usuário';
  document.getElementById('user-modal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('user-modal').style.display = 'none';
  document.body.style.overflow = '';
  resetForm();
}

function resetForm() {
  document.getElementById('user-form')?.reset();
  const previewImg = document.getElementById('avatar-preview-img');
  if (previewImg) previewImg.src = '/fotos/comercial.png';

  currentUserId = null;

  document.querySelectorAll('.form-tab-content').forEach(content => {
    content.classList.remove('active');
  });

  const tabPersonal = document.getElementById('tab-personal');
  if (tabPersonal) {
    tabPersonal.classList.add('active');
  }
}

function viewUser(cpf) {
  showPopup(`Visualizando detalhes do usuário CPF ${cpf}`);
}

async function editUser(cpf) {
  currentUserId = cpf;
  const usuario = await fetchAutenticadoJson(`http://localhost:3000/usuarios/${cpf}`);
  document.getElementById('nome').value = usuario.NOME;
  document.getElementById('email').value = usuario.EMAIL;
  document.getElementById('telefone').value = usuario.TELEFONE;
  document.getElementById('cpf').value = usuario.CPF;
  document.getElementById('user-role').value = usuario.FUNCAO || '';
  document.getElementById('senha').value = '';
  openModal(true);
}

async function deleteUser(cpf) {
  openDeleteModal(cpf);
}

async function confirmDelete() {
  if (currentUserId) {
    await fetchAutenticado(`http://localhost:3000/usuarios/${currentUserId}`, { method: 'DELETE' });
    showPopup('Usuário excluído com sucesso!');
    closeDeleteModal();
    setTimeout(() => location.reload(), 500);
  }
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

function showPopup(message) {
  document.getElementById('custom-popup-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'custom-popup-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';

  const popup = document.createElement('div');
  popup.style.cssText = 'background:#fff;padding:30px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.3);width:400px;max-width:90%;text-align:center;font-family:Arial,sans-serif;font-size:18px;';

  const messageEl = document.createElement('div');
  messageEl.innerText = message;

  const closeBtn = document.createElement('button');
  closeBtn.innerText = 'Fechar';
  closeBtn.style.cssText = 'margin-top:20px;padding:10px 20px;background:#333;color:#fff;border:none;border-radius:5px;cursor:pointer;';
  closeBtn.onclick = () => overlay.remove();

  popup.appendChild(messageEl);
  popup.appendChild(closeBtn);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}

function isTokenExpirado(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp < Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}

async function renovarToken() {
  const usuarioJSON = localStorage.getItem("usuarioLogado");
  if (!usuarioJSON) return null;

  try {
    const { refreshToken } = JSON.parse(usuarioJSON);
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

async function fetchAutenticadoJson(url, options = {}) {
  const token = await garantirTokenValido();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
  return res.json();
}

async function fetchAutenticado(url, options = {}) {
  const token = await garantirTokenValido();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
}

async function garantirTokenValido() {
  const token = localStorage.getItem('token');
  return isTokenExpirado(token) ? await renovarToken() : token;
}