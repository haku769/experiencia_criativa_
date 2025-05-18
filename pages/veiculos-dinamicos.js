document.addEventListener("DOMContentLoaded", () => {
  // Carregar veículos do banco de dados
  carregarVeiculos()

  // Configurar filtros
  configurarFiltros()

  // Configurar ordenação
  configurarOrdenacao()

  // Configurar visualização (grid/lista)
  configurarVisualizacao()

  // Inicializar sistema de favoritos
  inicializarFavoritos()

  // Atualizar contador de favoritos
  atualizarContadorFavoritos()
})

// Função para carregar veículos do banco de dados
async function carregarVeiculos(filtros = {}, ordenacao = "relevancia") {
  try {
    const veiculosContainer = document.getElementById("vehicles-container")

    // Verificar se o container existe
    if (!veiculosContainer) return

    // Mostrar indicador de carregamento
    veiculosContainer.innerHTML = '<div class="loading-indicator">Carregando veículos...</div>'

    // Construir URL com filtros básicos (marca e modelo)
    let url = "http://localhost:3000/veiculos"
    const params = new URLSearchParams()

    // Adicionar filtros básicos à URL
    if (filtros.marca) params.append("marca", filtros.marca)
    if (filtros.modelo) params.append("modelo", filtros.modelo)

    // Adicionar parâmetros à URL se existirem
    if (params.toString()) {
      url += `?${params.toString()}`
    }

    // Buscar veículos da API
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error("Erro ao buscar veículos")
    }

    let veiculos = await response.json()

    // Aplicar filtros adicionais no cliente
    if (Object.keys(filtros).length > 0) {
      veiculos = veiculos.filter((veiculo) => {
        // Filtro de ano
        if (filtros.anoMin && Number.parseInt(veiculo.ANO) < Number.parseInt(filtros.anoMin)) return false
        if (filtros.anoMax && Number.parseInt(veiculo.ANO) > Number.parseInt(filtros.anoMax)) return false

        // Filtro de preço
        if (filtros.precoMin && Number.parseFloat(veiculo.VALOR) < Number.parseFloat(filtros.precoMin)) return false
        if (filtros.precoMax && Number.parseFloat(veiculo.VALOR) > Number.parseFloat(filtros.precoMax)) return false

        // Filtro de quilometragem
        if (filtros.kmMin && Number.parseFloat(veiculo.QUILOMETRAGEM) < Number.parseFloat(filtros.kmMin)) return false
        if (filtros.kmMax && Number.parseFloat(veiculo.QUILOMETRAGEM) > Number.parseFloat(filtros.kmMax)) return false

        // Filtro de combustível
        if (filtros.combustivel && veiculo.COMBUSTIVEL.toLowerCase() !== filtros.combustivel.toLowerCase()) return false

        // Filtro de câmbio
        if (filtros.cambio && veiculo.CAMBIO.toLowerCase() !== filtros.cambio.toLowerCase()) return false

        // Filtro de condição
        if (filtros.condicao && filtros.condicao.length > 0) {
          if (!filtros.condicao.some((c) => veiculo.CONDICAO.toLowerCase() === c.toLowerCase())) return false
        }

        return true
      })
    }

    // Ordenar veículos
    veiculos = ordenarVeiculos(veiculos, ordenacao)

    // Limpar container
    veiculosContainer.innerHTML = ""

    // Verificar se há veículos
    if (veiculos.length === 0) {
      veiculosContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-car-crash"></i>
                    <h3>Nenhum veículo encontrado</h3>
                    <p>Tente ajustar os filtros para encontrar o que procura.</p>
                </div>
            `

      // Atualizar contador de resultados
      atualizarContadorResultados(0, 0)
      return
    }

    // Atualizar contador de resultados
    atualizarContadorResultados(veiculos.length, veiculos.length)

    // Preencher o select de marcas com as marcas disponíveis
    preencherSelectMarcas(veiculos)

    // Renderizar cada veículo
    veiculos.forEach((veiculo) => {
      const cardVeiculo = criarCardVeiculo(veiculo)
      veiculosContainer.appendChild(cardVeiculo)
    })

    // Inicializar favoritos nos novos cards
    inicializarFavoritos()
  } catch (error) {
    console.error("Erro ao carregar veículos:", error)
    const veiculosContainer = document.getElementById("vehicles-container")
    if (veiculosContainer) {
      veiculosContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar veículos</h3>
                    <p>Ocorreu um erro ao carregar os veículos. Por favor, tente novamente mais tarde.</p>
                </div>
            `
    }
  }
}

