document.addEventListener("DOMContentLoaded", function () {
    const userInfo = document.getElementById("user-info");
    const loginLink = document.getElementById("login-link");
    const usuarioJSON = localStorage.getItem("usuarioLogado");
  
    if (usuarioJSON) {
      try {
        const usuario = JSON.parse(usuarioJSON);
  
        if (usuario && usuario.nome) {
          if (userInfo) {
            userInfo.innerHTML = `
              <span class="user-welcome">👋 Olá, <strong>${usuario.nome.split(" ")[0]}</strong></span>
              <button id="logout-btn" class="btn-login">Sair</button>
            `;
  
            const logoutBtn = document.getElementById("logout-btn");
            logoutBtn?.addEventListener("click", function () {
              localStorage.removeItem("usuarioLogado");
              window.location.reload(); // ou: window.location.href = '/pages/autenticacao.html';
            });
          }
        }
      } catch (e) {
        console.error("Erro ao ler usuário do localStorage:", e);
      }
    }
  });
  