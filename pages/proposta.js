// ==========================================================
//   SCRIPT COMPLETO E ATUALIZADO PARA A PÁGINA PROPOSTA.HTML
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    // Verifica se o usuário está logado
    if (!getToken()) {
        showToast('Você precisa estar logado para enviar uma proposta.', 'error');
        setTimeout(() => window.location.href = 'autenticacao.html', 3000);
        return;
    }

    // Inicializa as funcionalidades da página
    popularVeiculosDropdown();
    configurarValidacaoDeOferta();
    configurarFormularioProposta(); // Não precisa mais passar a função do popup
});

/**
 * Cria e exibe uma notificação (toast) na tela.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} type - O tipo de toast ('success' ou 'error').
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    // Define o ícone com base no tipo
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-times-circle';

    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${iconClass}"></i> ${message}`;

    container.appendChild(toast);

    // Remove o toast após alguns segundos
    setTimeout(() => {
        toast.classList.add('fade-out');
        // Espera a animação de fade-out terminar para remover o elemento do DOM
        toast.addEventListener('animationend', () => toast.remove());
    }, 5000); // O toast fica visível por 5 segundos
}


async function popularVeiculosDropdown() {
    const selectVeiculo = document.getElementById('select-veiculo');
    if (!selectVeiculo) return;

    try {
        const response = await fetch('http://localhost:3000/veiculos');
        if (!response.ok) throw new Error('Não foi possível carregar os veículos.');
        
        const veiculos = await response.json();
        selectVeiculo.innerHTML = '<option value="">-- Selecione um veículo --</option>';
        
        veiculos.forEach(veiculo => {
            const option = document.createElement('option');
            option.value = veiculo.ID_VEICULO;
            const ano = new Date(veiculo.ANO).getFullYear();
            option.textContent = `${veiculo.MARCA} ${veiculo.MODELO} (${ano})`;
            option.dataset.preco = veiculo.VALOR; 
            selectVeiculo.appendChild(option);
        });
    } catch (error) {
        console.error(error);
        showToast('Erro ao carregar veículos.', 'error');
        selectVeiculo.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}


function configurarValidacaoDeOferta() {
    const selectVeiculo = document.getElementById('select-veiculo');
    const inputOferta = document.getElementById('valor_proposta');
    const feedbackEl = document.getElementById('feedback-proposta');
    const displayPrecoContainer = document.getElementById('display-preco');
    const precoTextoEl = document.getElementById('preco-veiculo-texto');

    let precoReferencia = 0;
    const LIMITE_PROPOSTA_BAIXA = 0.8; 

    selectVeiculo.addEventListener('change', () => {
        const selectedOption = selectVeiculo.options[selectVeiculo.selectedIndex];
        const preco = selectedOption.dataset.preco;

        if (preco) {
            precoReferencia = parseFloat(preco);
            precoTextoEl.textContent = precoReferencia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            displayPrecoContainer.classList.remove('hidden');
        } else {
            precoReferencia = 0;
            displayPrecoContainer.classList.add('hidden');
        }
        validarOferta();
    });

    inputOferta.addEventListener('input', validarOferta);

    function validarOferta() {
        const valorOferta = parseFloat(inputOferta.value) || 0;

        if (valorOferta > 0 && precoReferencia > 0 && valorOferta < (precoReferencia * LIMITE_PROPOSTA_BAIXA)) {
            inputOferta.classList.add('is-invalid');
            feedbackEl.textContent = 'Proposta muito baixa.';
            feedbackEl.classList.add('is-visible');
        } else {
            inputOferta.classList.remove('is-invalid');
            feedbackEl.classList.remove('is-visible');
        }
    }
}


// Versão atualizada usando o novo sistema de toasts
function configurarFormularioProposta() {
    const form = document.getElementById('form-proposta');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const selectVeiculoEl = document.getElementById('select-veiculo');
        const inputOfertaEl = document.getElementById('valor_proposta');
        const textareaMensagemEl = document.getElementById('mensagem');

        const veiculoId = selectVeiculoEl.value;
        const valorProposta = inputOfertaEl.value;
        const mensagem = textareaMensagemEl.value;

        // Validações com o novo feedback
        if (!veiculoId) {
            showToast('Por favor, selecione um veículo.', 'error');
            return;
        }
        if (valorProposta <= 0) {
            showToast('Por favor, insira um valor de oferta válido.', 'error');
            return;
        }
        if (inputOfertaEl.classList.contains('is-invalid')) {
            if (!confirm('Sua proposta é considerada muito baixa. Deseja enviá-la mesmo assim?')) {
                return;
            }
        }

        const botaoSubmit = form.querySelector('button[type="submit"]');
        botaoSubmit.disabled = true;
        botaoSubmit.textContent = 'Enviando...';

        const resultado = await apiFetch('/api/propostas', {
            method: 'POST',
            body: JSON.stringify({ veiculoId, valorProposta, mensagem })
        });

        if (resultado) {
            showToast('Proposta enviada com sucesso!', 'success');
            form.reset(); 
            document.getElementById('display-preco').classList.add('hidden');
            inputOfertaEl.classList.remove('is-invalid');
            document.getElementById('feedback-proposta').classList.remove('is-visible');
        } else {
            showToast('Não foi possível enviar a proposta.', 'error');
        }

        botaoSubmit.disabled = false;
        botaoSubmit.textContent = 'Enviar Proposta';
    });
}


// FUNÇÕES DE APOIO (TOKEN E API)
function getToken() {
    return localStorage.getItem('token');
}

async function apiFetch(url, options = {}) {
    const token = getToken();
    if (!token) {
        showToast("Sessão expirada. Faça login novamente.", "error");
        return null;
    }

    const headers = { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
    };
    options.headers = { ...headers, ...options.headers };

    try {
        const response = await fetch('http://localhost:3000' + url, options);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({ message: 'Erro desconhecido.' }));
            throw new Error(errData.erro || errData.message || `Erro na requisição: ${response.status}`);
        }
        return response.status === 204 ? { success: true } : await response.json();
    } catch (error) {
        console.error("Erro na chamada da API:", error);
        return null;
    }
}