// 
// ==========================================================
//     SCRIPT EXCLUSIVO PARA A PÁGINA FAVORITOS.HTML
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
    carregarMeusFavoritos();
    configurarLimparFavoritos();
});

async function carregarMeusFavoritos() {
    const container = document.getElementById("favoritos-container");
    const vazio = document.getElementById("favoritos-vazio");
    if (!container || !vazio) return;

    container.innerHTML = '<div class="loading-indicator">Carregando...</div>';

    const token = localStorage.getItem('token');
    if (!token) {
        container.innerHTML = '<div class="error-message">Você precisa estar logado para ver seus favoritos.</div>';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/favoritos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Não foi possível buscar seus favoritos.");
        const favoritos = await response.json();
        
        atualizarContadorHeader(favoritos.length);

        if (favoritos.length === 0) {
            container.style.display = 'none';
            vazio.style.display = 'block';
        } else {
            container.style.display = 'grid';
            vazio.style.display = 'none';
            container.innerHTML = '';
            favoritos.forEach(carro => {
                container.appendChild(criarCardFavorito(carro));
            });
        }
    } catch (error) {
        container.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

function criarCardFavorito(carro) {
    const cardDiv = document.createElement("div");
    cardDiv.className = "car-card";
    cardDiv.dataset.id = carro.id;

    // --- Verificações para os novos campos ---
    const marca = carro.marca || "";
    const modelo = carro.modelo || "Veículo";
    const imagem = carro.imagem || '/fotos/placeholder.jpg';
    const ano = carro.ano || 'N/A';
    const km = carro.km || 'N/A';
    const combustivel = carro.combustivel || 'N/A';
    const cambio = carro.cambio || 'N/A';
    const condicao = carro.condicao || '';
    const preco = carro.preco ? `R$ ${Number(carro.preco).toLocaleString('pt-BR')}` : 'Sob consulta';

    cardDiv.innerHTML = `
        <div class="car-image">
            <img src="${imagem}" alt=" ${modelo}">
            <div class="car-actions">
                <button class="car-action-btn favorito-ativo" onclick="removerFavorito(this)">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
        <div class="car-details">
            <h3> ${modelo}</h3>

            <div class="car-info">
                <span><i class="fas fa-calendar"></i> ${ano}</span>
                <span><i class="fas fa-tachometer-alt"></i> ${km} km</span>
            </div>

            <div class="car-features">
                <span><i class="fas fa-gas-pump"></i> ${combustivel}</span>
                <span><i class="fas fa-cog"></i> ${cambio}</span>
                ${condicao ? `<span><i class="fas fa-car"></i> ${condicao}</span>` : ''}
            </div>

            <div class="car-price">
                <span class="price">${preco}</span>
                <a href="/Carros/detalhes.html?id=${carro.id}" class="btn btn-sm">Ver Detalhes</a>
            </div>
        </div>`;
    return cardDiv;
}

async function removerFavorito(botao) {
    const card = botao.closest('.car-card');
    const idCarro = card.dataset.id;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`http://localhost:3000/api/favoritos/${idCarro}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Falha ao remover.");

        card.style.transition = 'opacity 0.3s';
        card.style.opacity = '0';
        setTimeout(() => {
            card.remove();
            const total = document.querySelectorAll('.car-card').length;
            atualizarContadorHeader(total);
            if (total === 0) {
                document.getElementById("favoritos-container").style.display = 'none';
                document.getElementById("favoritos-vazio").style.display = 'block';
            }
        }, 300);
    } catch (error) {
        alert("Erro ao remover favorito.");
    }
}

function atualizarContadorHeader(total) {
    const contador = document.getElementById("contador-favoritos");
    if(contador){
        contador.textContent = total;
        contador.style.display = total > 0 ? 'inline-block' : 'none';
    }
}

function configurarLimparFavoritos() {
    // Lógica para o popup de confirmação do botão "Limpar Todos"
    const btnLimpar = document.getElementById("limpar-favoritos");
    const popup = document.getElementById("popup-confirmacao");
    if(!btnLimpar || !popup) return;

    const btnConfirmar = document.getElementById("confirmar-limpar");
    const btnCancelar = document.getElementById("cancelar-limpar");

    btnLimpar.addEventListener("click", () => popup.classList.remove("hidden"));
    btnCancelar.addEventListener("click", () => popup.classList.add("hidden"));
    btnConfirmar.addEventListener("click", async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3000/api/favoritos`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Falha ao limpar favoritos.");
            popup.classList.add("hidden");
            carregarMeusFavoritos(); // Recarrega a página para mostrar que está vazia
        } catch (error) {
            alert("Erro ao limpar favoritos.");
        }
    });
}