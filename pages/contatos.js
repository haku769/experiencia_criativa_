document.addEventListener('DOMContentLoaded', function() {
  // Script para o funcionamento do FAQ
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-toggle i');

    question.addEventListener('click', () => {
      // Fecha todos os outros itens
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.querySelector('.faq-answer').style.display = 'none';
          otherItem.querySelector('.faq-toggle i').className = 'fas fa-plus';
        }
      });

      // Alterna o item atual
      if (answer.style.display === 'block') {
        answer.style.display = 'none';
        icon.className = 'fas fa-plus';
      } else {
        answer.style.display = 'block';
        icon.className = 'fas fa-minus';
      }
    });
  });

  // Validação do formulário de contato
  const contactForm = document.querySelector('.contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Validação básica
      let isValid = true;
      const name = document.getElementById('name');
      const email = document.getElementById('email');
      const phone = document.getElementById('phone');
      const subject = document.getElementById('subject');
      const message = document.getElementById('message');
      const privacy = document.querySelector('input[name="privacy"]');
      
      // Validação de nome
      if (!name.value.trim()) {
        showError(name, 'Por favor, informe seu nome completo');
        isValid = false;
      } else {
        removeError(name);
      }
      
      // Validação de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim() || !emailRegex.test(email.value)) {
        showError(email, 'Por favor, informe um e-mail válido');
        isValid = false;
      } else {
        removeError(email);
      }
      
      // Validação de telefone (opcional)
      if (phone.value.trim()) {
        const phoneRegex = /^$$\d{2}$$\s\d{4,5}-\d{4}$/;
        if (!phoneRegex.test(phone.value)) {
          showError(phone, 'Por favor, informe um telefone no formato (00) 00000-0000');
          isValid = false;
        } else {
          removeError(phone);
        }
      }
      
      // Validação de assunto
      if (!subject.value || subject.value === '') {
        showError(subject, 'Por favor, selecione um assunto');
        isValid = false;
      } else {
        removeError(subject);
      }
      
      // Validação de mensagem
      if (!message.value.trim()) {
        showError(message, 'Por favor, digite sua mensagem');
        isValid = false;
      } else {
        removeError(message);
      }
      
      // Validação de privacidade
      if (!privacy.checked) {
        showError(privacy.parentElement, 'Você precisa concordar com a política de privacidade');
        isValid = false;
      } else {
        removeError(privacy.parentElement);
      }
      
      // Se tudo estiver válido, envia o formulário
      if (isValid) {
        // Simulação de envio
        const submitButton = contactForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
        
        // Simulação de resposta do servidor após 2 segundos
        setTimeout(() => {
          // Exibe mensagem de sucesso
          const formContainer = document.querySelector('.contact-form-container');
          formContainer.innerHTML = `
            <div class="success-message">
              <div class="success-icon">
                <i class="fas fa-check-circle"></i>
              </div>
              <h2>Mensagem Enviada com Sucesso!</h2>
              <p>Obrigado por entrar em contato conosco. Responderemos o mais breve possível.</p>
              <button class="btn btn-primary" onclick="window.location.reload()">Enviar Nova Mensagem</button>
            </div>
          `;
        }, 2000);
      }
    });
    
    // Função para mostrar erro
    function showError(input, message) {
      // Remove erro existente
      removeError(input);
      
      // Cria elemento de erro
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = message;
      
      // Adiciona classe de erro ao input
      input.classList.add('input-error');
      
      // Adiciona mensagem de erro após o input
      if (input.tagName === 'INPUT' || input.tagName === 'SELECT' || input.tagName === 'TEXTAREA') {
        input.parentElement.appendChild(errorElement);
      } else {
        // Para checkbox
        input.appendChild(errorElement);
      }
    }
    
    // Função para remover erro
    function removeError(input) {
      // Remove classe de erro
      input.classList.remove('input-error');
      
      // Remove mensagem de erro
      const parent = input.tagName === 'INPUT' || input.tagName === 'SELECT' || input.tagName === 'TEXTAREA' 
        ? input.parentElement 
        : input;
      
      const errorElement = parent.querySelector('.error-message');
      if (errorElement) {
        parent.removeChild(errorElement);
      }
    }
    
    // Máscara para telefone
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length <= 10) {
          // Formato (00) 0000-0000
          value = value.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
        } else {
          // Formato (00) 00000-0000
          value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        }
        
        e.target.value = value;
      });
    }
  }
});