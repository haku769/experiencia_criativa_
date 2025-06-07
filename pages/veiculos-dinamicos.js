// =================================================================
//     SCRIPT ÚNICO E COMPLETO PARA A PÁGINA DE VEÍCULOS
// =================================================================


// --- ESTADO GLOBAL ---
// Armazena os IDs dos veículos favoritados pelo usuário para acesso rápido.
let favoritosIds = new Set();


// --- INICIALIZAÇÃO DA PÁGINA ---

// Ponto de entrada principal do script.
document.addEventListener("DOMContentLoaded", inicializarPaginaDeVeiculos);

/**
 * Orquestra todas as ações de inicialização da página.
 */
async function inicializarPaginaDeVeiculos() {
    // Configura os event listeners para filtros, ordenação e visualização.
    configurarFiltros();
    configurarOrdenacao();
    configurarVisualizacao();

    // Carrega os favoritos do usuário para sabermos quais corações preencher.
    await carregarDadosIniciaisFavoritos();

    // Carrega e exibe todos os veículos na tela pela primeira vez.
    await carregarVeiculos();
}


// --- LÓGICA DE CARREGAMENTO E RENDERIZAÇÃO DE VEÍCULOS ---

/**
 * Busca veículos da API, enviando os filtros e ordenação, e os renderiza na tela.
 */
async function carregarVeiculos(filtros = {}, ordenacao = "relevancia") {
    try {
        const veiculosContainer = document.getElementById("vehicles-container");
        if (!veiculosContainer) return;

        veiculosContainer.innerHTML = '<div class="loading-indicator">Carregando veículos...</div>';

        // 1. Constrói a URL com os parâmetros de filtro e ordenação
        const params = new URLSearchParams();
        for (const key in filtros) {
            // Adiciona ao URL apenas filtros que têm um valor
            if (filtros[key] && filtros[key] !== "") {
                if (Array.isArray(filtros[key])) {
                    filtros[key].forEach(val => params.append(key, val));
                } else {
                    params.append(key, filtros[key]);
                }
            }
        }
        params.append('ordenacao', ordenacao);

        const url = `http://localhost:3000/veiculos?${params.toString()}`;
        console.log("Buscando na URL:", url);

        // 2. Faz a chamada à API já filtrada pelo backend
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar veículos");
        
        const veiculos = await response.json();

        // 3. Renderiza o resultado (NÃO há mais filtro no cliente)
        veiculosContainer.innerHTML = "";
        if (veiculos.length === 0) {
            veiculosContainer.innerHTML = `<div class="no-results"><h3>Nenhum veículo encontrado</h3><p>Tente ajustar os filtros.</p></div>`;
            atualizarContadorResultados(0, 0);
            return;
        }

        atualizarContadorResultados(veiculos.length, veiculos.length);
        
        // Preenche as marcas apenas na carga inicial para não resetar a seleção do usuário
        if (Object.keys(filtros).length === 0) {
            const todosVeiculosResponse = await fetch("http://localhost:3000/veiculos");
            const todosVeiculos = await todosVeiculosResponse.json();
            preencherSelectMarcas(todosVeiculos);
        }
        
        veiculos.forEach(veiculo => {
            veiculosContainer.appendChild(criarCardVeiculo(veiculo));
        });

        // 4. Ativa o sistema de favoritos nos cards recém-criados
        atualizarTodosOsIconesDeCoracao();
        vincularEventosFavoritos();

    } catch (error) {
        console.error("Erro ao carregar veículos:", error);
        veiculosContainer.innerHTML = `<div class="error-message"><h3>Erro ao carregar veículos</h3><p>${error.message}</p></div>`;
    }
}

/**
 * Cria o elemento HTML para um único card de veículo.
 */
