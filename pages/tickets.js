// ==========================================================
//     SCRIPT EXCLUSIVO PARA A PÁGINA ADMIN-PROPOSTAS.HTML
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    verificarPermissaoEcarregarPropostas();
});

/**
 * Função principal: verifica a permissão do usuário e carrega os dados.
 */
async function verificarPermissaoEcarregarPropostas() {
    const container = document.getElementById('propostas-container');
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    // Verificação de segurança no frontend
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
        // A função apiFetch já terá mostrado um erro, mas podemos adicionar um fallback.
        container.innerHTML = '<div class="error-message">Ocorreu um erro ao carregar as propostas.</div>';
    }
}

/**
 * Cria o elemento HTML para um único card de proposta.
 */
function criarCardProposta(proposta) {
    const card = document.createElement('div');
    // Adiciona uma classe baseada no status para estilização com CSS
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
                <button class="btn btn-sm btn-primary">Salvar Status</button>
            </div>
        </div>
    `;

    // Adiciona o evento para o botão 'Salvar Status' dentro deste card
    const btnSalvar = card.querySelector('button');
    btnSalvar.addEventListener('click', () => {
        const selectStatus = card.querySelector('.status-select');
        atualizarStatusProposta(proposta.id, selectStatus.value, card);
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
        mostrarMensagem('Status da proposta atualizado!', 'sucesso');
        // Atualiza visualmente o card
        cardElement.querySelector('.proposta-status').textContent = novoStatus;
        cardElement.className = `proposta-card status-${novoStatus.toLowerCase().replace(' ', '-')}`;
    }
}


// --- FUNÇÕES DE APOIO (TOKEN, API, MENSAGEM) ---
// Cole aqui as mesmas funções que usamos nos outros scripts

function getToken() { return localStorage.getItem('token'); }

async function apiFetch(url, options = {}) {
    const token = getToken();
    if (!token) return null;
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    options.headers = { ...headers, ...options.headers };
    try {
        const response = await fetch('http://localhost:3000' + url, options);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.erro || "Erro na requisição.");
        }
        return response.status === 204 ? { success: true } : response.json();
    } catch (error) {
        console.error("Erro de API:", error.message);
        mostrarMensagem(error.message, "erro");
        return null;
    }
}

function mostrarMensagem(texto, tipo) {
    // ... seu código da função mostrarMensagem ...
}