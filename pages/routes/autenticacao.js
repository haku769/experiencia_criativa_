document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const formContainers = document.querySelectorAll('.form-container');
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  const backToLogin = document.getElementById('back-to-login');
  const registerForm = document.querySelector('#register-form form');
  const loginForm = document.querySelector('#login-form form');
  const recoveryForm = document.querySelector('#forgot-password-form form');
  const inputPhone = document.querySelector('#register-phone');
  const inputCPF = document.querySelector('#cpf');

  function showForm(formId) {
    formContainers.forEach(form => form.classList.remove('active'));
    document.getElementById(formId).classList.add('active');
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showForm(btn.getAttribute('data-tab') === 'login' ? 'login-form' : 'register-form');
    });
  });

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showForm('forgot-password-form');
    });
  }

  if (backToLogin) {
    backToLogin.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelector('[data-tab="login"]').classList.add('active');
      showForm('login-form');
    });
  }

  function validarEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
  }

  function validarTelefone(telefone) {
    const numeros = telefone.replace(/\D/g, '');
    return /^(\d{2})(9\d{8})$/.test(numeros);
  }

  function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf[10]);
  }

  function validarSenha(senha) {
    return senha.length >= 6 && /[!@#$%^&*(),.?":{}|<>]/.test(senha) && /\d/.test(senha);
  }

  function mascaraTelefone(campo) {
    let valor = campo.value.replace(/\D/g, '').slice(0, 11);
    valor = valor.length <= 10
      ? valor.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3')
      : valor.replace(/^(\d{2})(\d{5})(\d{0,4})$/, '($1) $2-$3');
    campo.value = valor.trim().replace(/[-\s)]$/, '');
  }

  function mascaraCPF(campo) {
    let cpf = campo.value.replace(/\D/g, '');
    if (cpf.length > 3) cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    if (cpf.length > 6) cpf = cpf.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    if (cpf.length > 9) cpf = cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    campo.value = cpf;
  }

  // Função para aplicar a validação em tempo real com mudança de cor e mensagem
  function setupRealTimeValidation(inputElement, validationFunction, helpMessage, errorMessage, formatFunction = null) {
    const validationMessageElement = inputElement.nextElementSibling;

    inputElement.addEventListener('input', function () {
      if (formatFunction) {
        formatFunction(this);
      }
      const valueToValidate = formatFunction ? this.value.replace(/\D/g, '') : this.value;
      const isValid = validationFunction(valueToValidate);

      inputElement.classList.remove('is-valid', 'is-invalid');

      if (isValid) {
        inputElement.classList.add('is-valid');
        validationMessageElement.textContent = helpMessage;
        validationMessageElement.style.color = '#6c757d'; // Cor da mensagem de ajuda
      } else {
        inputElement.classList.add('is-invalid');
        validationMessageElement.textContent = errorMessage;
        validationMessageElement.style.color = 'red';
      }
    });

    // Ao perder o foco, mesmo que válido, manter a mensagem de ajuda
    inputElement.addEventListener('blur', function() {
      if (inputElement.classList.contains('is-valid')) {
        validationMessageElement.textContent = helpMessage;
        validationMessageElement.style.color = '#6c757d';
      }
    });
  }

  inputPhone.addEventListener('input', function () {
    mascaraTelefone(this);
    const isValid = validarTelefone(this.value);
    const validationMessageElement = this.nextElementSibling;
    this.classList.remove('is-valid', 'is-invalid');
    if (isValid) {
      this.classList.add('is-valid');
      validationMessageElement.textContent = 'Formato: (XX) 9XXXXXXXX.';
      validationMessageElement.style.color = '#6c757d';
    } else {
      this.classList.add('is-invalid');
      validationMessageElement.textContent = 'Telefone inválido!';
      validationMessageElement.style.color = 'red';
    }
  });

  inputCPF.addEventListener('input', function () {
    mascaraCPF(this);
    const isValid = validarCPF(this.value.replace(/\D/g, ''));
    const validationMessageElement = this.nextElementSibling;
    this.classList.remove('is-valid', 'is-invalid');
    if (isValid) {
      this.classList.add('is-valid');
      validationMessageElement.textContent = 'Digite um CPF válido.';
      validationMessageElement.style.color = '#6c757d';
    } else {
      this.classList.add('is-invalid');
      validationMessageElement.textContent = 'CPF inválido!';
      validationMessageElement.style.color = 'red';
    }
  });

  const registerNameInput = document.querySelector('#register-name');
  const registerEmailInput = document.querySelector('#register-email');
  const registerPasswordInput = document.querySelector('#register-password');
  const registerConfirmPasswordInput = document.querySelector('#register-confirm-password');
  const termsCheckbox = document.querySelector('#terms'); // Adicionei a seleção do checkbox de termos

  setupRealTimeValidation(
    registerNameInput,
    (value) => value.length >= 8,
    'Digite seu nome completo (mínimo 8 caracteres).',
    'O nome deve ter pelo menos 8 caracteres!'
  );

  setupRealTimeValidation(
    registerEmailInput,
    validarEmail,
    'Insira um e-mail do Gmail no formato correto.',
    'O e-mail deve ser do Gmail e estar no formato correto!'
  );

  setupRealTimeValidation(
    registerPasswordInput,
    validarSenha,
    'Mínimo 6 caracteres, um número e um símbolo.',

  );

  setupRealTimeValidation(
    registerConfirmPasswordInput,
    (value) => value === registerPasswordInput.value,
    'As senhas devem corresponder.',
  );

  async function renovarTokenSeNecessario() {
    let token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (Date.now() < payload.exp * 1000) return token;
      } catch {
        console.warn('⚠️ Token inválido, tentando renovar...');
      }
    }

    if (refreshToken) {
      try {
        const res = await fetch('http://localhost:3000/autenticacao/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          return data.token;
        } else {
          showPopup('⚠️ Sessão expirada. Faça login novamente.');
          localStorage.clear();
          window.location.href = '/autenticacao.html';
        }
      } catch {
        showPopup('❌ Erro ao renovar token.');
        window.location.href = 'autenticacao.html';
      }
    } else {
      showPopup('⚠️ Você precisa estar logado.');
      window.location.href = '/autenticacao.html';
    }
  }

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.querySelector('#register-name').value.trim();
    const email = document.querySelector('#register-email').value;
    const telefone = inputPhone.value.replace(/\D/g, '');
    const cpf = inputCPF.value.replace(/\D/g, '');
    const senha = document.querySelector('#register-password').value;
    const confirmarSenha = document.querySelector('#register-confirm-password').value;
    const termos = termsCheckbox.checked; // Use a variável termsCheckbox
    const foto = document.querySelector('#register-photo').files[0];

    // const dataNascimento = document.querySelector('#register-birthdate').value;

    let isValidForm = true;

    // Validação final e exibição de mensagens de erro no submit
    const validateFieldOnSubmit = (inputElement, isValid, errorMessage, helpMessage) => {
      const validationMessageElement = inputElement.nextElementSibling;
      inputElement.classList.remove('is-valid', 'is-invalid');
      if (isValid) {
        inputElement.classList.add('is-valid');
        validationMessageElement.textContent = helpMessage;
        validationMessageElement.style.color = '#6c757d';
      } else {
        inputElement.classList.add('is-invalid');
        validationMessageElement.textContent = errorMessage;
        validationMessageElement.style.color = 'red';
        isValidForm = false;
      }
    };

    validateFieldOnSubmit(registerNameInput, nome.length >= 8, 'O nome deve ter pelo menos 8 caracteres!', 'Digite seu nome completo (mínimo 8 caracteres).');
    validateFieldOnSubmit(registerEmailInput, validarEmail(email), 'O e-mail deve ser do Gmail e estar no formato correto!', 'Insira um e-mail do Gmail no formato correto.');
    validateFieldOnSubmit(inputPhone, validarTelefone(telefone), 'Telefone inválido!', 'Formato: (XX) 9XXXXXXXX.');
    validateFieldOnSubmit(inputCPF, validarCPF(cpf), 'CPF inválido!', 'Digite um CPF válido.');
    validateFieldOnSubmit(registerPasswordInput, validarSenha(senha), 'Senha fraca! Use 6+ caracteres, número e símbolo.', 'Mínimo 6 caracteres, um número e um símbolo.');
    validateFieldOnSubmit(registerConfirmPasswordInput, senha === confirmarSenha, 'As senhas não coincidem!', 'As senhas devem corresponder.');

    if (!termos) {
      showPopup('Você deve aceitar os termos!');
      isValidForm = false;
    }
    if (!foto) {
      showPopup('Selecione uma foto para o perfil!');
      isValidForm = false;
    }

    if (!isValidForm) return;

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('email', email);
    formData.append('telefone', telefone);
    formData.append('cpf', cpf);
    formData.append('senha', senha);
    formData.append('foto', foto);


    try {
      const res = await fetch('http://localhost:3000/autenticacao/registro', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showPopup('✅ Conta criada com sucesso!');
        document.querySelector('[data-tab="login"]').click();
      } else {
        showPopup(`❌ Erro: ${data.erro}`);
      }
    } catch {
      showPopup('❌ Erro ao tentar registrar. Verifique a conexão.');
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#login-email').value;
    const senha = document.querySelector('#login-password').value;

    if (!validarEmail(email)) return showPopup('O e-mail está incorreto!');
    if (!validarSenha(senha)) return showPopup('A senha deve ter pelo menos 6 caracteres e símbolo!');

    try {
      const res = await fetch('http://localhost:3000/autenticacao/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await res.json();

      if (res.ok) {
        const { usuario, token, refreshToken } = data;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        showPopup('✅ Login realizado com sucesso!');
        window.location.href = '/index.html';
      } else {
        showPopup(`❌ Erro: ${data.erro}`);
      }
    } catch {
      showPopup('❌ Erro ao tentar logar. Verifique a conexão.');
    }
  });

  if (recoveryForm) {
    recoveryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showPopup('🔁 Um e-mail de recuperação será enviado.');
      showForm('login-form');
    });
  }

  function showPopup(message) {
    const existingOverlay = document.getElementById('custom-popup-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custom-popup-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    });

    const popup = document.createElement('div');
    Object.assign(popup.style, {
      backgroundColor: '#fff',
      padding: '30px',
      borderRadius: '10px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      width: '400px',
      maxWidth: '90%',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px'
    });

    const messageEl = document.createElement('div');
    messageEl.innerText = message;

    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'Fechar';
    Object.assign(closeBtn.style, {
      marginTop: '20px',
      padding: '10px 20px',
      backgroundColor: '#333',
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
    });
    closeBtn.onclick = () => overlay.remove();

    popup.appendChild(messageEl);
    popup.appendChild(closeBtn);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  }
});
document.addEventListener('DOMContentLoaded', function() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    const toggleButtons = document.querySelectorAll('.password-toggle');

    toggleButtons.forEach((toggle, index) => {
        toggle.addEventListener('click', function() {
            // Encontra o input de senha correto com base na estrutura HTML
            const passwordInput = this.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            const eyeIcon = this.querySelector('i');
            if (eyeIcon) {
                eyeIcon.classList.toggle('fa-eye');
                eyeIcon.classList.toggle('fa-eye-slash');
            }
        });
    });
});