function criarCardVeiculo(veiculo) {
    const cardDiv = document.createElement("div");
    cardDiv.className = "car-card";
    cardDiv.dataset.id = veiculo.ID_VEICULO;
    const valorFormatado = `R$ ${Number(veiculo.VALOR || 0).toLocaleString("pt-BR")}`;
    
    cardDiv.innerHTML = `
        <div class="car-image">
            <img src="${veiculo.IMAGEM || '/fotos/placeholder.jpg'}" alt=" ${veiculo.MODELO}">
            <div class="car-actions">
                <button class="car-action-btn js-botao-favorito"><i class="far fa-heart"></i></button>
                <button class="car-action-btn"><i class="fas fa-exchange-alt"></i></button>
            </div>
        </div>
        <div class="car-details">
            <h3> ${veiculo.MODELO}</h3>
            <div class="car-info">
                <span><i class="fas fa-calendar"></i> ${veiculo.ANO}</span>
                <span><i class="fas fa-tachometer-alt"></i> ${veiculo.QUILOMETRAGEM} km</span>
                <span><i class="fas fa-gas-pump"></i> ${veiculo.COMBUSTIVEL}</span>
            </div>
            <div class="car-price">
                <span class="price">${valorFormatado}</span>
                <a href="/proposta.html?id=${veiculo.ID_VEICULO}" class="btn btn-sm">Fazer proposta</a>
            </div>
        </div>`;
    return cardDiv;
}


// --- LÓGICA DE FILTROS, ORDENAÇÃO E VISUALIZAÇÃO ---

function configurarFiltros() {
    const btnAplicarFiltros = document.querySelector(".filter-buttons .btn-primary");
    const btnLimparFiltros = document.querySelector(".filter-buttons .btn-outline");
    const selectMarca = document.getElementById("filter-marca");
    const selectModelo = document.getElementById("filter-modelo");

    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener("click", () => {
            const filtros = {
                marca: document.getElementById("filter-marca")?.value,
                modelo: document.getElementById("filter-modelo")?.value,
                anoMin: document.getElementById("filter-ano-min")?.value,
                anoMax: document.getElementById("filter-ano-max")?.value,
                precoMin: document.getElementById("filter-preco-min")?.value,
                precoMax: document.getElementById("filter-preco-max")?.value,
                kmMin: document.getElementById("filter-km-min")?.value,
                kmMax: document.getElementById("filter-km-max")?.value,
                combustivel: document.getElementById("filter-combustivel")?.value,
                cambio: document.getElementById("filter-cambio")?.value,
                condicao: Array.from(document.querySelectorAll('input[name="condicao"]:checked')).map(cb => cb.value)
            };
            const ordenacao = document.getElementById("sort-by")?.value || "relevancia";
            carregarVeiculos(filtros, ordenacao);
        });
    }

    if (btnLimparFiltros) {
        btnLimparFiltros.addEventListener("click", () => {
            const form = btnLimparFiltros.closest('form');
            if (form) form.reset();
            if (selectModelo) {
                selectModelo.innerHTML = '<option value="">Todos os modelos</option>';
                selectModelo.disabled = true;
            }
            carregarVeiculos();
        });
    }

    if (selectMarca) {
        selectMarca.addEventListener("change", async function () {
            const marcaSelecionada = this.value;
            if (!selectModelo) return;
            selectModelo.innerHTML = '<option value="">Carregando...</option>';
            selectModelo.disabled = true;
            
            if (marcaSelecionada) {
                try {
                    const response = await fetch(`http://localhost:3000/veiculos?marca=${marcaSelecionada}`);
                    if (!response.ok) throw new Error("Erro ao buscar modelos");
                    const veiculosDaMarca = await response.json();
                    const modelosUnicos = [...new Set(veiculosDaMarca.map((v) => v.MODELO))];
                    
                    selectModelo.innerHTML = '<option value="">Todos os modelos</option>';
                    modelosUnicos.sort().forEach((modelo) => {
                        const option = document.createElement("option");
                        option.value = modelo;
                        option.textContent = modelo;
                        selectModelo.appendChild(option);
                    });
                    selectModelo.disabled = false;
                } catch (error) {
                    console.error("Erro ao buscar modelos:", error);
                    selectModelo.innerHTML = '<option value="">Erro ao carregar</option>';
                }
            } else {
                selectModelo.innerHTML = '<option value="">Todos os modelos</option>';
            }
        });
    }
}

function configurarOrdenacao() {
    const selectOrdenacao = document.getElementById("sort-by");
    if (selectOrdenacao) {
        selectOrdenacao.addEventListener("change", () => {
            document.querySelector(".filter-buttons .btn-primary")?.click();
        });
    }
}