// Função para criar um card de veículo
function criarCardVeiculo(veiculo) {
  const cardDiv = document.createElement("div")
  cardDiv.className = "car-card"
  cardDiv.dataset.id = veiculo.ID_VEICULO

  // Determinar a tag (Novo, Oferta, etc.)
  let tagHTML = ""
  if (veiculo.CONDICAO && veiculo.CONDICAO.toLowerCase() === "novo") {
    tagHTML = '<span class="tag">Novo</span>'
  }

  // Usar a imagem do banco de dados se existir, caso contrário usar uma imagem padrão
  const imagemSrc = veiculo.IMAGEM || `/fotos/placeholder.jpg`

  // Formatar valor para exibição
  const valorFormatado =
    typeof veiculo.VALOR === "number"
      ? `R$ ${veiculo.VALOR.toLocaleString("pt-BR")}`
      : `R$ ${Number.parseFloat(veiculo.VALOR).toLocaleString("pt-BR")}`

  // Criar o HTML do card
  cardDiv.innerHTML = `
        <div class="car-image">
            ${tagHTML}
            <img src="${imagemSrc}" alt="${veiculo.MARCA} ${veiculo.MODELO}" onerror="this.src='/fotos/placeholder.jpg'">
            <div class="car-actions">
                <button class="car-action-btn"><i class="far fa-heart"></i></button>
                <button class="car-action-btn"><i class="fas fa-exchange-alt"></i></button>
            </div>
        </div>
        <div class="car-details">
            <h3>${veiculo.MARCA} ${veiculo.MODELO}</h3>
            <div class="car-info">
                <span><i class="fas fa-calendar"></i> ${veiculo.ANO}</span>
                <span><i class="fas fa-tachometer-alt"></i> ${veiculo.QUILOMETRAGEM} km</span>
                <span><i class="fas fa-gas-pump"></i> ${veiculo.COMBUSTIVEL}</span>
            </div>
            <div class="car-features">
                <span><i class="fas fa-cog"></i> ${veiculo.CAMBIO}</span>
                <span><i class="fas fa-car"></i> ${veiculo.CONDICAO}</span>
                <span><i class="fas fa-tag"></i> ${valorFormatado}</span>
            </div>
            <div class="car-price">
                <span class="price">${valorFormatado}</span>
                <a href="/Carros/detalhes.html?id=${veiculo.ID_VEICULO}" class="btn btn-sm">Ver Detalhes</a>
            </div>
        </div>
    `

  return cardDiv
}

// Função para atualizar o contador de resultados
function atualizarContadorResultados(atual, total) {
  const countCurrent = document.getElementById("count-current")
  const countTotal = document.getElementById("count-total")

  if (countCurrent) countCurrent.textContent = atual
  if (countTotal) countTotal.textContent = total
}

// Função para preencher o select de marcas
function preencherSelectMarcas(veiculos) {
  const selectMarca = document.getElementById("filter-marca")

  // Verificar se o select existe
  if (!selectMarca) return

  // Obter marcas únicas
  const marcasUnicas = [...new Set(veiculos.map((v) => v.MARCA))]

  // Manter a opção "Todas as marcas"
  const opcoesAtuais = Array.from(selectMarca.options)
  const temTodasMarcas = opcoesAtuais.some((opt) => opt.value === "")

  // Limpar select mantendo apenas a opção "Todas as marcas" se existir
  if (temTodasMarcas) {
    selectMarca.innerHTML = '<option value="">Todas as marcas</option>'
  } else {
    selectMarca.innerHTML = ""
  }

  // Adicionar as marcas ao select
  marcasUnicas.sort().forEach((marca) => {
    const option = document.createElement("option")
    option.value = marca
    option.textContent = marca
    selectMarca.appendChild(option)
  })
}

