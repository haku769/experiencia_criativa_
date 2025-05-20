let currentUserId = null;

document.addEventListener("DOMContentLoaded", function () {
  // Referências do DOM
  const userInfo = document.getElementById("user-info");
  const userForm = document.getElementById('user-form');
  const loginLink = document.getElementById("login-link");
  const crudUsuario = document.getElementById("CrudUsuario");
  const crudVeiculos = document.getElementById("CrudVeiculos");

  // Pega dados do localStorage
  const usuarioJSON = localStorage.getItem("usuarioLogado");
  const token = localStorage.getItem("token");

  // Função para remover elementos do DOM com segurança
  function removeElement(element) {
    if (element) element.remove();
  }
  

  // Se não tem usuário logado, remove as seções do CRUD
  if (!usuarioJSON) {
    removeElement(crudUsuario);
    removeElement(crudVeiculos);

    // Remove token inválido caso exista
    if (token) {
      console.warn("[LIMPEZA] Removendo token inválido (usuário anônimo)");
      localStorage.removeItem("token");
    }
  }

  // Se tem usuário logado, mostra informações e controla permissões
  if (usuarioJSON) {
    try {
      const usuario = JSON.parse(usuarioJSON);

      if (usuario && usuario.nome && userInfo) {
        // Monta a imagem do usuário se tiver CPF
        let fotoHTML = usuario.cpf
          ? `<img src="http://localhost:3000/imagem/${usuario.cpf}" alt="FotoDoUsuario" class="foto-usuario">`
          : "";

        // Insere nome e botões
        userInfo.innerHTML = `
          <span class="user-welcome">${fotoHTML} <strong>${usuario.nome.split(" ")[0]}</strong></span>
          <button id="logout-btn" class="btn-login">Sair</button>
          <button id="editar-perfil-btn" class="btn-login">Editar Perfil</button>
        `;

        // Botão logout
        const logoutBtn = document.getElementById("logout-btn");
        logoutBtn?.addEventListener("click", () => {
          localStorage.removeItem("usuarioLogado");
          localStorage.removeItem("token");
          window.location.reload();
        });

        // Botão editar perfil
        const editarPerfilBtn = document.getElementById("editar-perfil-btn");
        editarPerfilBtn?.addEventListener("click", () => {
          window.location.href = "/perfil.html";
        });

        // Remove CRUDs para usuários que não são Admin
        if (usuario.funcao !== "Admin") {
          removeElement(crudUsuario);
          removeElement(crudVeiculos);
        }

      }
    } catch (e) {
      console.error("Erro ao ler usuário do localStorage:", e);
    }
  }

  // Se não existe o formulário, termina aqui
  if (!userForm) return;

  // Evento submit do formulário (criar/editar usuário)
  userForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Cria FormData com os campos do formulário
    const formData = new FormData();
    const nome = document.getElementById('nome')?.value;
    const email = document.getElementById('email')?.value;
    const telefone = document.getElementById('telefone')?.value;
    const funcao = document.getElementById('user-role')?.value;
    const senha = document.getElementById('senha')?.value;
    const cpf = document.getElementById('cpf')?.value;
    const imagem = document.getElementById('avatar-upload')?.files[0];

    if (nome) formData.append('nome', nome);
    if (email) formData.append('email', email);
    if (telefone) formData.append('telefone', telefone);
    if (funcao) formData.append('funcao', funcao);
    if (senha) formData.append('senha', senha);
    if (cpf) formData.append('cpf', cpf);
    if (imagem) formData.append('foto', imagem);

    // Verifica se é edição (PUT) ou criação (POST)
    try {
      if (currentUserId) {
        // Atualizar usuário existente
        const response = await fetchAutenticado(`http://localhost:3000/usuarios/${currentUserId}`, {
          method: 'PUT',
          body: formData
        });

        const usuarioAtualizado = await response.json();

        showPopup('Usuário atualizado com sucesso!');
        closeModal();

        // Atualiza localStorage se for o usuário logado
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (usuarioLogado && usuarioLogado.CPF === usuarioAtualizado.CPF) {
          localStorage.setItem('usuarioLogado', JSON.stringify({
          nome: usuarioAtualizado.NOME,
          email: usuarioAtualizado.EMAIL,
          cpf: usuarioAtualizado.CPF,
          telefone: usuarioAtualizado.TELEFONE,
          funcao: usuarioAtualizado.FUNCAO,
        }));
        }

        carregarUsuarios()

      } else {
        // Criar novo usuário
        const response = await fetchAutenticado(`http://localhost:3000/usuarios`, {
          method: 'POST',
          body: formData
        });

        await response.json();

        showPopup('Usuário criado com sucesso!');
        closeModal();

        carregarUsuarios()
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      showPopup('Erro ao processar a solicitação. Tente novamente.');
    }
  });
});
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
carregarUsuarios();



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
          <td><img src="http://localhost:3000/imagem/${usuario.CPF}" class="avatar-table"></td>
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

  // document.querySelectorAll('.form-tab-content').forEach(content => {
  //   content.classList.remove('active');
  // });
  // document.getElementById('tab-personal').classList.add('active');
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

      // Adiciona timestamp para evitar cache da imagem
      const timestamp = new Date().getTime();
      const fotoUrl = `http://localhost:3000/imagem/${usuario.CPF}?t=${timestamp}`;

      // Atualiza a imagem do avatar na tela
      document.getElementById('avatar-preview-img').src = fotoUrl;

      // Atualiza a foto no localStorage se o usuário logado for o mesmo que está sendo editado
      const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
      if (usuarioLogado && usuarioLogado.CPF === usuario.CPF) {
        usuarioLogado.foto = fotoUrl;  // ou o nome da propriedade que você usa para a foto
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
      }
      carregarUsuarios()

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
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  }
}

