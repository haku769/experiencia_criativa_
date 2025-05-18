document.addEventListener("DOMContentLoaded", () => {
  // Carregar favoritos
  carregarFavoritos()

  // Configurar botão de limpar favoritos
  const btnLimparFavoritos = document.getElementById("limpar-favoritos")
  if (btnLimparFavoritos) {
    btnLimparFavoritos.addEventListener("click", () => {
      if (confirm("Tem certeza que deseja remover todos os veículos dos favoritos?")) {
        limparTodosFavoritos()
      }
    })
  }

  // Atualizar contador
  atualizarContadorFavoritos()
})

// Função para carregar favoritos
function carregarFavoritos() {
  const favoritosContainer = document.getElementById("favoritos-container")
  const favoritosVazio = document.getElementById("favoritos-vazio")
  const favoritos = obterFavoritos()

  // Verificar se há favoritos
  if (favoritos.length === 0) {
    favoritosContainer.style.display = "none"
    favoritosVazio.style.display = "block"
    return
  }

  // Mostrar container de favoritos
  favoritosContainer.style.display = "grid"
  favoritosVazio.style.display = "none"

  // Limpar container
  favoritosContainer.innerHTML = ""

  // Adicionar cada favorito ao container
  favoritos.forEach((carro) => {
    const carCard = document.createElement("div")
    carCard.className = "car-card"
    carCard.dataset.id = carro.id

    // Formatar data de adição
    let dataFormatada = ""
    if (carro.dataAdicionado) {
      const dataAdicionado = new Date(carro.dataAdicionado)
      dataFormatada = dataAdicionado.toLocaleDateString("pt-BR")
    }

    carCard.innerHTML = `
            <div class="car-image">
                <img src="${carro.imagem}" alt="${carro.nome}" onerror="this.src='/fotos/placeholder.jpg'">
                <div class="car-actions">
                    <button class="car-action-btn favorito-ativo" onclick="removerDosFavoritos('${carro.id}')">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="car-action-btn" onclick="compararVeiculo('${carro.id}')">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                </div>
            </div>
            <div class="car-details">
                <h3>${carro.nome}</h3>
                <div class="car-info">
                    ${carro.ano ? `<span><i class="fas fa-calendar"></i> ${carro.ano}</span>` : ""}
                    ${carro.km ? `<span><i class="fas fa-tachometer-alt"></i> ${carro.km}</span>` : ""}
                </div>
                ${
                  dataFormatada
                    ? `
                <div class="car-info">
                    <span><i class="fas fa-clock"></i> Adicionado em: ${dataFormatada}</span>
                </div>`
                    : ""
                }
                <div class="car-price">
                    <span class="price">${carro.preco}</span>
                    <a href="/Carros/detalhes.html?id=${carro.id}" class="btn btn-sm">Ver Detalhes</a>
                </div>
            </div>
        `

    favoritosContainer.appendChild(carCard)
  })
}

// Função para remover um carro dos favoritos
function removerDosFavoritos(idCarro) {
  // Adicionar animação de remoção
  const card = document.querySelector(`.car-card[data-id="${idCarro}"]`)
  if (card) {
    card.classList.add("removing")

    setTimeout(() => {
      // Remover do localStorage
      removerFavorito(idCarro)

      // Mostrar mensagem
      mostrarMensagem("Veículo removido dos favoritos", "info")

      // Recarregar favoritos
      carregarFavoritos()

      // Atualizar contador
      atualizarContadorFavoritos()
    }, 300)
  } else {
    // Se não encontrar o card, remover diretamente
    removerFavorito(idCarro)
    mostrarMensagem("Veículo removido dos favoritos", "info")
    carregarFavoritos()
    atualizarContadorFavoritos()
  }
}

// Função para limpar todos os favoritos
function limparTodosFavoritos() {
  // Limpar localStorage
  localStorage.removeItem("autoelite_favoritos")

  // Mostrar mensagem
  mostrarMensagem("Todos os favoritos foram removidos", "info")

  // Recarregar favoritos
  carregarFavoritos()

  // Atualizar contador
  atualizarContadorFavoritos()
}

// Função para comparar veículo (placeholder para funcionalidade futura)
function compararVeiculo(idCarro) {
  mostrarMensagem("Funcionalidade de comparação em desenvolvimento", "info")
}