function configurarVisualizacao() {
    const botoesVisualizacao = document.querySelectorAll(".view-option");
    const veiculosContainer = document.getElementById("vehicles-container");
    if (!veiculosContainer || botoesVisualizacao.length === 0) return;

    botoesVisualizacao.forEach((botao) => {
        botao.addEventListener("click", function () {
            botoesVisualizacao.forEach((b) => b.classList.remove("active"));
            this.classList.add("active");
            const tipoVisualizacao = this.dataset.view;
            if (tipoVisualizacao === "grid") {
                veiculosContainer.classList.remove("vehicles-list");
                veiculosContainer.classList.add("vehicles-grid");
            } else {
                veiculosContainer.classList.remove("vehicles-grid");
                veiculosContainer.classList.add("vehicles-list");
            }
        });
    });
}

function atualizarContadorResultados(atual, total) {
    const countCurrent = document.getElementById("count-current");
    const countTotal = document.getElementById("count-total");
    if (countCurrent) countCurrent.textContent = atual;
    if (countTotal) countTotal.textContent = total;
}

function preencherSelectMarcas(veiculos) {
    const selectMarca = document.getElementById("filter-marca");
    if (!selectMarca) return;
    const marcasUnicas = [...new Set(veiculos.map((v) => v.MARCA))];
    selectMarca.innerHTML = '<option value="">Todas as marcas</option>';
    marcasUnicas.sort().forEach((marca) => {
        const option = document.createElement("option");
        option.value = marca;
        option.textContent = marca;
        selectMarca.appendChild(option);
    });
}


// --- LÓGICA DO SISTEMA DE FAVORITOS (VIA API) ---

async function carregarDadosIniciaisFavoritos() {
    if (!getToken()) return;
    const favoritos = await apiFetch('/api/favoritos');
    if (favoritos) {
        favoritosIds = new Set(favoritos.map(f => f.id));
    }
    atualizarContadorFavoritos();
}

function vincularEventosFavoritos() {
    document.querySelectorAll('.js-botao-favorito').forEach(botao => {
        const novoBotao = botao.cloneNode(true);
        botao.parentNode.replaceChild(novoBotao, botao);
        novoBotao.addEventListener("click", (e) => {
            e.preventDefault();
            toggleFavorito(novoBotao);
        });
    });
}

async function toggleFavorito(botao) {
    if (!getToken()) return mostrarMensagem("Você precisa fazer login para favoritar.", "info");
    const card = botao.closest(".car-card");
    const idCarro = Number(card.dataset.id);
    const icone = botao.querySelector("i");
    const isFavorito = favoritosIds.has(idCarro);

    const endpoint = `/api/favoritos${isFavorito ? `/${idCarro}` : ''}`;
    const options = {
        method: isFavorito ? 'DELETE' : 'POST',
        body: isFavorito ? null : JSON.stringify({ veiculoId: idCarro }),
    };

    const resultado = await apiFetch(endpoint, options);
    if (resultado) {
        if (isFavorito) {
            favoritosIds.delete(idCarro);
            icone.classList.replace("fas", "far");
            botao.classList.remove("favorito-ativo");
        } else {
            favoritosIds.add(idCarro);
            icone.classList.replace("far", "fas");
            botao.classList.add("favorito-ativo");
        }
        atualizarContadorFavoritos();
        mostrarMensagem(isFavorito ? "Removido dos favoritos" : "Adicionado aos favoritos", isFavorito ? "info" : "sucesso");
    }
}

function atualizarTodosOsIconesDeCoracao() {
    document.querySelectorAll('.js-botao-favorito').forEach(botao => {
        const card = botao.closest('.car-card');
        if (!card || !card.dataset.id) return;
        const idCarro = Number(card.dataset.id);
        const icone = botao.querySelector('i');
        if (favoritosIds.has(idCarro)) {
            icone.classList.replace('far', 'fas');
            botao.classList.add('favorito-ativo');
        } else {
            icone.classList.replace('fas', 'far');
            botao.classList.remove('favorito-ativo');
        }
    });
}

function atualizarContadorFavoritos() {
    const contador = document.getElementById("contador-favoritos");
    if (contador) {
        contador.textContent = favoritosIds.size;
        contador.style.display = favoritosIds.size > 0 ? 'inline-block' : 'none';
    }
}


// --- HELPERS (FUNÇÕES DE APOIO) ---

function getToken() { return localStorage.getItem('token'); }

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
    }, 2500);
}

async function apiFetch(url, options = {}) {
    const token = getToken();
    if (!token && url.includes('/api/favoritos')) return null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
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
        mostrarMensagem("Ocorreu um erro. Tente novamente.", "erro");
        return null;
    }
}