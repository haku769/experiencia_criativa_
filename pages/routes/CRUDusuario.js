// Dados de exemplo (simulando um banco de dados)
const users = [
  {
      id: 1,
      name: "João Silva",
      email: "joao.silva@autoelite.com.br",
      role: "Administrador",
      status: "Ativo",
      lastLogin: "10/04/2023 14:30",
      phone: "(11) 98765-4321",
      department: "Diretoria",
      permissions: ["dashboard", "vehicles", "users", "customers", "sales", "reports", "settings", "marketing"],
      notes: "Administrador principal do sistema."
  },
  {
      id: 2,
      name: "Maria Santos",
      email: "maria.santos@autoelite.com.br",
      role: "Gerente",
      status: "Ativo",
      lastLogin: "09/04/2023 09:15",
      phone: "(11) 98765-1234",
      department: "Vendas",
      permissions: ["dashboard", "vehicles", "customers", "sales", "reports"],
      notes: "Gerente de vendas responsável pela equipe sul."
  },
  {
      id: 3,
      name: "Carlos Oliveira",
      email: "carlos.oliveira@autoelite.com.br",
      role: "Vendedor",
      status: "Ativo",
      lastLogin: "08/04/2023 16:45",
      phone: "(11) 91234-5678",
      department: "Vendas",
      permissions: ["dashboard", "vehicles", "customers", "sales"],
      notes: "Vendedor do mês em março de 2023."
  },
  {
      id: 4,
      name: "Ana Pereira",
      email: "ana.pereira@autoelite.com.br",
      role: "Vendedor",
      status: "Inativo",
      lastLogin: "01/04/2023 10:20",
      phone: "(11) 99876-5432",
      department: "Vendas",
      permissions: ["dashboard", "vehicles", "customers", "sales"],
      notes: "Afastada temporariamente por motivos de saúde."
  },
  {
      id: 5,
      name: "Roberto Almeida",
      email: "roberto.almeida@autoelite.com.br",
      role: "Suporte",
      status: "Pendente",
      lastLogin: null,
      phone: "(11) 95555-9999",
      department: "TI",
      permissions: ["dashboard"],
      notes: "Novo funcionário, aguardando treinamento."
  }
];

// Variáveis globais
let currentUserId = null;

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
  const user = users.find(u => u.id === userId);
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

// CRUD
function addUser() {
  openModal(false);
}

function editUser(userId) {
  const user = users.find(u => u.id === userId);
  if (user) {
      fillForm(user);
      currentUserId = userId;
      openModal(true);
  }
}

function viewUser(userId) {
  const user = users.find(u => u.id === userId);
  if (user) alert(`Visualizando detalhes de ${user.name}`);
}

function deleteUser(userId) {
  openDeleteModal(userId);
}

function confirmDelete() {
  if (currentUserId) {
      alert(`Usuário ID ${currentUserId} excluído com sucesso!`);
      closeDeleteModal();
      setTimeout(() => location.reload(), 500);
  }
}

// Formulário
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

function resetForm() {
  document.getElementById('user-form').reset();
  document.getElementById('avatar-preview-img').src = '/placeholder.svg?height=100&width=100';
  currentUserId = null;

  document.querySelectorAll('input[name="permissions[]"]').forEach(cb => cb.checked = false);

  document.querySelectorAll('.form-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelector('.form-tab[data-tab="personal"]').classList.add('active');

  document.querySelectorAll('.form-tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById('tab-personal').classList.add('active');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-add-user').addEventListener('click', addUser);

  document.getElementById('user-form').addEventListener('submit', e => {
      e.preventDefault();

      const password = document.getElementById('user-password').value;
      const passwordConfirm = document.getElementById('user-password-confirm').value;

      if (password && password !== passwordConfirm) {
          alert('As senhas não coincidem!');
          return;
      }

      alert(`Usuário ${currentUserId ? 'atualizado' : 'adicionado'} com sucesso!`);
      closeModal();
      setTimeout(() => location.reload(), 500);
  });

  // Upload de avatar
  document.querySelector('.avatar-preview').addEventListener('click', () => {
      document.getElementById('avatar-upload').click();
  });

  document.querySelector('.avatar-upload-btn button').addEventListener('click', () => {
      document.getElementById('avatar-upload').click();
  });

  document.getElementById('avatar-upload').addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = e => {
              document.getElementById('avatar-preview-img').src = e.target.result;
          };
          reader.readAsDataURL(file);
      }
  });

  // Abas
  document.querySelectorAll('.form-tab').forEach(tab => {
      tab.addEventListener('click', function () {
          document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
          this.classList.add('active');

          const tabId = this.getAttribute('data-tab');
          document.querySelectorAll('.form-tab-content').forEach(content => content.classList.remove('active'));
          document.getElementById(`tab-${tabId}`).classList.add('active');
      });
  });

  // Mostrar/ocultar senha
  document.querySelectorAll('.toggle-password').forEach(button => {
      button.addEventListener('click', function () {
          const input = this.previousElementSibling;
          const icon = this.querySelector('i');
          input.type = input.type === 'password' ? 'text' : 'password';
          icon.classList.toggle('fa-eye');
          icon.classList.toggle('fa-eye-slash');
      });
  });

  // Selecionar/deselecionar permissões
  document.getElementById('select-all-permissions').addEventListener('click', () => {
      document.querySelectorAll('input[name="permissions[]"]').forEach(cb => cb.checked = true);
  });

  document.getElementById('deselect-all-permissions').addEventListener('click', () => {
      document.querySelectorAll('input[name="permissions[]"]').forEach(cb => cb.checked = false);
  });

  // Filtros
  document.getElementById('search-user').addEventListener('input', filterUsers);
  document.getElementById('filter-role').addEventListener('change', filterUsers);
  document.getElementById('filter-status').addEventListener('change', filterUsers);

  // Força da senha
  document.getElementById('user-password').addEventListener('input', function () {
      const password = this.value;
      let strength = 0;

      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;

      const segments = document.querySelectorAll('.strength-segment');
      const strengthText = document.querySelector('.strength-text');

      segments.forEach((segment, index) => {
          segment.classList.remove('weak', 'medium', 'strong', 'very-strong');
          if (index < strength) {
              segment.classList.add(['weak', 'medium', 'strong', 'very-strong'][strength - 1]);
          }
      });

      strengthText.textContent = ['', 'Fraca', 'Média', 'Forte', 'Muito forte'][strength];
  });
});

// Filtro (simulação)
function filterUsers() {
  const searchTerm = document.getElementById('search-user').value.toLowerCase();
  const roleFilter = document.getElementById('filter-role').value;
  const statusFilter = document.getElementById('filter-status').value;

  console.log(`Filtrando usuários: Busca="${searchTerm}", Função="${roleFilter}", Status="${statusFilter}"`);
}
