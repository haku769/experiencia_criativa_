document.addEventListener('DOMContentLoaded', () => {
  /**
   * Encapsula toda a lógica da página de autenticação em um objeto
   * para melhor organização e manutenibilidade.
   */
  const AuthPage = {
    // Elementos do DOM cacheados para performance
    elements: {},

    // Ponto de entrada da aplicação
    init() {
      this.cacheElements();
      this.bindEvents();
    },

    // Guarda referências aos elementos do DOM para não buscar toda hora
    cacheElements() {
      this.elements.tabs = document.querySelectorAll('.tab-btn');
      this.elements.formContainers = document.querySelectorAll('.form-container');
      this.elements.forgotPasswordLink = document.getElementById('forgot-password-link');
      this.elements.backToLoginBtn = document.getElementById('back-to-login');
      
      this.elements.loginForm = document.getElementById('form-login');
      this.elements.registerForm = document.getElementById('form-registro');
      this.elements.recoveryForm = document.getElementById('form-recuperacao');

      this.elements.passwordToggles = document.querySelectorAll('.password-toggle');
      
      // Inputs do formulário de registro
      this.elements.registerName = document.getElementById('register-name');
      this.elements.registerEmail = document.getElementById('register-email');
      this.elements.registerPhone = document.getElementById('register-phone');
      this.elements.registerCpf = document.getElementById('cpf');
      this.elements.registerPassword = document.getElementById('register-password');
      this.elements.registerConfirmPassword = document.getElementById('register-confirm-password');
      this.elements.registerPhoto = document.getElementById('register-photo');
      this.elements.termsCheckbox = document.getElementById('terms');
    },

    // Centraliza toda a configuração de eventos
    bindEvents() {
      // Navegação por Abas
      this.elements.tabs.forEach(btn => {
        btn.addEventListener('click', () => this.ui.handleTabClick(btn));
      });

      // Links para formulário de recuperação
      this.elements.forgotPasswordLink?.addEventListener('click', (e) => {
        e.preventDefault();
        this.ui.showForm('forgot-password-form');
      });
      this.elements.backToLoginBtn?.addEventListener('click', () => {
        this.ui.showForm('login-form');
        document.querySelector('.tab-btn.active').classList.remove('active');
        document.querySelector('[data-tab="login"]').classList.add('active');
      });

      // Mostrar/Ocultar Senha
      this.elements.passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', this.ui.togglePasswordVisibility);
      });

      // Validação em Tempo Real e Máscaras
      this.events.setupRealTimeValidation();

      // Submissão dos Formulários
      this.elements.loginForm?.addEventListener('submit', this.events.handleLoginSubmit);
      this.elements.registerForm?.addEventListener('submit', this.events.handleRegisterSubmit);
      this.elements.recoveryForm?.addEventListener('submit', this.events.handleRecoverySubmit);
    },

    // Funções de UI (manipulação da interface)
    ui: {
      showForm(formId) {
        AuthPage.elements.formContainers.forEach(form => form.classList.remove('active'));
        document.getElementById(formId)?.classList.add('active');
      },

      handleTabClick(clickedBtn) {
        AuthPage.elements.tabs.forEach(b => b.classList.remove('active'));
        clickedBtn.classList.add('active');
        const formId = clickedBtn.dataset.tab === 'login' ? 'login-form' : 'register-form';
        this.showForm(formId);
      },
      
      togglePasswordVisibility() {
        // 'this' aqui é o botão que foi clicado
        const input = this.previousElementSibling;
        const icon = this.querySelector('i');
        if (input && icon) {
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          icon.classList.toggle('fa-eye', !isPassword);
          icon.classList.toggle('fa-eye-slash', isPassword);
        }
      },

      updateFieldUI(input, isValid) {
        input.classList.remove('is-valid', 'is-invalid');
        input.classList.add(isValid ? 'is-valid' : 'is-invalid');
      },
      
      // Dentro do objeto AuthPage.ui
    showPopup(message) {
    document.getElementById('custom-popup-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'custom-popup-overlay';
    Object.assign(overlay.style, { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 });
    
    const popup = document.createElement('div');
    Object.assign(popup.style, { backgroundColor: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', maxWidth: '400px', textAlign: 'center' });
    popup.innerHTML = `<div>${message}</div><button style="margin-top:20px;padding:10px 20px;border:none;background-color:#333;color:#fff;border-radius:5px;cursor:pointer;">Fechar</button>`;
    
    popup.querySelector('button').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    // ==========================================================
    // LINHA CRÍTICA ADICIONADA AQUI:
    // Diz ao navegador para colocar a caixa do popup DENTRO do overlay.
    overlay.appendChild(popup); 
    // ==========================================================

    // Agora, adiciona o overlay (que já contém a caixa) à página.
    document.body.appendChild(overlay);
  }
    },

    // Lógica de eventos e validação
    events: {
      setupRealTimeValidation() {
        const { registerName, registerEmail, registerPhone, registerCpf, registerPassword, registerConfirmPassword } = AuthPage.elements;

        const addValidation = (input, validatorFn, formatterFn = null) => {
          input?.addEventListener('input', () => {
            if (formatterFn) formatterFn(input);
            AuthPage.ui.updateFieldUI(input, validatorFn(input.value));
          });
        };
        
        addValidation(registerName, AuthPage.validators.nome);
        addValidation(registerEmail, AuthPage.validators.email);
        addValidation(registerPhone, AuthPage.validators.telefone, AuthPage.formatters.telefone);
        addValidation(registerCpf, AuthPage.validators.cpf, AuthPage.formatters.cpf);
        addValidation(registerPassword, AuthPage.validators.senha);
        addValidation(registerConfirmPassword, (val) => AuthPage.validators.confirmarSenha(val, registerPassword.value));
      },

      async handleLoginSubmit(e) {
        e.preventDefault();
        const email = AuthPage.elements.loginForm.elements.email.value;
        const senha = AuthPage.elements.loginForm.elements.senha.value;
        
        if (!AuthPage.validators.email(email) || !AuthPage.validators.senha(senha)) {
          return AuthPage.ui.showPopup('❌ E-mail ou senha em formato inválido.');
        }

        AuthPage.api.login({ email, senha });
      },

      async handleRegisterSubmit(e) {
        e.preventDefault();
        const form = AuthPage.elements.registerForm;
        
        const fields = {
            nome: form.elements.nome,
            email: form.elements.email,
            telefone: form.elements.telefone,
            cpf: form.elements.cpf,
            senha: form.elements.senha,
            confirmarSenha: form.elements.confirmarSenha
        };
        
        // Validação final no submit
        const isNomeValid = AuthPage.validators.nome(fields.nome.value);
        const isEmailValid = AuthPage.validators.email(fields.email.value);
        const isTelefoneValid = AuthPage.validators.telefone(fields.telefone.value);
        const isCpfValid = AuthPage.validators.cpf(fields.cpf.value);
        const isSenhaValid = AuthPage.validators.senha(fields.senha.value);
        const isConfirmarSenhaValid = AuthPage.validators.confirmarSenha(fields.confirmarSenha.value, fields.senha.value);
        
        AuthPage.ui.updateFieldUI(fields.nome, isNomeValid);
        AuthPage.ui.updateFieldUI(fields.email, isEmailValid);
        AuthPage.ui.updateFieldUI(fields.telefone, isTelefoneValid);
        AuthPage.ui.updateFieldUI(fields.cpf, isCpfValid);
        AuthPage.ui.updateFieldUI(fields.senha, isSenhaValid);
        AuthPage.ui.updateFieldUI(fields.confirmarSenha, isConfirmarSenhaValid);

        if (!isNomeValid || !isEmailValid || !isTelefoneValid || !isCpfValid || !isSenhaValid || !isConfirmarSenhaValid) {
            return AuthPage.ui.showPopup('⚠️ Por favor, corrija os campos em vermelho.');
        }

        if (!AuthPage.elements.termsCheckbox.checked) {
            return AuthPage.ui.showPopup('⚠️ Você deve aceitar os termos de uso.');
        }
        
        if (!AuthPage.elements.registerPhoto.files[0]) {
            return AuthPage.ui.showPopup('⚠️ Por favor, selecione uma foto de perfil.');
        }
        
        const formData = new FormData(form);
        AuthPage.api.register(formData);
      },

      async handleRecoverySubmit(e) {
        e.preventDefault();
        const email = AuthPage.elements.recoveryForm.elements.email.value;
        if (!AuthPage.validators.email(email)) {
            return AuthPage.ui.showPopup('❌ Formato de e-mail inválido.');
        }
        AuthPage.ui.showPopup('🔁 Se o e-mail estiver cadastrado, um link de recuperação será enviado.');
        AuthPage.ui.showForm('login-form');
      }
    },

    // Funções de API
    api: {
      // Dentro do objeto AuthPage.api
      async login(credentials) {
        try {
          const res = await fetch('http://localhost:3000/autenticacao/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
          });

          // Se a resposta NÃO for OK (erro de senha, usuário não existe, etc.)
          if (!res.ok) {
            let errorMessage = 'Credenciais inválidas ou erro no servidor.'; // Mensagem padrão

            // Tenta extrair uma mensagem de erro mais específica do corpo da resposta
            try {
              const errorData = await res.json();
              if (errorData && errorData.erro) {
                errorMessage = errorData.erro; // Usa a mensagem do servidor se ela existir
              }
            } catch (e) {
              // Se o corpo da resposta não for JSON ou estiver vazio, ignora o erro
              // e simplesmente usa a mensagem padrão. O importante é não quebrar.
              console.error("A resposta de erro do servidor não era JSON:", e);
            }
            // Lança o erro com uma mensagem garantida
            throw new Error(errorMessage);
          }

          // Se a resposta for OK, continua com o fluxo de sucesso
          const data = await res.json();
          
          localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);
          
          // Mostra o popup de sucesso e redireciona APÓS o usuário fechar
          AuthPage.ui.showPopup('✅ Login realizado com sucesso! Redirecionando...');
          setTimeout(() => {
              window.location.href = '/index.html';
          }, 2000); // Espera 2 segundos antes de redirecionar

        } catch (error) {
          // Este `catch` agora sempre receberá um erro com uma .message válida
          AuthPage.ui.showPopup(`❌ ${error.message}`);
        }
      },
    },

    // Funções de validação puras
    validators: {
      nome: (val) => val.trim().length >= 8,
      email: (val) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(val),
      telefone: (val) => val.replace(/\D/g, '').length === 11,
      cpf(cpf) {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        let soma = 0, resto;
        for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i-1]) * (11 - i);
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf[9])) return false;
        soma = 0;
        for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i-1]) * (12 - i);
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        return resto === parseInt(cpf[10]);
      },
      senha: (val) => val.length >= 6 && /[!@#$%^&*(),.?":{}|<>]/.test(val) && /\d/.test(val),
      confirmarSenha: (val, senha) => val === senha && val.length > 0
    },

    // Funções de formatação (máscaras)
    formatters: {
      telefone(campo) {
        let valor = campo.value.replace(/\D/g, '').slice(0, 11);
        valor = valor.replace(/^(\d{2})(\d)/, '($1) $2');
        valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
        campo.value = valor;
      },
      cpf(campo) {
        let valor = campo.value.replace(/\D/g, '').slice(0, 11);
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        campo.value = valor;
      }
    }
  };

  // Inicia a aplicação
  AuthPage.init();
});