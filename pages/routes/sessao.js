// ====================================================================================
// SCRIPT PRINCIPAL DA APLICAÇÃO - VERSÃO REATORADA E ORGANIZADA
// ====================================================================================

document.addEventListener("DOMContentLoaded", () => {
  /**
   * Encapsula toda a lógica da aplicação em um único objeto para evitar
   * poluir o escopo global e organizar o código por responsabilidades.
   */
  const App = {
    // ----------------------------------------------------------------
    // 1. ESTADO DA APLICAÇÃO
    // ----------------------------------------------------------------
    state: {
      currentUserId: null,
      usuarioLogado: null,
      token: null,
    },

    // ----------------------------------------------------------------
    // 2. INICIALIZAÇÃO
    // ----------------------------------------------------------------
    init() {
      // Carrega dados iniciais do localStorage
      this.state.usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
      this.state.token = localStorage.getItem("token");

      // Configura a interface e os eventos
      this.ui.updateHeader();
      this.events.setupEventListeners();

      // Carrega dados iniciais da API, se a página precisar
      if (document.getElementById("users-table-body")) {
        this.api.carregarUsuarios();
      }
    },

    // ----------------------------------------------------------------
    // 3. MÓDULO DE AUTENTICAÇÃO E AUTORIZAÇÃO
    // ----------------------------------------------------------------
    auth: {
  isLoggedIn() {
    return !!App.state.usuarioLogado;
  },

  isAdmin() {
    return App.state.usuarioLogado?.funcao === "admin";
  },

  isTokenExpirado(token) {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const agora = Math.floor(Date.now() / 1000);
      return payload.exp < agora;
    } catch (e) {
      return true;
    }
  },

  async renovarToken() {
    if (!App.state.usuarioLogado?.refreshToken) return null;
    try {
      const res = await fetch("http://localhost:3000/autenticacao/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: App.state.usuarioLogado.refreshToken }),
      });
      if (!res.ok) throw new Error("Erro ao renovar token");
      const { token } = await res.json();
      localStorage.setItem("token", token);
      App.state.token = token;
      return token;
    } catch (err) {
      return null;
    }
  },

  async fetchAutenticado(url, options = {}) {
    if (!App.auth.isLoggedIn()) {
      return fetch(url, options); // Permite chamadas públicas
    }

    if (App.auth.isTokenExpirado(App.state.token)) {
      const novoToken = await App.auth.renovarToken();
      if (!novoToken) {
        App.ui.showPopup("Sessão expirada. Faça login novamente.");
        App.auth.logout();
        // A linha abaixo foi adicionada para o redirecionamento
        window.location.href = "/autenticacao.html"; 
        return Promise.reject(new Error("Sessão expirada."));
      }
    }
    
    const headers = { ...options.headers, Authorization: `Bearer ${App.state.token}` };
    // Para FormData, não se define Content-Type
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    
    return fetch(url, { ...options, headers });
  },

  logout() {
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("token");
    // O reload pode ser removido se o redirecionamento sempre ocorrer onde o logout é chamado
    // window.location.reload(); 
  },

  protectAdminRoute() {
    if (!this.isLoggedIn() || !this.isAdmin()) {
      window.location.href = "/autenticacao.html";
      return false;
    }
    // A verificação duplicada abaixo pode ser removida
    /* if (!this.isAdmin()) {
      window.location.href = "/index.html";
      return false;
    } */
    return true;
  },
},

    // ----------------------------------------------------------------
    // 3.5 MÓDULO DE VALIDAÇÃO (Validações de Formulário)

    // ... dentro do seu objeto App ...

    // ----------------------------------------------------------------
    // NOVO MÓDULO DE VALIDAÇÃO
    // ----------------------------------------------------------------
    validation: {
      /**
       * Verifica se a senha atende aos critérios de segurança.
       * (Pelo menos 8 caracteres, 1 número, 1 símbolo)
       */
      isSenhaSegura(senha) {
        const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+{}\[\]:;"'<>,.?/~\\-]).{8,}$/;
        return regex.test(senha);
      },

      /**
       * Função final que verifica todos os campos do formulário antes de enviar.
       * Retorna `true` se tudo estiver válido, `false` caso contrário.
       * Também atualiza a cor das bordas para dar feedback visual.
       */
      isUserFormValid() {
        let isFormValid = true;

        // Pega todos os inputs
        const nomeInput = document.getElementById('nome');
        const telefoneInput = document.getElementById('telefone');
        const cpfInput = document.getElementById('cpf');
        const emailInput = document.getElementById('email');
        const senhaInput = document.getElementById('senha');
        const confirmarInput = document.getElementById('confirmar-senha');

        // 1. Valida Nome
        const isNomeValid = nomeInput.value.trim().length >= 3;
        nomeInput.style.borderColor = isNomeValid ? 'green' : 'red';
        if (!isNomeValid) isFormValid = false;

        // 2. Valida Telefone
        const isTelefoneValid = /^\(\d{2}\) \d{5}-\d{4}$/.test(telefoneInput.value);
        telefoneInput.style.borderColor = isTelefoneValid ? 'green' : 'red';
        if (!isTelefoneValid) isFormValid = false;
        
        // 3. Valida CPF
        const isCpfValid = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpfInput.value);
        cpfInput.style.borderColor = isCpfValid ? 'green' : 'red';
        if (!isCpfValid) isFormValid = false;

        // 4. Valida Email
        const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
        emailInput.style.borderColor = isEmailValid ? 'green' : 'red';
        if (!isEmailValid) isFormValid = false;

        // 5. Valida Senha (com lógica para modo de edição)
        const senha = senhaInput.value;
        const confirmar = confirmarInput.value;
        const isEditMode = !!App.state.currentUserId;
        
        let isSenhaValid = false;
        // Se estiver editando e a senha estiver vazia, é válido (opcional).
        if (isEditMode && senha === '' && confirmar === '') {
            isSenhaValid = true;
            senhaInput.style.borderColor = ''; // Limpa a borda
            confirmarInput.style.borderColor = '';
        } else {
            // Se for criação OU se a senha for preenchida na edição, valida.
            const senhaSegura = this.isSenhaSegura(senha);
            const senhasCoincidem = senha === confirmar;
            isSenhaValid = senhaSegura && senhasCoincidem;

            senhaInput.style.borderColor = senhaSegura ? 'green' : 'red';
            confirmarInput.style.borderColor = senhasCoincidem ? 'green' : 'red';
        }
        if (!isSenhaValid) isFormValid = false;

        return isFormValid;
      }
    },

