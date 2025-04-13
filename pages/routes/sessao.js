document.addEventListener("DOMContentLoaded", function () {
    const userInfo = document.getElementById("user-info");
    const loginLink = document.getElementById("login-link");
    const usuarioJSON = localStorage.getItem("usuarioLogado");
  
    if (usuarioJSON) {
      try {
        const usuario = JSON.parse(usuarioJSON);
        console.log("usuario", usuario)
        if (usuario && usuario.nome) {
          if (userInfo) {
            let fotoHTML ="";
            if (usuario.foto && usuario.foto.data){
              fotoBase64 = bufferToBase64(usuario.foto.data)
              fotoHTML = `<img src="data:image/jpeg;base64, ${fotoBase64}" alt="FotoDoUsuario" class="foto-usuario">`
              console.log("foto 64", fotoBase64)
            }
            userInfo.innerHTML = `
              <span class="user-welcome"> ${fotoHTML} <strong>${usuario.nome.split(" ")[0]}</strong></span>
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
  }
);

function bufferToBase64(buffer){
  let binary ="";
  
  const bytes = new Uint8Array(buffer)
  for(let i=0; i < bytes.length; i++){
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
  