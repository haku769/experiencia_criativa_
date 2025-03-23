const tabBtns = document.querySelectorAll('.tab-btn');
const formContainers = document.querySelectorAll('.form-container');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const backToLogin = document.getElementById('back-to-login');

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

// Funções de validação
function validarEmail(email) {
  const regexEmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  return regexEmail.test(email);
}
// Funções de validação de telefone
document.addEventListener("DOMContentLoaded", function () {
  const telefoneInput = document.getElementById("register-phone");
  const formulario = document.getElementById("register-form");
  const erroTelefone = document.getElementById("erroTelefone");

  telefoneInput.addEventListener("input", function () {
      mascaraTelefone(this);
  });

  formulario.addEventListener("submit", function (event) {
      erroTelefone.textContent = ""; // Limpa mensagens anteriores

      if (!validarTelefone(telefoneInput.value)) {
          erroTelefone.textContent = "Telefone inválido! Use o formato (99) 99999-9999";
          event.preventDefault(); // Impede o envio do formulário
      }
  });
});

function mascaraTelefone(campo) {
  let telefone = campo.value.replace(/\D/g, ""); // Remove tudo que não for número

  // Limita o número de caracteres (DDD + 9 dígitos)
  if (telefone.length > 11) {
      telefone = telefone.slice(0, 11);
  }

  // Adiciona a formatação do telefone
  if (telefone.length > 2) {
      telefone = `(${telefone.slice(0, 2)}) ${telefone.slice(2)}`;
  }
  if (telefone.length > 9) {
      telefone = `${telefone.slice(0, 10)}-${telefone.slice(10)}`;
  }

  campo.value = telefone;
}

function validarTelefone(telefone) {
  const regexTelefone = /^\(\d{2}\) \d{5}-\d{4}$/;
  return regexTelefone.test(telefone);
}



// Funções de validação de CPF
function mascaraCPF(campo) {
      let cpf = campo.value.replace(/\D/g, ""); 

      if (cpf.length > 3) cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
      if (cpf.length > 6) cpf = cpf.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
      if (cpf.length > 9) cpf = cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");

      campo.value = cpf;
  }

  function validarCPF(cpf) {
      cpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
      if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false; // Impede CPFs repetidos, como 111.111.111-11

      let soma = 0, resto;
      for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
      resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(cpf[9])) return false;

      soma = 0;
      for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i);
      resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(cpf[10])) return false;

      return true;
  }

  document.getElementById("register-form").addEventListener("submit", function(event) {
      let cpfInput = document.getElementById("cpf");
      let erroCPF = document.getElementById("erroCPF");
      
      erroCPF.textContent = ""; 

      if (!validarCPF(cpfInput.value)) {
          erroCPF.textContent = "CPF inválido!";
          event.preventDefault(); 
      }
  });

  // Funções de validação de senha

function validarSenha(senha) {
  const temMinimo6 = senha.length >= 6;
  const temEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(senha);
  const temNumero = /\d/.test(senha);

  return temMinimo6 && temEspecial && temNumero ;
}

// Validação do Login
const loginForm = document.querySelector('#login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-password').value;

    if (!validarEmail(email)) {
      alert('O e-mail deve estar no formato correto e ser do Gmail!');
      return;
    }

    if (!validarSenha(senha)) {
      alert('A senha deve ter pelo menos 6 caracteres e conter um cáracter especial!');
      return;
    }

    alert('Login realizado com sucesso!');
  });
}

// Validação do Cadastro
const registerForm = document.querySelector('#register-form form');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value;
    const telefone = document.getElementById('register-phone').value;
    const senha = document.getElementById('register-password').value;
    const confirmarSenha = document.getElementById('register-confirm-password').value;
    const termos = document.getElementById('terms').checked;

    if (nome.length < 8) {
      alert('O nome deve ter pelo menos 8 caracteres!');
      return;
    }

    if (!validarEmail(email)) {
      alert('O e-mail deve estar no formato correto e ser do Gmail!');
      return;
    }

    if (!validarTelefone(telefone)) {
      alert('O telefone deve estar no formato correto: (00) 00000-0000');
      return;
    }

    if (!validarSenha(senha)) {
      alert('A senha deve ter pelo menos 6 caracteres e conter um caracter especial!');
      return;
    }

    if (senha !== confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }

    if (!termos) {
      alert('Você deve aceitar os termos de uso!');
      return;
    }

    alert('Conta criada com sucesso!');
  });
}

// Validação do formulário de recuperação de senha
const recoveryForm = document.querySelector('#forgot-password-form form');
if (recoveryForm) {
  recoveryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('E-mail de recuperação enviado com sucesso!');
    showForm('login-form');
  });
}