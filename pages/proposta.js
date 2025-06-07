// ==========================================================
//     SCRIPT EXCLUSIVO PARA A PÁGINA PROPOSTA.HTML
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    // Verifica se o usuário está logado antes de fazer qualquer coisa
    if (!getToken()) {
        alert('Você precisa estar logado para enviar uma proposta.');
        window.location.href = '/autenticacao.html'; 
        return;
    }

    // NOVO: Seleciona os elementos do pop-up que acabamos de adicionar no HTML
    const popup = document.getElementById('popup-proposta');
    const closeButton = document.getElementById('popup-close');
    const okButton = document.getElementById('popup-btn-ok');

    // NOVO: Funções para controlar a visibilidade do pop-up
    const mostrarPopup = () => popup.classList.add('show');
    const esconderPopup = () => popup.classList.remove('show');

    // NOVO: Adiciona os eventos para fechar o pop-up
    closeButton.addEventListener('click', esconderPopup);
    okButton.addEventListener('click', esconderPopup);
    popup.addEventListener('click', (e) => {
        // Fecha o pop-up apenas se o clique for no fundo escuro
        if (e.target === popup) {
            esconderPopup();
        }
    });


    popularVeiculosDropdown();
    // MODIFICADO: Passamos a função de mostrar o pop-up como argumento
    configurarFormularioProposta(mostrarPopup); 
});

/**
 * Busca todos os veículos da API e preenche o menu de seleção.
 */
async function popularVeiculosDropdown() {
    const selectVeiculo = document.getElementById('select-veiculo');
    if (!selectVeiculo) return;

    try {
        const response = await fetch('http://localhost:3000/veiculos');
        if (!response.ok) throw new Error('Não foi possível carregar a lista de veículos.');
        const veiculos = await response.json();
        selectVeiculo.innerHTML = '<option value="">-- Selecione um veículo --</option>';
        veiculos.forEach(veiculo => {
            const option = document.createElement('option');
            option.value = veiculo.ID_VEICULO;
            option.textContent = `${veiculo.MARCA} ${veiculo.MODELO} (${veiculo.ANO})`;
            selectVeiculo.appendChild(option);
        });
    } catch (error) {
        console.error(error);
        selectVeiculo.innerHTML = '<option value="">Erro ao carregar veículos</option>';
    }
}

/**
 * Configura o evento de 'submit' do formulário.
 * @param {function} onSucesso - Função a ser chamada em caso de sucesso (mostrar o pop-up).
 */
// MODIFICADO: A função agora aceita um parâmetro para saber o que fazer em caso de sucesso
function configurarFormularioProposta(onSucesso) {
    const form = document.getElementById('form-proposta');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const veiculoId = document.getElementById('select-veiculo').value;
        const valorProposta = document.getElementById('valor_proposta').value;
        const mensagem = document.getElementById('mensagem').value;

        if (!veiculoId) {
            mostrarMensagem('Por favor, selecione um veículo.', 'erro');
            return;
        }

        const botaoSubmit = form.querySelector('button[type="submit"]');
        botaoSubmit.disabled = true;
        botaoSubmit.textContent = 'Enviando...';

        const resultado = await apiFetch('/api/propostas', {
            method: 'POST',
            body: JSON.stringify({ veiculoId, valorProposta, mensagem })
        });

        if (resultado) {
            // MODIFICADO: Em vez de chamar `mostrarMensagem`, chamamos a função de sucesso (que mostra o pop-up)
            form.reset(); 
            onSucesso(); // <-- AQUI A MÁGICA ACONTECE!
        } else {
            // A função `mostrarMensagem` ainda é útil para erros!
            mostrarMensagem('Não foi possível enviar a proposta. Tente novamente.', 'erro');
        }

        botaoSubmit.disabled = false;
        botaoSubmit.textContent = 'Enviar Proposta';
    });
}


// --- FUNÇÕES DE APOIO (TOKEN, API, MENSAGEM) ---
// (Estas funções permanecem as mesmas)

function getToken() {
    return localStorage.getItem('token');
}

function mostrarMensagem(texto, tipo) {
    const el = document.querySelector(".mensagem-feedback");
    if (el) el.remove();
    const mensagem = document.createElement("div");
    mensagem.className = `mensagem-feedback ${tipo}`;
    mensagem.textContent = texto;
    document.body.appendChild(mensagem);
    setTimeout(() => {
        mensagem.classList.add("fadeout");
        setTimeout(() => mensagem.remove(), 500);
    }, 3000);
}

async function apiFetch(url, options = {}) {
    const token = getToken();
    if (!token) return null;
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    options.headers = { ...headers, ...options.headers };
    try {
        const response = await fetch('http://localhost:3000' + url, options);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.erro || `Erro na requisição: ${response.statusText}`);
        }
        return response.status === 204 ? { success: true } : response.json();
    } catch (error) {
        console.error("Erro de API:", error.message);
        return null;
    }
}