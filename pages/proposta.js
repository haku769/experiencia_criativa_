document.addEventListener('DOMContentLoaded', () => {
    // Verifica se o usuário está logado
    if (!getToken()) {
        // Usa o novo popup para o erro de login
        showFeedbackPopup(
            'Acesso Negado',
            'Você precisa estar logado para enviar uma proposta.',
            'error',
            () => { window.location.href = 'autenticacao.html'; } // Ação ao fechar: redireciona
        );
        return; // Impede a execução do restante do script
    }

    // Inicializa as funcionalidades da página
    popularVeiculosDropdown();
    configurarValidacaoDeOferta();
    configurarFormularioProposta();
    configurarPopup(); // Adiciona os listeners para o popup funcionar
});

/**
 * Exibe um popup de feedback centralizado na tela.
 * @param {string} message - A mensagem principal (título).
 * @param {string} secondaryMessage - A mensagem secundária (descrição).
 * @param {string} type - O tipo de feedback ('success' ou 'error').
 * @param {Function} [onCloseCallback=null] - Função opcional a ser executada quando o popup for fechado.
 */
function showFeedbackPopup(message, secondaryMessage, type = 'success', onCloseCallback = null) {
    const popup = document.getElementById('feedback-popup');
    const icon = document.getElementById('popup-icon');
    const messageEl = document.getElementById('popup-message');
    const secondaryMessageEl = document.getElementById('popup-secondary-message');
    const closeButton = document.getElementById('popup-close-button');

    if (!popup || !icon || !messageEl || !secondaryMessageEl || !closeButton) {
        console.error("Elementos do popup não encontrados no DOM.");
        return;
    }

    // Define o conteúdo do popup
    messageEl.textContent = message;
    secondaryMessageEl.textContent = secondaryMessage;

    // Define o ícone e a cor com base no tipo
    icon.className = `popup-icon fas ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'} ${type}`;
    
    // Configura a ação de fechamento, sobrescrevendo qualquer listener anterior
    closeButton.onclick = () => {
        popup.classList.remove('is-visible');
        if (onCloseCallback) {
            onCloseCallback();
        }
    };

    // Exibe o popup
    popup.classList.add('is-visible');
}

/**
 * Configura o evento de clique para o botão de fechar do popup.
 */
function configurarPopup() {
    const popup = document.getElementById('feedback-popup');
    const closeButton = document.getElementById('popup-close-button');
    if (popup && closeButton) {
        closeButton.addEventListener('click', () => {
            popup.classList.remove('is-visible');
        });
    }
}

/**
 * Preenche o dropdown de seleção de veículos com dados da API.
 */
async function popularVeiculosDropdown() {
    const selectVeiculo = document.getElementById('select-veiculo');
    if (!selectVeiculo) return;

    try {
        const response = await fetch('http://localhost:3000/veiculos');
        if (!response.ok) {
            throw new Error('Não foi possível carregar os veículos.');
        }
        
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
        console.error("Erro ao carregar veículos:", error);
        selectVeiculo.innerHTML = '<option value="">Erro ao carregar veículos</option>';
        showFeedbackPopup('Erro de Conexão', 'Não foi possível carregar a lista de veículos. Tente recarregar a página.', 'error');
    }
}

/**
 * Converte um valor de string formatada (ex: "1.500.000") para um número (ex: 1500000).
 * @param {string} valorFormatado 
 * @returns {number}
 */
function parseValor(valorFormatado) {
    if (!valorFormatado) return 0;
    // Remove todos os caracteres que não são dígitos
    return parseFloat(valorFormatado.replace(/\D/g, '')) || 0;
}


/**
 * Configura a validação em tempo real e a formatação do campo de valor da oferta.
 */
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
    
    // ==========================================================
    // LÓGICA DE FORMATAÇÃO E VALIDAÇÃO ATUALIZADA
    // ==========================================================
    inputOferta.addEventListener('input', (e) => {
        // Armazena a posição atual do cursor para uma melhor experiência do usuário
        const posCursorOriginal = e.target.selectionStart;
        const valorOriginal = e.target.value;

        // 1. Limpa o valor, mantendo apenas os dígitos.
        const valorNumerico = parseValor(valorOriginal);

        // 2. Formata o número limpo com os separadores de milhar.
        const valorFormatado = valorNumerico > 0 ? valorNumerico.toLocaleString('pt-BR') : '';
        e.target.value = valorFormatado;

        // 3. Recalcula a posição do cursor para que ele não pule para o final.
        const diferencaTamanho = valorFormatado.length - valorOriginal.length;
        const novaPosCursor = posCursorOriginal + diferencaTamanho;
        e.target.setSelectionRange(novaPosCursor, novaPosCursor);
        
        // 4. Chama a validação.
        validarOferta();
    });

    function validarOferta() {
        // Usa a função parseValor para obter o número real para comparação
        const valorOferta = parseValor(inputOferta.value);

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

/**
 * Configura o formulário de proposta para validação e envio via API.
 */
function configurarFormularioProposta() {
    const form = document.getElementById('form-proposta');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const selectVeiculoEl = document.getElementById('select-veiculo');
        const inputOfertaEl = document.getElementById('valor_proposta');
        const textareaMensagemEl = document.getElementById('mensagem');

        const veiculoId = selectVeiculoEl.value;
        // ==========================================================
        // LÊ O VALOR USANDO A FUNÇÃO parseValor
        // ==========================================================
        const valorProposta = parseValor(inputOfertaEl.value);
        const mensagem = textareaMensagemEl.value;

        if (!veiculoId) {
            showFeedbackPopup('Formulário Incompleto', 'Por favor, selecione um veículo.', 'error');
            return;
        }
        if (valorProposta <= 0) {
            showFeedbackPopup('Valor Inválido', 'Por favor, insira um valor de oferta válido.', 'error');
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
            showFeedbackPopup(
                'Proposta Enviada com Sucesso!',
                'Obrigado! A loja analisará sua proposta e entrará em contato em breve.',
                'success'
            );
            
            form.reset();
            document.getElementById('display-preco').classList.add('hidden');
            inputOfertaEl.classList.remove('is-invalid');
            document.getElementById('feedback-proposta').classList.remove('is-visible');
        } else {
            showFeedbackPopup(
                'Falha no Envio',
                'Não foi possível enviar sua proposta. Verifique sua conexão e tente novamente.',
                'error'
            );
        }

        botaoSubmit.disabled = false;
        botaoSubmit.textContent = 'Enviar Proposta';
    });
}


// ==========================================================
// FUNÇÕES DE APOIO (TOKEN E API)
// ==========================================================

function getToken() {
    return localStorage.getItem('token');
}

async function apiFetch(url, options = {}) {
    const token = getToken();
    if (!token) {
        console.error("Tentativa de chamada de API sem token.");
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
            const errData = await response.json().catch(() => ({ message: 'Erro desconhecido no servidor.' }));
            throw new Error(errData.erro || errData.message || `Erro na requisição: ${response.status}`);
        }
        return response.status === 204 ? { success: true } : await response.json();
    } catch (error) {
        console.error("Erro na chamada da API:", error);
        return null;
    }
}
