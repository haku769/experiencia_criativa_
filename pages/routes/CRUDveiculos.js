document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const tabelaBody = document.querySelector("tbody");
  const inputImagem = document.getElementById("imagem");
  const imagemPreview = document.getElementById("imagem-preview");

  const endpoint = "http://localhost:3000/veiculos";

  // Campos numéricos que não devem aceitar valores negativos
  const camposNumericos = ["ano", "valor", "quilometragem"];
  
  // Campos de texto que não devem aceitar números
  const camposTexto = ["marca", "combustivel", "cambio", "condicao"];
  
  // Adicionar validação para campos numéricos
  camposNumericos.forEach(campo => {
    const input = document.getElementById(campo);
    
    // Validação no evento input
    input.addEventListener("input", () => {
      if (input.value < 0) {
        input.value = 0;
        mostrarMensagem(`O campo ${campo} não pode ter valor negativo`, "erro");
      }
    });
    
    // Validação no evento change (quando o usuário sai do campo)
    input.addEventListener("change", () => {
      if (input.value < 0) {
        input.value = 0;
        mostrarMensagem(`O campo ${campo} não pode ter valor negativo`, "erro");
      }
    });
  });
  
  // Adicionar validação para campos de texto (sem números)
  camposTexto.forEach(campo => {
    const input = document.getElementById(campo);
    
    // Função para verificar se contém números
    const contemNumeros = (texto) => /[0-9]/.test(texto);
    
    // Função para remover números
    const removerNumeros = (texto) => texto.replace(/[0-9]/g, '');
    
    // Validação no evento input
    input.addEventListener("input", () => {
      if (contemNumeros(input.value)) {
        const valorSemNumeros = removerNumeros(input.value);
        input.value = valorSemNumeros;
        mostrarMensagem(`O campo ${campo} não pode conter números`, "erro");
      }
    });
    
    // Validação no evento change
    input.addEventListener("change", () => {
      if (contemNumeros(input.value)) {
        const valorSemNumeros = removerNumeros(input.value);
        input.value = valorSemNumeros;
        mostrarMensagem(`O campo ${campo} não pode conter números`, "erro");
      }
    });
  });

  // Preview da imagem quando selecionada
  if (inputImagem) {
    inputImagem.addEventListener("change", function() {
      const file = this.files[0];
      
      if (file) {
        // Verificar o tamanho do arquivo (máximo 2MB)
        if (file.size > 2 * 1024 * 1024) {
          mostrarMensagem("A imagem deve ter no máximo 2MB", "erro");
          this.value = "";
          imagemPreview.src = "/placeholder.svg?height=150&width=250";
          return;
        }
        
        // Verificar o tipo do arquivo
        if (!file.type.match('image.*')) {
          mostrarMensagem("Por favor, selecione uma imagem válida", "erro");
          this.value = "";
          imagemPreview.src = "/placeholder.svg?height=150&width=250";
          return;
        }
        
        // Criar preview da imagem
        const reader = new FileReader();
        reader.onload = function(e) {
          imagemPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        // Adicionar botão para remover a imagem
        const container = inputImagem.parentElement;
        if (!container.querySelector('.remove-image-btn')) {
          const removeBtn = document.createElement('button');
          removeBtn.className = 'remove-image-btn';
          removeBtn.textContent = 'Remover imagem';
          removeBtn.type = 'button';
          removeBtn.addEventListener('click', function() {
            inputImagem.value = "";
            imagemPreview.src = "/placeholder.svg?height=150&width=250";
            this.remove();
          });
          container.appendChild(removeBtn);
        }
      }
    });
  }

  // Carrega os veículos na inicialização
  async function carregarVeiculos() {
    try {
      const response = await fetch(endpoint);
      const veiculos = await response.json();
      renderizarTabela(veiculos);
    } catch (error) {
      console.error("Erro ao carregar veículos:", error);
      mostrarMensagem("Erro ao carregar veículos", "erro");
    }
  }

  function renderizarTabela(veiculos) {
    tabelaBody.innerHTML = "";
    veiculos.forEach(veiculo => {
      const row = document.createElement("tr");
      
      // Criar uma miniatura da imagem se existir
      let imagemHTML = '';
      if (veiculo.IMAGEM) {
        // Converter o BLOB para uma URL de dados
        const imagemBase64 = veiculo.IMAGEM;
        imagemHTML = `<img src="${imagemBase64}" alt="${veiculo.MARCA} ${veiculo.MODELO}" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;">`;
      } else {
        imagemHTML = '<span class="sem-imagem">Sem imagem</span>';
      }
      
      row.innerHTML = `
        <td>${imagemHTML}</td>
        <td>${veiculo.MARCA}</td>
        <td>${veiculo.MODELO}</td>
        <td>${veiculo.ANO}</td>
        <td>R$ ${veiculo.VALOR.toLocaleString("pt-BR")}</td>
        <td class="actions">
          <button class="btn-editar" data-id="${veiculo.ID_VEICULO}">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn-excluir" data-id="${veiculo.ID_VEICULO}">
            <i class="fas fa-trash-alt"></i> Excluir
          </button>
        </td>
      `;
      tabelaBody.appendChild(row);
    });
  }

  // Função para mostrar mensagem de feedback
  function mostrarMensagem(texto, tipo) {
    // Verifica se já existe uma mensagem e remove
    const mensagemExistente = document.querySelector(".mensagem-feedback");
    if (mensagemExistente) {
      mensagemExistente.remove();
    }

    // Cria elemento de mensagem
    const mensagem = document.createElement("div");
    mensagem.className = `mensagem-feedback ${tipo}`;
    mensagem.textContent = texto;
    
    // Insere antes da tabela
    const container = document.querySelector(".crud-section .container");
    container.insertBefore(mensagem, document.querySelector("table"));
    
    // Remove após 3 segundos
    setTimeout(() => {
      mensagem.remove();
    }, 3000);
  }

  // Adiciona ou edita veículo
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validação adicional antes de enviar
    let temErro = false;
    
    // Validar campos numéricos
    camposNumericos.forEach(campo => {
      const valor = parseFloat(document.getElementById(campo).value);
      if (valor < 0) {
        mostrarMensagem(`O campo ${campo} não pode ter valor negativo`, "erro");
        temErro = true;
      }
    });
    
    // Validar campos de texto
    camposTexto.forEach(campo => {
      const valor = document.getElementById(campo).value;
      if (/[0-9]/.test(valor)) {
        mostrarMensagem(`O campo ${campo} não pode conter números`, "erro");
        temErro = true;
      }
    });

    if (temErro) return;

    // Criar objeto FormData para enviar dados multipart/form-data (para a imagem)
    const formData = new FormData();
    
    // Adicionar campos de texto ao FormData
    formData.append("marca", document.getElementById("marca").value);
    formData.append("modelo", document.getElementById("modelo").value);
    formData.append("ano", document.getElementById("ano").value);
    formData.append("valor", document.getElementById("valor").value);
    formData.append("quilometragem", document.getElementById("quilometragem").value);
    formData.append("combustivel", document.getElementById("combustivel").value);
    formData.append("cambio", document.getElementById("cambio").value);
    formData.append("condicao", document.getElementById("condicao").value);
    
    // Adicionar imagem se selecionada
    if (inputImagem.files.length > 0) {
      formData.append("imagem", inputImagem.files[0]);
    }

    try {
      let response;
      
      if (form.dataset.editingId) {
        // Atualizar veículo existente
        formData.append("id", form.dataset.editingId);
        
        response = await fetch(`${endpoint}/${form.dataset.editingId}`, {
          method: "PUT",
          body: formData
        });
        
        mostrarMensagem("Veículo atualizado com sucesso!", "sucesso");
        form.dataset.editingId = "";
        document.querySelector("button[type='submit']").textContent = "Adicionar Veículo";
      } else {
        // Adicionar novo veículo
        response = await fetch(endpoint, {
          method: "POST",
          body: formData
        });
        
        mostrarMensagem("Veículo adicionado com sucesso!", "sucesso");
      }

      if (!response.ok) {
        throw new Error("Erro ao salvar veículo");
      }

      form.reset();
      imagemPreview.src = "/placeholder.svg?height=150&width=250";
      
      // Remover botão de remover imagem se existir
      const removeBtn = document.querySelector('.remove-image-btn');
      if (removeBtn) removeBtn.remove();
      
      carregarVeiculos();
    } catch (error) {
      console.error("Erro ao salvar veículo:", error);
      mostrarMensagem("Erro ao salvar veículo", "erro");
    }
  });

  // Delegação para Editar e Excluir
  tabelaBody.addEventListener("click", async (e) => {
    // Botão Excluir
    if (e.target.classList.contains("btn-excluir") || 
        e.target.parentElement.classList.contains("btn-excluir")) {
      
      const botao = e.target.classList.contains("btn-excluir") ? 
                    e.target : e.target.parentElement;
      const id = botao.dataset.id;
      
      // Confirmação antes de excluir
      if (confirm(`Tem certeza que deseja excluir este veículo?`)) {
        try {
          const response = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
          
          if (response.ok) {
            mostrarMensagem("Veículo excluído com sucesso!", "sucesso");
            carregarVeiculos();
          } else {
            const erro = await response.json();
            throw new Error(erro.erro || "Erro ao excluir veículo");
          }
        } catch (error) {
          console.error("Erro ao excluir veículo:", error);
          mostrarMensagem("Erro ao excluir veículo", "erro");
        }
      }
    }

    // Botão Editar
    if (e.target.classList.contains("btn-editar") || 
        e.target.parentElement.classList.contains("btn-editar")) {
      
      const botao = e.target.classList.contains("btn-editar") ? 
                    e.target : e.target.parentElement;
      const id = botao.dataset.id;
      
      try {
        const response = await fetch(`${endpoint}/${id}`);
        const veiculo = await response.json();

        document.getElementById("marca").value = veiculo.MARCA;
        document.getElementById("modelo").value = veiculo.MODELO;
        document.getElementById("ano").value = veiculo.ANO;
        document.getElementById("valor").value = veiculo.VALOR;
        document.getElementById("quilometragem").value = veiculo.QUILOMETRAGEM;
        document.getElementById("combustivel").value = veiculo.COMBUSTIVEL;
        document.getElementById("cambio").value = veiculo.CAMBIO;
        document.getElementById("condicao").value = veiculo.CONDICAO;
        
        // Mostrar a imagem se existir
        if (veiculo.IMAGEM) {
          imagemPreview.src = veiculo.IMAGEM;
          
          // Adicionar botão para remover a imagem
          const container = inputImagem.parentElement;
          if (!container.querySelector('.remove-image-btn')) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-image-btn';
            removeBtn.textContent = 'Remover imagem';
            removeBtn.type = 'button';
            removeBtn.addEventListener('click', function() {
              inputImagem.value = "";
              imagemPreview.src = "/placeholder.svg?height=150&width=250";
              this.remove();
            });
            container.appendChild(removeBtn);
          }
        } else {
          imagemPreview.src = "/placeholder.svg?height=150&width=250";
          
          // Remover botão de remover imagem se existir
          const removeBtn = document.querySelector('.remove-image-btn');
          if (removeBtn) removeBtn.remove();
        }

        form.dataset.editingId = id;
        document.querySelector("button[type='submit']").textContent = "Atualizar Veículo";
        
        // Rolar para o formulário
        form.scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        console.error("Erro ao carregar veículo para edição:", error);
        mostrarMensagem("Erro ao carregar veículo para edição", "erro");
      }
    }
  });

  // Inicializar
  carregarVeiculos();
});