function confirmPopup(message) {
  return new Promise((resolve) => {
    // Se já existe um popup, remove
    const existingOverlay = document.getElementById('custom-popup-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Cria o overlay
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

    // Botões
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '15px';

    const confirmBtn = document.createElement('button');
    confirmBtn.innerText = 'Confirmar';
    confirmBtn.style.padding = '10px 20px';
    confirmBtn.style.backgroundColor = '#28a745';
    confirmBtn.style.color = '#fff';
    confirmBtn.style.border = 'none';
    confirmBtn.style.borderRadius = '5px';
    confirmBtn.style.cursor = 'pointer';

    const cancelBtn = document.createElement('button');
    cancelBtn.innerText = 'Cancelar';
    cancelBtn.style.padding = '10px 20px';
    cancelBtn.style.backgroundColor = '#dc3545';
    cancelBtn.style.color = '#fff';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '5px';
    cancelBtn.style.cursor = 'pointer';

    confirmBtn.onclick = () => {
      overlay.remove();
      resolve(true);
    };

    cancelBtn.onclick = () => {
      overlay.remove();
      resolve(false);
    };

    // Monta o popup
    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);
    popup.appendChild(messageEl);
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Fechar ao clicar fora do popup
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    };
  });
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
      showPopup('Sessão expirada. Faça login novamente.');
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
// Máscara para telefone (formato: (00) 00000-0000)
const telefoneInput = document.getElementById('telefone');
telefoneInput.addEventListener('input', function(e) {
  let valor = e.target.value.replace(/\D/g, ''); // remove tudo que não for número
  
  if (valor.length > 11) {
    valor = valor.slice(0, 11); // limita a 11 dígitos
  }
  
  // Formata telefone
  if (valor.length > 6) {
    valor = valor.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
  } else if (valor.length > 2) {
    valor = valor.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
  } else if (valor.length > 0) {
    valor = valor.replace(/^(\d{0,2}).*/, '($1');
  }
  
  e.target.value = valor;
});


// Máscara para CPF (formato: 000.000.000-00)
const cpfInput = document.getElementById('cpf');
cpfInput.addEventListener('input', function(e) {
  let valor = e.target.value.replace(/\D/g, ''); // remove tudo que não for número
  
  if (valor.length > 11) {
    valor = valor.slice(0, 11); // limita a 11 dígitos
  }
  
  // Formata CPF
  if (valor.length > 9) {
    valor = valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, '$1.$2.$3-$4');
  } else if (valor.length > 6) {
    valor = valor.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, '$1.$2.$3');
  } else if (valor.length > 3) {
    valor = valor.replace(/^(\d{3})(\d{0,3}).*/, '$1.$2');
  }
  
  e.target.value = valor;
});
const emailInput = document.getElementById('email');
emailInput.addEventListener('input', function(e) {
  let valor = e.target.value;

  // Remove o domínio se o usuário tentar digitar algo diferente
  valor = valor.replace(/@[^@]*$/, '');

  // Adiciona @gmail.com automaticamente se ainda não tiver
  if (!valor.endsWith('@gmail.com')) {
    valor = valor + '@gmail.com';
  }

  e.target.value = valor;
});
const senhaInput = document.getElementById('senha');
const confirmarInput = document.getElementById('confirmar-senha');

senhaInput.addEventListener('input', validarSenhas);
confirmarInput.addEventListener('input', validarSenhas);

function validarSenhaSegura(senha) {
  const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+{}\[\]:;"'<>,.?/~\\-]).{8,}$/;
  return regex.test(senha);
}

function validarSenhas() {
  const senha = senhaInput.value;
  const confirmar = confirmarInput.value;

  const senhaValida = validarSenhaSegura(senha);
  const confirmacaoCorreta = senha === confirmar && confirmar.length > 0;

  // Cor da senha
  senhaInput.style.borderColor = senhaValida ? 'green' : 'red';

  // Cor da confirmação
  confirmarInput.style.borderColor = confirmacaoCorreta ? 'green' : 'red';
}