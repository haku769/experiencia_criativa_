document.addEventListener('DOMContentLoaded', () => {
    verificarPermissaoEcarregarPropostas();
    configurarPopups(); // Configura apenas os popups de feedback persistentes
});

/**
 * Função principal: verifica a permissão do usuário e carrega os dados.
 */
async function verificarPermissaoEcarregarPropostas() {
    const container = document.getElementById('propostas-container');
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (!usuarioLogado) {
        container.innerHTML = '<div class="error-message">Acesso negado. Esta página é restrita a administradores.</div>';
        return;
    }

    const propostas = await apiFetch('/api/propostas');

    if (propostas) {
        if (propostas.length === 0) {
            container.innerHTML = '<p>Nenhuma proposta recebida até o momento.</p>';
            return;
        }

        container.innerHTML = ''; // Limpa o "carregando"
        propostas.forEach(proposta => {
            container.appendChild(criarCardProposta(proposta));
        });
    } else {
        container.innerHTML = '<div class="error-message">Ocorreu um erro ao carregar as propostas.</div>';
    }
}

/**
 * Cria o elemento HTML para um único card de proposta.
 */
function criarCardProposta(proposta) {
    const card = document.createElement('div');
    card.className = `proposta-card status-${proposta.status.toLowerCase().replace(' ', '-')}`;
    card.dataset.id = proposta.id;

    const dataFormatada = new Date(proposta.data_proposta).toLocaleString('pt-BR');
    const valorFormatado = `R$ ${Number(proposta.valor_proposta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    card.innerHTML = `
        <div class="proposta-header">
            <h4>Proposta #${proposta.id}</h4>
            <span class="proposta-status">${proposta.status}</span>
        </div>
        <div class="proposta-body">
            <p><strong>Veículo:</strong> ${proposta.marca_veiculo} ${proposta.modelo_veiculo}</p>
            <p><strong>Proponente:</strong> ${proposta.nome_usuario} (${proposta.email_usuario})</p>
            <p><strong>Oferta:</strong> <span class="valor-proposta">${valorFormatado}</span></p>
            <p><strong>Mensagem:</strong> <em>${proposta.mensagem || 'Nenhuma mensagem.'}</em></p>
        </div>
        <div class="proposta-footer">
            <span>Enviada em: ${dataFormatada}</span>
            <div class="proposta-admin-actions">
                <select class="status-select">
                    <option value="Pendente" ${proposta.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="Em Análise" ${proposta.status === 'Em Análise' ? 'selected' : ''}>Em Análise</option>
                    <option value="Aceita" ${proposta.status === 'Aceita' ? 'selected' : ''}>Aceita</option>
                    <option value="Recusada" ${proposta.status === 'Recusada' ? 'selected' : ''}>Recusada</option>
                </select>
                <button class="btn btn-sm btn-primary btn-save">Salvar Status</button>
                <button class="btn btn-sm btn-danger btn-delete">Deletar</button>
            </div>
        </div>
    `;

    card.querySelector('.btn-save').addEventListener('click', () => {
        const selectStatus = card.querySelector('.status-select');
        atualizarStatusProposta(proposta.id, selectStatus.value, card);
    });

    card.querySelector('.btn-delete').addEventListener('click', () => {
        deletarProposta(proposta.id, card);
    });

    return card;
}

/**
 * Envia a atualização de status para a API.
 */
async function atualizarStatusProposta(propostaId, novoStatus, cardElement) {
    const resultado = await apiFetch(`/api/propostas/${propostaId}`, {
        method: 'PUT',
        body: JSON.stringify({ novoStatus })
    });

    if (resultado) {
        showFeedbackPopup('Sucesso!', 'Status da proposta atualizado!', 'success');
        cardElement.querySelector('.proposta-status').textContent = novoStatus;
        cardElement.className = `proposta-card status-${novoStatus.toLowerCase().replace(' ', '-')}`;
    }
}

/**
 * Mostra um popup de confirmação e deleta a proposta se confirmado.
 */
function deletarProposta(propostaId, cardElement) {
    showConfirmPopup(
        'Tem certeza que deseja deletar esta proposta? Esta ação não pode ser desfeita.',
        async () => { // Esta função será executada se o usuário clicar em "Confirmar"
            const resultado = await apiFetch(`/api/propostas/${propostaId}`, {
                method: 'DELETE'
            });

            if (resultado) {
                showFeedbackPopup('Sucesso!', 'Proposta deletada com sucesso!', 'success');
                cardElement.remove();
            }
        }
    );
}

// --- FUNÇÕES DE APOIO (TOKEN, API, POPUPS) ---

function getToken() { return localStorage.getItem('token'); }

async function apiFetch(url, options = {}) {
    const token = getToken();
    if (!token) {
        showFeedbackPopup('Erro de Autenticação', 'Sua sessão expirou. Faça login novamente.', 'error');
        return null;
    }
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    options.headers = { ...headers, ...options.headers };

    try {
        const response = await fetch('http://localhost:3000' + url, options);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.erro || "Ocorreu um erro na requisição.");
        }
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return { success: true };
        }
        return await response.json();
    } catch (error) {
        console.error("Erro de API:", error.message);
        showFeedbackPopup('Erro de API', error.message, 'error');
        return null;
    }
}

/**
 * Exibe um popup de feedback (sucesso ou erro).
 */
function showFeedbackPopup(title, message, type = 'success') {
    const popup = document.getElementById('feedback-popup');
    if (!popup) return;

    popup.querySelector('#feedback-title').textContent = title;
    popup.querySelector('#feedback-message').textContent = message;
    const icon = popup.querySelector('#feedback-icon');
    icon.className = `popup-icon fas ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'} ${type}`;

    popup.classList.add('is-visible');
}

/**
 * Exibe um popup de confirmação com ações de "Confirmar" e "Cancelar".
 * Garante que os listeners de clique sejam limpos e recriados a cada chamada.
 */
function showConfirmPopup(message, onConfirm) {
    const popup = document.getElementById('confirm-popup');
    if (!popup) return;

    popup.querySelector('#confirm-message').textContent = message;
    
    const btnConfirm = popup.querySelector('#btn-confirm');
    const btnCancel = popup.querySelector('.btn-cancel');

    // Clonar os botões é a maneira mais segura de remover todos os listeners antigos.
    const newBtnConfirm = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);

    const newBtnCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
    
    // Adiciona o listener para o novo botão de confirmação
    newBtnConfirm.addEventListener('click', () => {
        popup.classList.remove('is-visible');
        onConfirm(); // Executa a ação de confirmação
    });
    
    // Adiciona o listener para o novo botão de cancelar
    newBtnCancel.addEventListener('click', () => {
        popup.classList.remove('is-visible');
    });

    popup.classList.add('is-visible');
}

/**
 * Adiciona os eventos para fechar o popup de feedback.
 */
function configurarPopups() {
    // Esta função agora lida apenas com o popup de feedback geral.
    const feedbackPopup = document.getElementById('feedback-popup');
    if (feedbackPopup) {
        const btnClose = feedbackPopup.querySelector('.popup-close-button');
        if (btnClose) {
            btnClose.addEventListener('click', () => {
                feedbackPopup.classList.remove('is-visible');
            });
        }
    }
}
