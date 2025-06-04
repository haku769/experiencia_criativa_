document.addEventListener('DOMContentLoaded', function() {
    const passwordToggles = document.querySelectorAll('.password-pisca');

    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
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
        });
    });
});
const nomeInput = document.getElementById('nome');
nomeInput.addEventListener('input', function () {
  const nomeValido = nomeInput.value.trim().length >= 3;
  nomeInput.style.borderColor = nomeValido ? 'green' : 'red';
});

const telefoneInput = document.getElementById('telefone');
telefoneInput.addEventListener('input', function(e) {
  let valor = e.target.value.replace(/\D/g, '');
  
  if (valor.length > 11) {
    valor = valor.slice(0, 11);
  }
  
  if (valor.length > 6) {
    valor = valor.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
  } else if (valor.length > 2) {
    valor = valor.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
  } else if (valor.length > 0) {
    valor = valor.replace(/^(\d{0,2}).*/, '($1');
  }

  e.target.value = valor;

  const telefoneValido = /^\(\d{2}\) \d{5}-\d{4}$/.test(e.target.value);
  telefoneInput.style.borderColor = telefoneValido ? 'green' : 'red';
});



// Máscara para CPF (formato: 000.000.000-00)
const cpfInput = document.getElementById('cpf');
cpfInput.addEventListener('input', function(e) {
  let valor = e.target.value.replace(/\D/g, '');

  if (valor.length > 11) {
    valor = valor.slice(0, 11);
  }

  if (valor.length > 9) {
    valor = valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, '$1.$2.$3-$4');
  } else if (valor.length > 6) {
    valor = valor.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, '$1.$2.$3');
  } else if (valor.length > 3) {
    valor = valor.replace(/^(\d{3})(\d{0,3}).*/, '$1.$2');
  }

  e.target.value = valor;

  // Regex básico para formato do CPF
  const cpfValido = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(e.target.value);
  cpfInput.style.borderColor = cpfValido ? 'green' : 'red';
});
const emailInput = document.getElementById('email');
emailInput.addEventListener('input', function(e) {
  let valor = e.target.value.replace(/@[^@]*$/, '');

  if (!valor.endsWith('@gmail.com')) {
    valor = valor + '@gmail.com';
  }

  e.target.value = valor;

  const emailValido = /^[^\s@]+@gmail\.com$/.test(e.target.value);
  emailInput.style.borderColor = emailValido ? 'green' : 'red';
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