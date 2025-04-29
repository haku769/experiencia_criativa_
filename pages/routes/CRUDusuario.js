import { showPopup } from "./autenticacao";

// Variáveis globais
let currentUserId = null;

// Função para carregar a lista de usuários
async function loadUsers() {
    try {
        const response = await fetch('http://localhost:3000/usuarios');
        if (!response.ok) {
            throw new Error('Erro ao carregar usuários');
        }
        const users = await response.json();
        renderUserList(users);
    } catch (error) {
        console.error(error);
    }
}

// Função para renderizar a lista de usuários
function renderUserList(users) {
    const userListContainer = document.getElementById('user-list');
    userListContainer.innerHTML = ''; // Limpar lista atual

    users.forEach(user => {
        const userRow = document.createElement('tr');
        userRow.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${user.status}</td>
            <td>
                <button onclick="editUser(${user.id})">Editar</button>
                <button onclick="deleteUser(${user.id})">Excluir</button>
            </td>
        `;
        userListContainer.appendChild(userRow);
    });
}

// Função para adicionar um novo usuário
async function addUser() {
    openModal(false);
}

async function submitUserForm(e) {
    e.preventDefault();

    const user = {
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        role: document.getElementById('user-role').value,
        status: document.getElementById('user-status').value,
        phone: document.getElementById('user-phone').value || '',
        department: document.getElementById('user-department').value || '',
        notes: document.getElementById('user-notes').value || '',
        permissions: Array.from(document.querySelectorAll('input[name="permissions[]"]:checked')).map(cb => cb.value),
        password: document.getElementById('user-password').value,
    };

    // Validação de senhas
    const password = document.getElementById('user-password').value;
    const passwordConfirm = document.getElementById('user-password-confirm').value;
    if (password && password !== passwordConfirm) {
        showPopup('As senhas não coincidem!');
        return;
    }

    try {
        const response = await fetch(currentUserId ? `http://localhost:3000/usuarios/${currentUserId}` : 'http://localhost:3000/usuarios', {
            method: currentUserId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });

        if (!response.ok) {
            throw new Error(currentUserId ? 'Erro ao atualizar o usuário' : 'Erro ao adicionar o usuário');
        }

        showPopup(`Usuário ${currentUserId ? 'atualizado' : 'adicionado'} com sucesso!`);
        closeModal();
        loadUsers(); // Recarregar a lista de usuários
    } catch (error) {
        console.error(error);
    }
}

// Função para editar um usuário
async function editUser(userId) {
    try {
        const response = await fetch(`http://localhost:3000/usuarios/${userId}`);
        if (!response.ok) {
            throw new Error('Erro ao carregar dados do usuário');
        }

        const user = await response.json();
        fillForm(user);
        currentUserId = userId;
        openModal(true);
    } catch (error) {
        console.error(error);
    }
}

// Função para excluir um usuário
async function deleteUser(userId) {
    openDeleteModal(userId);
}

async function confirmDelete() {
    if (currentUserId) {
        try {
            const response = await fetch(`http://localhost:3000/usuarios/${currentUserId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Erro ao excluir o usuário');
            }

            showPopup(`Usuário ID ${currentUserId} excluído com sucesso!`);
            closeDeleteModal();
            loadUsers(); // Recarregar a lista de usuários
        } catch (error) {
            console.error(error);
        }
    }
}

// Preencher o formulário de edição com os dados do usuário
function fillForm(user) {
    document.getElementById('user-id').value = user.id;
    document.getElementById('user-name').value = user.name;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-role').value = user.role;
    document.getElementById('user-status').value = user.status;
    document.getElementById('user-phone').value = user.phone || '';
    document.getElementById('user-department').value = user.department || '';
    document.getElementById('user-notes').value = user.notes || '';

    document.querySelectorAll('input[name="permissions[]"]').forEach(cb => cb.checked = false);

    if (user.permissions) {
        user.permissions.forEach(p => {
            const checkbox = document.getElementById(`perm-${p}`);
            if (checkbox) checkbox.checked = true;
        });
    }
}

// Resetar o formulário de edição
function resetForm() {
    document.getElementById('user-form').reset();
    currentUserId = null;

    document.querySelectorAll('input[name="permissions[]"]').forEach(cb => cb.checked = false);

    document.querySelectorAll('.form-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector('.form-tab[data-tab="personal"]').classList.add('active');

    document.querySelectorAll('.form-tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById('tab-personal').classList.add('active');
}

// Modais
function openModal(isEdit = false) {
    const modal = document.getElementById('user-modal');
    const modalTitle = document.getElementById('modal-title');
    modalTitle.textContent = isEdit ? 'Editar Usuário' : 'Adicionar Usuário';
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('user-modal').style.display = 'none';
    document.body.style.overflow = '';
    resetForm();
}

function openDeleteModal(userId) {
    const user = user.find(u => u.id === userId);
    if (user) {
        document.getElementById('delete-user-name').textContent = user.name;
        currentUserId = userId;
        document.getElementById('delete-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    document.body.style.overflow = '';
    currentUserId = null;
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadUsers(); // Carregar os usuários ao iniciar

    document.getElementById('btn-add-user').addEventListener('click', addUser);
    document.getElementById('user-form').addEventListener('submit', submitUserForm);


});