// Função para inicializar o sistema de favoritos
function inicializarFavoritos() {
  // Obter todos os botões de favorito
  const botoesCoracoes = document.querySelectorAll(".car-action-btn:has(.fa-heart)")

  // Adicionar evento de clique a cada botão
  botoesCoracoes.forEach((botao) => {
    // Obter informações do carro
    const cardCarro = botao.closest(".car-card")
    const idCarro = cardCarro.dataset.id || gerarIdUnico(cardCarro)

    // Se o carro não tem ID, adicionar um
    if (!cardCarro.dataset.id) {
      cardCarro.dataset.id = idCarro
    }

    // Verificar se o carro já está nos favoritos
    if (verificarFavorito(idCarro)) {
      botao.querySelector("i").classList.remove("far")
      botao.querySelector("i").classList.add("fas")
      botao.classList.add("favorito-ativo")
    }

    // Adicionar evento de clique
    botao.addEventListener("click", (e) => {
      e.preventDefault()
      toggleFavorito(botao, idCarro)
    })
  })
}

// Função para alternar o estado de favorito
function toggleFavorito(botao, idCarro) {
  const icone = botao.querySelector("i")
  const cardCarro = botao.closest(".car-card")

  // Obter informações do carro para salvar
  const nomeCarro = cardCarro.querySelector("h3").textContent
  const precoCarro = cardCarro.querySelector(".price").textContent
  const imgCarro = cardCarro.querySelector("img").src
  const anoCarro = cardCarro.querySelector(".car-info span:nth-child(1)").textContent.trim()
  const kmCarro = cardCarro.querySelector(".car-info span:nth-child(2)").textContent.trim()

  // Criar objeto com informações do carro
  const infoCarro = {
    id: idCarro,
    nome: nomeCarro,
    preco: precoCarro,
    imagem: imgCarro,
    ano: anoCarro,
    km: kmCarro,
    dataAdicionado: new Date().toISOString(),
  }

  // Verificar se já é favorito
  if (verificarFavorito(idCarro)) {
    // Remover dos favoritos
    removerFavorito(idCarro)

    // Atualizar ícone
    icone.classList.remove("fas")
    icone.classList.add("far")
    botao.classList.remove("favorito-ativo")

    // Mostrar mensagem
    mostrarMensagem("Veículo removido dos favoritos", "info")
  } else {
    // Adicionar aos favoritos
    adicionarFavorito(infoCarro)

    // Atualizar ícone
    icone.classList.remove("far")
    icone.classList.add("fas")
    botao.classList.add("favorito-ativo")

    // Mostrar mensagem
    mostrarMensagem("Veículo adicionado aos favoritos", "sucesso")
  }

  // Atualizar contador de favoritos no menu (se existir)
  atualizarContadorFavoritos()
}

// Função para verificar se um carro está nos favoritos
function verificarFavorito(idCarro) {
  const favoritos = obterFavoritos()
  return favoritos.some((fav) => fav.id === idCarro)
}

// Função para adicionar um carro aos favoritos
function adicionarFavorito(infoCarro) {
  const favoritos = obterFavoritos()
  favoritos.push(infoCarro)
  salvarFavoritos(favoritos)
}

// Função para remover um carro dos favoritos
function removerFavorito(idCarro) {
  let favoritos = obterFavoritos()
  favoritos = favoritos.filter((fav) => fav.id !== idCarro)
  salvarFavoritos(favoritos)
}

// Função para obter a lista de favoritos do localStorage
function obterFavoritos() {
  const favoritosJSON = localStorage.getItem("autoelite_favoritos")
  return favoritosJSON ? JSON.parse(favoritosJSON) : []
}

// Função para salvar a lista de favoritos no localStorage
function salvarFavoritos(favoritos) {
  localStorage.setItem("autoelite_favoritos", JSON.stringify(favoritos))
}

// Função para gerar um ID único para um carro
function gerarIdUnico(cardCarro) {
  const nomeCarro = cardCarro.querySelector("h3").textContent
  const timestamp = new Date().getTime()
  return `carro_${nomeCarro.replace(/\s+/g, "_").toLowerCase()}_${timestamp}`
}

// Função para atualizar o contador de favoritos no menu
function atualizarContadorFavoritos() {
  const contadorElement = document.getElementById("contador-favoritos")
  if (contadorElement) {
    const favoritos = obterFavoritos()
    contadorElement.textContent = favoritos.length

    // Mostrar ou esconder o contador
    if (favoritos.length > 0) {
      contadorElement.style.display = "inline-block"
    } else {
      contadorElement.style.display = "none"
    }
  }
}

// Função para mostrar mensagem de feedback
function mostrarMensagem(texto, tipo) {
  // Remover mensagem anterior se existir
  const mensagemExistente = document.querySelector(".mensagem-feedback")
  if (mensagemExistente) {
    mensagemExistente.remove()
  }

  // Criar elemento de mensagem
  const mensagem = document.createElement("div")
  mensagem.className = `mensagem-feedback ${tipo}`
  mensagem.textContent = texto

  // Adicionar ao corpo do documento
  document.body.appendChild(mensagem)

  // Remover após 3 segundos
  setTimeout(() => {
    mensagem.classList.add("fadeout")
    setTimeout(() => {
      mensagem.remove()
    }, 500)
  }, 2500)
}
