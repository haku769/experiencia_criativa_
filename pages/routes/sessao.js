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
    // Dentro do seu objeto App
  init() {


    this.state.usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    this.state.token = localStorage.getItem("token");

    this.auth.verificarSessaoExpiradaAoCarregar();
    // Carrega dados iniciais do localStorage (sem verificação de página)
    this.state.usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    this.state.token = localStorage.getItem("token");

    // Configura a interface e os eventos
    this.ui.updateHeader(); // Esta função já esconde/mostra os botões de admin, login, etc.
    this.events.setupEventListeners();

    // Carrega dados iniciais da API, se a página precisar
    // IMPORTANTE: A chamada abaixo deve usar fetchAutenticado para ser protegida
    if (document.getElementById("users-table-body")) {
        this.api.carregarUsuarios(); // carregarUsuarios já usa fetchAutenticado
    }
  },

    // ----------------------------------------------------------------
    // 3. MÓDULO DE AUTENTICAÇÃO E AUTORIZAÇÃO
    // ----------------------------------------------------------------
  auth: {
    
  //  // Dentro de App.auth
  //   verificarSessaoAoCarregar() {
  //   const paginaAtual = window.location.pathname;
  //   const paginaDeLogin = "/autenticacao.html";

  //   if (paginaAtual.endsWith(paginaDeLogin)) {
  //       return; 
  //   }

  //   // 2. SE NÃO ESTAMOS NA PÁGINA DE LOGIN, verifica a sessão
  //   // Lendo DIRETAMENTE do localStorage, pois o App.state ainda não foi carregado.
  //   const usuarioNoStorage = localStorage.getItem("usuarioLogado");
  //   const tokenNoStorage = localStorage.getItem("token");

  //   // 3. Redireciona se não houver dados ou se o token estiver expirado
  //   if (!usuarioNoStorage || !tokenNoStorage || this.isTokenExpirado(tokenNoStorage)) {
  //       // Garante a limpeza completa antes de redirecionar
  //       localStorage.removeItem("usuarioLogado");
  //       localStorage.removeItem("token");
        
  //       window.location.href = paginaDeLogin;
  //   }
  // },
    isLoggedIn() {
        // Carrega o usuário do App.state, que é preenchido no init
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
  verificarSessaoExpiradaAoCarregar() {
    const paginaDeLogin = "/autenticacao.html";
    const paginaAtual = window.location.pathname;

    // 1. Ignora a própria página de login para evitar loops de redirecionamento.
    if (paginaAtual.endsWith(paginaDeLogin)) {
        return;
    }

    // 2. Pega o token diretamente do localStorage para a verificação inicial.
    const token = localStorage.getItem("token");

    // 3. Se NÃO HÁ token, o usuário é um visitante. Permite a navegação.
    if (!token) {
        return;
    }

    // 4. Se HÁ um token, mas ele está expirado...
    if (this.isTokenExpirado(token)) {
        // ...a sessão está inválida. Limpa tudo e redireciona para o login.
        
        // (Opcional) Mostra um popup antes de redirecionar para que o usuário entenda o que aconteceu.
        App.ui.showPopup("Sua sessão expirou. Por favor, faça o login novamente.");
        
        // Desativa a interação com a página enquanto o popup é exibido
        document.body.style.pointerEvents = 'none';

        // Usa a função logout para garantir a limpeza e o redirecionamento após um breve delay.
        setTimeout(() => {
            this.logout(); 
        }, 2500); // Delay de 2.5 segundos para o usuário ler o popup.
    }
},
    
  // Dentro de App.auth

async fetchAutenticado(url, options = {}) {
    // 1. Verifica se o token atual é inválido (expirado ou inexistente).
    if (this.isTokenExpirado(App.state.token)) {

        // 2. Se o token for inválido, tenta renová-lo silenciosamente.
        //    Isso só funcionará se o usuário já esteve logado e possui um refreshToken.
        const novoToken = await this.renovarToken();

        // 3. Se a renovação falhar (seja por refresh token inválido ou por nunca ter logado),
        //    significa que o usuário NÃO tem uma sessão válida para prosseguir.
        if (!novoToken) {
            // Mostra um aviso claro ao usuário.
            App.ui.showPopup("Para realizar esta ação, você precisa fazer login.");
            
            // Redireciona para a página de autenticação.
            window.location.href = "/autenticacao.html";
            
            // Rejeita a promise para interromper a cadeia de execução do código que a chamou.
            return Promise.reject(new Error("Sessão inválida ou expirada."));
        }
    }

    // 4. Se chegamos aqui, o usuário tem um token válido (seja o original ou um recém-renovado).
    //    Prosseguimos com a requisição, adicionando o cabeçalho de autorização.
    const headers = { ...options.headers, Authorization: `Bearer ${App.state.token}` };
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    
    return fetch(url, { ...options, headers });
},
// Dentro de App.auth em sessao.js
logout() {
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken"); // Muito importante remover este também!
    window.location.href = "/autenticacao.html";
},
 protectAdminRoute() {
            if (!this.isLoggedIn()) {
                window.location.href = "/autenticacao.html";
                return false;
            }
            if (!this.isAdmin()) {
                App.ui.showPopup("Acesso negado. Você não tem permissão para ver esta página.", "error");
                setTimeout(() => { window.location.href = "/index.html"; }, 2000);
                return false;
            }
            return true;
        },
},

// ----------------------------------------------------------------
// 3.5 MÓDULO DE VALIDAÇÃO
// ----------------------------------------------------------------
validation: {
  
    isSenhaSegura(senha) {
        const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+{}\[\]:;"'<>,.?/~\\-]).{8,}$/;
        return regex.test(senha);
    },

    isUserFormValid() {
         let isFormValid = true;

    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const cpf = document.getElementById('cpf').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmar = document.getElementById('confirmar-senha').value;
    
    // Validação do Nome
    if (nome.trim().length < 3) isFormValid = false;
    
    // Validação do Email
    if (!/^[^\s@]+@gmail\.com$/.test(email)) isFormValid = false;

    // --- LÓGICA CORRIGIDA AQUI ---
    // Só valida o formato do telefone SE o campo não estiver vazio.
    if (telefone && !/^\(\d{2}\) \d{5}-\d{4}$/.test(telefone)) {
        isFormValid = false;
    }

    // Só valida o formato do CPF SE o campo não estiver vazio.
    if (cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) {
        isFormValid = false;
    }

    // Validação da Senha (a lógica aqui já está correta para o modo de edição)
    const isEditMode = !!App.state.currentUserId;
    if (!isEditMode || senha) {
        if (!this.isSenhaSegura(senha) || senha !== confirmar) {
            isFormValid = false;
        }
    }
    
    // Opcional: Removido o popup daqui para ser chamado dentro de handleFormSubmit,
    // o que dá mais controle sobre a mensagem.
    // if (!isFormValid) {
    //      App.ui.showPopup('Por favor, corrija os campos inválidos antes de salvar.');
    // }

    return isFormValid;
  }
},

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
            <td>${App.utils.formatarFuncao(usuario.FUNCAO)}</td>
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
        const cpfInput = document.getElementById("cpf");
        const nomeInput = document.getElementById("nome");
        const telefoneInput = document.getElementById("telefone");
        const emailInput = document.getElementById("email");
        const senhaInput = document.getElementById('senha');
        const confirmarInput = document.getElementById('confirmar-senha');

        // --- Associação de Eventos ---

        if (userForm) userForm.addEventListener("submit", this.handleFormSubmit);
        if (inputFoto) inputFoto.addEventListener("change", this.handleImagePreview);
        if (avatarPreview) avatarPreview.addEventListener("click", () => inputFoto.click());
        if (logoutBtn) logoutBtn.addEventListener("click", App.auth.logout);
        if (editarPerfilBtn) editarPerfilBtn.addEventListener("click", () => window.location.href = "/perfil.html");
        if (deleteConfirmBtn) deleteConfirmBtn.addEventListener("click", () => App.api.confirmarDelete());
        if (nomeInput) nomeInput.addEventListener('input', this.handleNomeInput);
        if (telefoneInput) telefoneInput.addEventListener('input', this.handleTelefoneInput);
        if (cpfInput) cpfInput.addEventListener("input", this.handleCpfInputFormatting);
        if (emailInput) emailInput.addEventListener('input', this.handleEmailInput);
        if (senhaInput) senhaInput.addEventListener('input', this.handlePasswordValidation);
        if (confirmarInput) confirmarInput.addEventListener('input', this.handlePasswordValidation);
        
        
        
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
       handleNomeInput(e) {
        const nomeValido = e.target.value.trim().length >= 3;
        e.target.style.borderColor = nomeValido ? 'green' : 'red';
    },

    /** Handler para o campo TELEFONE (máscara e validação) */
    handleTelefoneInput(e) {
        let valor = e.target.value.replace(/\D/g, '').slice(0, 11);
        let valorFormatado = '';
        if (valor.length > 0) {
            valorFormatado = '(' + valor.substring(0, 2);
            if (valor.length > 2) {
                valorFormatado += ') ' + valor.substring(2, 7);
            }
            if (valor.length > 7) {
                valorFormatado += '-' + valor.substring(7, 11);
            }
        }
        e.target.value = valorFormatado;
        const telefoneValido = /^\(\d{2}\) \d{5}-\d{4}$/.test(e.target.value);
        e.target.style.borderColor = telefoneValido ? 'green' : 'red';
    },

    /** Handler para o campo CPF (máscara e validação) */
    handleCpfInputFormatting(e) {
        const valorFormatado = e.target.value
            .replace(/\D/g, '').slice(0, 11)
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = valorFormatado;
        const cpfValido = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(e.target.value);
        e.target.style.borderColor = cpfValido ? 'green' : 'red';
    },

    /** Handler para o campo EMAIL (sufixo e validação) */
    handleEmailInput(e) {
        let valor = e.target.value.replace(/@.*$/, '') + '@gmail.com';
        e.target.value = valor;
        const emailValido = /^[^\s@]+@gmail\.com$/.test(e.target.value);
        e.target.style.borderColor = emailValido ? 'green' : 'red';
    },

    /** Handler para os campos de SENHA (validação de segurança e confirmação) */
    handlePasswordValidation() {
    const senhaInput = document.getElementById('senha');
    const confirmarInput = document.getElementById('confirmar-senha');
    const senha = senhaInput.value;
    const confirmar = confirmarInput.value;

    // --- Validação do primeiro campo de senha ---
    // (A lógica aqui está boa, apenas verificando se é segura)
    const senhaSegura = App.validation.isSenhaSegura(senha);
    // Só pinta de vermelho ou verde se o campo não estiver vazio
    if (senha.length > 0) {
        senhaInput.style.borderColor = senhaSegura ? 'green' : 'red';
    } else {
        // Se estiver vazio, reseta a cor da borda
        senhaInput.style.borderColor = ''; 
    }

    // --- LÓGICA CORRIGIDA para o campo de confirmação ---
    if (confirmar.length > 0) {
        // Só valida (e colore) se o campo tiver algo digitado
        const confirmacaoCorreta = (senha === confirmar);
        confirmarInput.style.borderColor = confirmacaoCorreta ? 'green' : 'red';
    } else {
        // Se o campo de confirmação estiver vazio, reseta a cor da borda
        confirmarInput.style.borderColor = ''; 
    }
  },
    
    /** Handler para o clique no ícone de ver/ocultar senha */
    togglePasswordVisibility() { // 'this' aqui é o elemento que foi clicado
        const targetId = this.dataset.target;
        const passwordInput = document.getElementById(targetId);
        const icon = this.querySelector('i');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    },
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
       /**
     * Traduz o valor da função do backend para um formato amigável.
     * @param {string} funcao - O valor vindo do banco ('admin', 'user', null).
     * @returns {string} - O valor formatado para exibição ('Administrador', 'Cliente').
     */
    formatarFuncao(funcao) {
        if (funcao === 'admin') {
            return 'Administrador';
        }
        // Trata tanto 'user' quanto valores nulos/vazios como 'Cliente'.
        if (funcao === 'user' || !funcao) {
            return 'Cliente';
        }
        // Se houver outras funções, retorna como estão.
        return funcao;
    },
    },
  };

  // Expõe o App globalmente para ser acessível por `onclick` no HTML
  window.App = App;
  
  // Inicia a aplicação
  App.init();
});