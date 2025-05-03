document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const formContainers = document.querySelectorAll('.form-container');
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  const backToLogin = document.getElementById('back-to-login');

  async function renovarTokenSeNecessario() {
    let token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
  
    // Testar se o token é válido antes (opcional)
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        if (Date.now() < exp) {
          return token;
        }
      } catch (err) {
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
  
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('token', data.token);
          return data.token;
        } else {
          showPopup('⚠️ Sessão expirada. Faça login novamente.');
          localStorage.clear();
          window.location.href = '/autenticacao.html';
        }
      } catch (err) {
        showPopup('❌ Erro ao renovar token.');
        window.location.href = 'autenticacao.html';
      }
    } else {
      showPopup('⚠️ Você precisa estar logado.');
      window.location.href = '/autenticacao.html';
    }
  }
  

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

  function mascaraTelefone(campo) {
    let valor = campo.value.replace(/\D/g, '').slice(0, 11);
    if (valor.length <= 10) {
      valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else {
      valor = valor.replace(/^(\d{2})(\d{5})(\d{0,4})$/, '($1) $2-$3');
    }
    campo.value = valor.trim().replace(/[-\s)]$/, '');
  }

  function validarTelefone(telefone) {
    const numeros = telefone.replace(/\D/g, '');
    return /^(\d{2})(9\d{8})$/.test(numeros);
  }

  function mascaraCPF(campo) {
    let cpf = campo.value.replace(/\D/g, '');
    if (cpf.length > 3) cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    if (cpf.length > 6) cpf = cpf.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    if (cpf.length > 9) cpf = cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    campo.value = cpf;
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

  // ========== Registro ==========
  const registerForm = document.querySelector('#register-form form');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const nome = document.querySelector('#register-name').value.trim();
    const email = document.querySelector('#register-email').value;
    const telefone = document.querySelector('#register-phone').value;
    const cpf = document.querySelector('#cpf').value.replace(/[^\d]/g, '');
    const senha = document.querySelector('#register-password').value;
    const confirmarSenha = document.querySelector('#register-confirm-password').value;
    const termos = document.querySelector('#terms').checked;
    const foto = document.querySelector('#register-photo').files[0]; // imagem
  
    if (nome.length < 8) return showPopup('O nome deve ter pelo menos 8 caracteres!');
    if (!validarEmail(email)) return showPopup('O e-mail deve ser do Gmail e estar no formato correto!');
    if (!validarTelefone(telefone)) return showPopup('Telefone inválido! Use o formato (XX) 9XXXX-XXXX');
    if (!validarCPF(cpf)) return showPopup('CPF inválido!');
    if (!validarSenha(senha)) return showPopup('Senha fraca! Use 6+ caracteres, número e símbolo.');
    if (senha !== confirmarSenha) return showPopup('As senhas não coincidem!');
    if (!termos) return showPopup('Você deve aceitar os termos!');
    if (!foto) return showPopup('Selecione uma foto para o perfil!');
  
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('email', email);
    formData.append('telefone', telefone.replace(/\D/g, ''));
    formData.append('cpf', cpf);
    formData.append('senha', senha);
    formData.append('foto', foto); // ⚠️ nome deve ser 'foto'
  
    try {
      const res = await fetch('http://localhost:3000/autenticacao/registro', {
        method: 'POST',
        body: formData // não precisa de headers
      });

      const data = await res.json();
      if (res.ok) {
        showPopup('✅ Conta criada com sucesso!');
        document.querySelector('[data-tab="login"]').click();
      } else {
        showPopup(`❌ Erro: ${data.erro}`);
      }
    } catch (err) {
      showPopup('❌ Erro ao tentar registrar. Verifique a conexão.');
    }
  });

  // ========== Login ==========
  const loginForm = document.querySelector('#login-form form');
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
        console.log(data)

        localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario ));
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        showPopup('✅ Login realizado com sucesso!');
        window.location.href = '/index.html';
      }
       else {
        showPopup(`❌ Erro: ${data.erro}`);
      }
    } catch (err) {
      showPopup('❌ Erro ao tentar logar. Verifique a conexão.');
    }
  });

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


  // ========== Recuperação de Senha ==========
  const recoveryForm = document.querySelector('#forgot-password-form form');
  if (recoveryForm) {
    recoveryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showPopup('🔁 Um e-mail de recuperação será enviado.');
      showForm('login-form');
    });
  }

  // ========== Máscaras ==========
  document.querySelector('#register-phone').addEventListener('input', function () {
    mascaraTelefone(this);
  });

  document.querySelector('#cpf').addEventListener('input', function () {
    mascaraCPF(this);
  });
});