// Função para configurar os filtros
function configurarFiltros() {
  const selectMarca = document.getElementById("filter-marca")
  const selectModelo = document.getElementById("filter-modelo")
  const selectAnoMin = document.getElementById("filter-ano-min")
  const selectAnoMax = document.getElementById("filter-ano-max")
  const selectPrecoMin = document.getElementById("filter-preco-min")
  const selectPrecoMax = document.getElementById("filter-preco-max")
  const selectKmMin = document.getElementById("filter-km-min")
  const selectKmMax = document.getElementById("filter-km-max")
  const selectCombustivel = document.getElementById("filter-combustivel")
  const selectCambio = document.getElementById("filter-cambio")
  const checkboxesCondicao = document.querySelectorAll('input[name="condicao"]')

  const btnAplicarFiltros = document.querySelector(".filter-buttons .btn-primary")
  const btnLimparFiltros = document.querySelector(".filter-buttons .btn-outline")
  const btnFilterToggle = document.querySelector(".btn-filter-toggle")

  // Toggle para mostrar/esconder filtros em dispositivos móveis
  if (btnFilterToggle) {
    btnFilterToggle.addEventListener("click", () => {
      const filtersBody = document.querySelector(".filters-body")
      if (filtersBody) {
        filtersBody.classList.toggle("active")
      }
    })
  }

  // Evento para quando a marca é alterada
  if (selectMarca) {
    selectMarca.addEventListener("change", async function () {
      const marcaSelecionada = this.value

      // Se uma marca for selecionada, buscar modelos dessa marca
      if (marcaSelecionada) {
        try {
          const response = await fetch(`http://localhost:3000/veiculos?marca=${marcaSelecionada}`)
          if (!response.ok) throw new Error("Erro ao buscar modelos")

          const veiculos = await response.json()
          const modelosUnicos = [...new Set(veiculos.map((v) => v.MODELO))]

          // Atualizar select de modelos
          if (selectModelo) {
            selectModelo.innerHTML = '<option value="">Todos os modelos</option>'
            modelosUnicos.sort().forEach((modelo) => {
              const option = document.createElement("option")
              option.value = modelo
              option.textContent = modelo
              selectModelo.appendChild(option)
            })

            // Habilitar select de modelos
            selectModelo.disabled = false
          }
        } catch (error) {
          console.error("Erro ao buscar modelos:", error)
        }
      } else {
        // Se nenhuma marca for selecionada, limpar e desabilitar select de modelos
        if (selectModelo) {
          selectModelo.innerHTML = '<option value="">Todos os modelos</option>'
          selectModelo.disabled = true
        }
      }
    })
  }

  // Evento para aplicar filtros
  if (btnAplicarFiltros) {
    btnAplicarFiltros.addEventListener("click", () => {
      // Obter valores de todos os filtros
      const filtros = {
        marca: selectMarca ? selectMarca.value : "",
        modelo: selectModelo ? selectModelo.value : "",
        anoMin: selectAnoMin ? selectAnoMin.value : "",
        anoMax: selectAnoMax ? selectAnoMax.value : "",
        precoMin: selectPrecoMin ? selectPrecoMin.value : "",
        precoMax: selectPrecoMax ? selectPrecoMax.value : "",
        kmMin: selectKmMin ? selectKmMin.value : "",
        kmMax: selectKmMax ? selectKmMax.value : "",
        combustivel: selectCombustivel ? selectCombustivel.value : "",
        cambio: selectCambio ? selectCambio.value : "",
        condicao: [],
      }

      // Obter condições selecionadas
      checkboxesCondicao.forEach((checkbox) => {
        if (checkbox.checked) {
          filtros.condicao.push(checkbox.value)
        }
      })

      // Obter ordenação atual
      const ordenacao = document.getElementById("sort-by")?.value || "relevancia"

      // Aplicar filtros
      carregarVeiculos(filtros, ordenacao)
    })
  }

  // Evento para limpar filtros
  if (btnLimparFiltros) {
    btnLimparFiltros.addEventListener("click", () => {
      // Limpar todos os selects
      if (selectMarca) selectMarca.value = ""
      if (selectModelo) {
        selectModelo.value = ""
        selectModelo.disabled = true
      }
      if (selectAnoMin) selectAnoMin.value = ""
      if (selectAnoMax) selectAnoMax.value = ""
      if (selectPrecoMin) selectPrecoMin.value = ""
      if (selectPrecoMax) selectPrecoMax.value = ""
      if (selectKmMin) selectKmMin.value = ""
      if (selectKmMax) selectKmMax.value = ""
      if (selectCombustivel) selectCombustivel.value = ""
      if (selectCambio) selectCambio.value = ""

      // Desmarcar checkboxes
      checkboxesCondicao.forEach((checkbox) => {
        checkbox.checked = false
      })

      // Obter ordenação atual
      const ordenacao = document.getElementById("sort-by")?.value || "relevancia"

      // Carregar veículos sem filtros
      carregarVeiculos({}, ordenacao)
    })
  }
}

// Função para configurar ordenação
function configurarOrdenacao() {
  const selectOrdenacao = document.getElementById("sort-by")

  if (selectOrdenacao) {
    selectOrdenacao.addEventListener("change", function () {
      // Obter filtros atuais
      const selectMarca = document.getElementById("filter-marca")
      const selectModelo = document.getElementById("filter-modelo")

      const filtros = {
        marca: selectMarca ? selectMarca.value : "",
        modelo: selectModelo ? selectModelo.value : "",
      }

      carregarVeiculos(filtros, this.value)
    })
  }
}