// ... continue com o restante do seu objeto App (módulo api, etc.)

    // ----------------------------------------------------------------
    // 4. MÓDULO DE API (Comunicação com o Backend)
    // ----------------------------------------------------------------
    api: {
      async carregarUsuarios() {
        try {
          const response = await App.auth.fetchAutenticado("http://localhost:3000/usuarios");
          const usuarios = await response.json();
          App.ui.renderUserTable(usuarios);
        } catch (error) {
          console.error("Erro ao carregar usuários:", error);
        }
      },

      async buscarUsuarioParaEdicao(cpf) {
        App.state.currentUserId = cpf;
        try {
          const response = await App.auth.fetchAutenticado(`http://localhost:3000/usuarios/${cpf}`);
          if (!response.ok) throw new Error("Usuário não encontrado");
          const usuario = await response.json();
          App.ui.preencherFormularioEdicao(usuario);
        } catch (err) {
          console.error("Erro ao buscar usuário para edição:", err);
        }
      },

      async confirmarDelete() {
        if (!App.state.currentUserId) return;
        try {
          await App.auth.fetchAutenticado(`http://localhost:3000/usuarios/${App.state.currentUserId}`, {
            method: "DELETE",
          });
          App.ui.showPopup("Usuário excluído com sucesso!");
          App.ui.closeDeleteModal();
          this.carregarUsuarios();
        } catch (error) {
          console.error("Erro ao deletar usuário:", error);
          App.ui.showPopup("Erro ao excluir usuário.");
        }
      },
    },

    // ----------------------------------------------------------------
    // 5. MÓDULO DE UI (Manipulação da Interface)
    // ----------------------------------------------------------------
    ui: {
      updateHeader() {
        const { usuarioLogado } = App.state;
        const userInfo = document.getElementById("user-info");
        
        // Remove elementos por segurança
        const removeElement = (id) => {
            const el = document.getElementById(id);
            if (el) el.remove();
        };

        if (usuarioLogado?.nome) {
          const fotoHTML = usuarioLogado.cpf ? `<img src="http://localhost:3000/imagem/${usuarioLogado.cpf}" alt="FotoDoUsuario" class="foto-usuario">` : "";
          userInfo.innerHTML = `
            <span class="user-welcome">${fotoHTML} <strong>${usuarioLogado.nome.split(" ")[0]}</strong></span>
            <button id="editar-perfil-btn" class="btn-login">Editar Perfil</button>
            <button id="logout-btn" class="btn-login">Sair</button>
          `;
          if (usuarioLogado.funcao !== "admin") {
            removeElement("CrudUsuario");
            removeElement("CrudVeiculos");
            removeElement("tickets");
          }
        } else {
            removeElement("CrudUsuario");
            removeElement("CrudVeiculos");
            removeElement("tickets");
        }
      },

      renderUserTable(usuarios) {
        const tabela = document.getElementById("users-table-body");
        if (!tabela) return;
        tabela.innerHTML = "";
        usuarios.forEach((usuario) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td><img src="http://localhost:3000/usuarios/${usuario.CPF}/foto?t=${Date.now()}" class="avatar-table"></td>
            <td>${usuario.NOME}</td>
            <td>${usuario.EMAIL}</td>
            <td>${usuario.FUNCAO || "Cliente"}</td>
            <td>
              <button onclick="App.api.buscarUsuarioParaEdicao('${usuario.CPF}')">✏️</button>
              <button onclick="App.ui.openDeleteModal('${usuario.CPF}')">🗑️</button>
            </td>
          `;
          tabela.appendChild(tr);
        });
      },
      
      preencherFormularioEdicao(usuario) {
        document.getElementById('nome').value = usuario.NOME || '';
        document.getElementById('email').value = usuario.EMAIL || '';
        document.getElementById('telefone').value = usuario.TELEFONE || '';
        document.getElementById('cpf').value = usuario.CPF || '';
        document.getElementById('funcao').value = usuario.FUNCAO || '';
        document.getElementById('senha').value = '';
        document.getElementById('confirmar-senha').value = ''; // Supondo que exista
        
        const timestamp = Date.now();
        const fotoUrl = `http://localhost:3000/usuarios/${usuario.CPF}/foto?t=${timestamp}`;
        document.getElementById('avatar-preview-img').src = fotoUrl;

        this.openModal(true);
      },

      showPopup(message) {
        document.getElementById('custom-popup-overlay')?.remove();
        const overlay = document.createElement('div');
        overlay.id = 'custom-popup-overlay';
        Object.assign(overlay.style, { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 });
        const popup = document.createElement('div');
        Object.assign(popup.style, { backgroundColor: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', width: '400px', textAlign: 'center' });
        popup.innerHTML = `<div>${message}</div><button style="margin-top:20px; padding:10px 20px; border:none; background-color:#333; color:#fff; border-radius:5px; cursor:pointer;">Fechar</button>`;
        popup.querySelector('button').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if(e.target === overlay) overlay.remove() };
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
      },

      openModal(isEdit = false) {
        document.getElementById('modal-title').textContent = isEdit ? 'Editar Usuário' : 'Adicionar Usuário';
        document.getElementById('user-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
      },
      
      closeModal() {
        document.getElementById('user-modal').style.display = 'none';
        document.body.style.overflow = '';
        this.resetForm();
      },
      
      openDeleteModal(cpf) {
        App.state.currentUserId = cpf;
        document.getElementById('delete-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
      },

      closeDeleteModal() {
        document.getElementById('delete-modal').style.display = 'none';
        document.body.style.overflow = '';
        App.state.currentUserId = null;
      },

      resetForm() {
        document.getElementById('user-form')?.reset();
        document.getElementById('avatar-preview-img').src = '/fotos/comercial.png';
        App.state.currentUserId = null;
      }
    },

    // ----------------------------------------------------------------
    // 6. MÓDULO DE EVENTOS
    // ----------------------------------------------------------------
    // ... (início do seu objeto App)

    // ----------------------------------------------------------------
    // 6. MÓDULO DE EVENTOS
    // ----------------------------------------------------------------
    events: {
      setupEventListeners() {
        // --- Seletores de elementos ---
        const userForm = document.getElementById("user-form");
        const inputFoto = document.getElementById("foto");
        const avatarPreview = document.querySelector(".avatar-preview");
        const logoutBtn = document.getElementById("logout-btn");
        const editarPerfilBtn = document.getElementById("editar-perfil-btn");
        const deleteConfirmBtn = document.getElementById("confirm-delete-btn");
        const allCloseButtons = document.querySelectorAll(".close-modal-btn");
        const allModalOverlays = document.querySelectorAll(".modal-overlay");
        const addUserBtn = document.getElementById("btn-add-user");
        const passwordToggles = document.querySelectorAll(".password-piscar");

        // --- Associação de Eventos ---

        if (userForm) userForm.addEventListener("submit", this.handleFormSubmit);
        if (inputFoto) inputFoto.addEventListener("change", this.handleImagePreview);
        if (avatarPreview) avatarPreview.addEventListener("click", () => inputFoto.click());
        if (logoutBtn) logoutBtn.addEventListener("click", App.auth.logout);
        if (editarPerfilBtn) editarPerfilBtn.addEventListener("click", () => window.location.href = "/perfil.html");
        if (deleteConfirmBtn) deleteConfirmBtn.addEventListener("click", () => App.api.confirmDelete());
        
        
        
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                // Pega o ID do input alvo a partir do atributo data-target
                const targetId = this.dataset.target;
                const passwordInput = document.getElementById(targetId);
                const icon = this.querySelector('i');

                if (passwordInput && icon) {
                    // Verifica o tipo atual e faz a troca
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    } else {
                        passwordInput.type = 'password';
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                }
            });
        });
        
        // --- LÓGICA PARA FECHAR MODAIS (MOVIDA PARA DENTRO DA FUNÇÃO) ---
        if (addUserBtn) {
            addUserBtn.addEventListener("click", () => {
                // Chama a função para abrir o modal em modo de "criação" (false)
                App.ui.openModal(false);
            });
        }

        allCloseButtons.forEach(button => {
          button.addEventListener('click', () => {
            App.ui.closeModal();
            App.ui.closeDeleteModal();
          });
        }); // CORRIGIDO: de }), para });

        // CORRIGIDO: Erro de digitação "allModalOverlaysforEach" para "allModalOverlays.forEach"
        allModalOverlays.forEach(overlay => {
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    App.ui.closeModal();
                    App.ui.closeDeleteModal();
                }
            });
        }); // CORRIGIDO: de }), para });

      }, // CORRIGIDO: A função setupEventListeners termina aqui.

      handleImagePreview(e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            document.getElementById('avatar-preview-img').src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      },

      async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!App.validation.isUserFormValid()) {
          App.ui.showPopup('Por favor, corrija os campos destacados em vermelho.');
          return;
        }

        const formData = new FormData(e.target);
        const { currentUserId } = App.state;

        try {
          const url = currentUserId ? `http://localhost:3000/usuarios/${currentUserId}` : "http://localhost:3000/usuarios";
          const method = currentUserId ? "PUT" : "POST";
          
          const response = await App.auth.fetchAutenticado(url, { method, body: formData });
          const result = await response.json();
          
          App.ui.showPopup(`Usuário ${currentUserId ? 'atualizado' : 'criado'} com sucesso!`);
          App.ui.closeModal();
          App.api.carregarUsuarios();

          const { usuarioLogado } = App.state;
          if (currentUserId && usuarioLogado && usuarioLogado.CPF === result.CPF) {
             localStorage.setItem('usuarioLogado', JSON.stringify({ ...usuarioLogado, ...result }));
          }

        } catch (error) {
          console.error("Erro ao enviar formulário:", error);
          App.ui.showPopup("Erro ao processar a solicitação.");
        }
      },
    },


    // ----------------------------------------------------------------
    // 7. MÓDULO DE UTILITÁRIOS
    // ----------------------------------------------------------------
    utils: {
      bufferToBase64(buffer) {
        let binary = "";
        const bytes = new Uint8Array(buffer.data); // Assumindo que o buffer está em { type: 'Buffer', data: [...] }
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      },
    },
  };

  // Expõe o App globalmente para ser acessível por `onclick` no HTML
  window.App = App;
  
  // Inicia a aplicação
  App.init();
});