// Função para ordenar veículos
function ordenarVeiculos(veiculos, ordenacao) {
  switch (ordenacao) {
    case "preco-asc":
      return veiculos.sort((a, b) => Number.parseFloat(a.VALOR) - Number.parseFloat(b.VALOR))
    case "preco-desc":
      return veiculos.sort((a, b) => Number.parseFloat(b.VALOR) - Number.parseFloat(a.VALOR))
    case "ano-asc":
      return veiculos.sort((a, b) => Number.parseInt(a.ANO) - Number.parseInt(b.ANO))
    case "ano-desc":
      return veiculos.sort((a, b) => Number.parseInt(b.ANO) - Number.parseInt(a.ANO))
    case "km-asc":
      return veiculos.sort((a, b) => Number.parseFloat(a.QUILOMETRAGEM) - Number.parseFloat(b.QUILOMETRAGEM))
    case "km-desc":
      return veiculos.sort((a, b) => Number.parseFloat(b.QUILOMETRAGEM) - Number.parseFloat(a.QUILOMETRAGEM))
    default:
      return veiculos // Relevância (ordem padrão)
  }
}

// Função para configurar visualização (grid/lista)
function configurarVisualizacao() {
  const botoesVisualizacao = document.querySelectorAll(".view-option")
  const veiculosContainer = document.getElementById("vehicles-container")

  if (!veiculosContainer) return

  botoesVisualizacao.forEach((botao) => {
    botao.addEventListener("click", function () {
      // Remover classe ativa de todos os botões
      botoesVisualizacao.forEach((b) => b.classList.remove("active"))

      // Adicionar classe ativa ao botão clicado
      this.classList.add("active")

      // Alterar visualização
      const tipoVisualizacao = this.dataset.view

      if (tipoVisualizacao === "grid") {
        veiculosContainer.classList.remove("vehicles-list")
        veiculosContainer.classList.add("vehicles-grid")
      } else {
        veiculosContainer.classList.remove("vehicles-grid")
        veiculosContainer.classList.add("vehicles-list")
      }
    })
  })
}

// Sistema de favoritos
function inicializarFavoritos() {
  // Obter todos os botões de favorito
  const botoesCoracoes = document.querySelectorAll(".car-action-btn:has(.fa-heart)")

  // Adicionar evento de clique a cada botão
  botoesCoracoes.forEach((botao) => {
    // Remover eventos anteriores para evitar duplicação
    botao.removeEventListener("click", handleFavoritoClick)

    // Obter informações do carro
    const cardCarro = botao.closest(".car-card")
    const idCarro = cardCarro.dataset.id

    // Verificar se o carro já está nos favoritos
    if (verificarFavorito(idCarro)) {
      botao.querySelector("i").classList.remove("far")
      botao.querySelector("i").classList.add("fas")
      botao.classList.add("favorito-ativo")
    } else {
      botao.querySelector("i").classList.remove("fas")
      botao.querySelector("i").classList.add("far")
      botao.classList.remove("favorito-ativo")
    }

    // Adicionar evento de clique
    botao.addEventListener("click", handleFavoritoClick)
  })

  // Atualizar contador de favoritos
  atualizarContadorFavoritos()
}

// Função para lidar com o clique no botão de favorito
function handleFavoritoClick(e) {
  e.preventDefault()
  e.stopPropagation()

  const cardCarro = this.closest(".car-card")
  const idCarro = cardCarro.dataset.id

  toggleFavorito(this, idCarro)
}

// Função para alternar o estado de favorito
function toggleFavorito(botao, idCarro) {
  const icone = botao.querySelector("i")
  const cardCarro = botao.closest(".car-card")

  // Obter informações do carro para salvar
  const nomeCarro = cardCarro.querySelector("h3").textContent
  const precoCarro = cardCarro.querySelector(".price").textContent
  const imgCarro = cardCarro.querySelector("img").src

  // Obter informações adicionais se disponíveis
  let anoCarro = ""
  let kmCarro = ""

  const infoSpans = cardCarro.querySelectorAll(".car-info span")
  if (infoSpans.length > 0) {
    anoCarro = infoSpans[0].textContent.trim()
    if (infoSpans.length > 1) {
      kmCarro = infoSpans[1].textContent.trim()
    }
  }

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
