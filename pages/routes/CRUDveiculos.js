document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const tabelaBody = document.querySelector("tbody");

  const endpoint = "http://localhost:3000/veiculos";

  // Carrega os veículos na inicialização
  async function carregarVeiculos() {
    const response = await fetch(endpoint);
    const veiculos = await response.json();
    renderizarTabela(veiculos);
  }

function renderizarTabela(veiculos) {
  tabelaBody.innerHTML = "";
  veiculos.forEach(veiculo => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${veiculo.MARCA}</td>
      <td>${veiculo.MODELO}</td>
      <td>${veiculo.ANO}</td>
      <td>R$ ${veiculo.VALOR.toLocaleString("pt-BR")}</td>
      <td class="actions">
        <a href="#" class="editar" data-id="${veiculo.ID_VEICULO}">Editar</a>
        <a href="#" class="excluir" data-id="${veiculo.ID_VEICULO}">Excluir</a>
      </td>
    `;
    tabelaBody.appendChild(row);
  });
}

  // Adiciona ou edita veículo
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const veiculo = {
      marca: document.getElementById("marca").value,
      modelo: document.getElementById("modelo").value,
      ano: parseInt(document.getElementById("ano").value),
      valor: parseFloat(document.getElementById("valor").value),
      quilometragem: document.getElementById("quilometragem").value,
      combustivel: document.getElementById("combustivel").value,
      cambio: document.getElementById("cambio").value,
      condicao: document.getElementById("condicao").value
    };

    if (form.dataset.editingId) {
      // Atualizar veículo existente
      await fetch(`${endpoint}/${form.dataset.editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(veiculo)
      });
      form.dataset.editingId = "";
    } else {
      // Adicionar novo veículo
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(veiculo)
      });
    }

    form.reset();
    carregarVeiculos();
  });

  // Delegação para Editar e Excluir
  tabelaBody.addEventListener("click", async (e) => {
    if (e.target.classList.contains("excluir")) {
      const id = e.target.dataset.id;
      await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      carregarVeiculos();
    }

    if (e.target.classList.contains("editar")) {
      const id = e.target.dataset.id;
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


      form.dataset.editingId = id;
    }
  });

  // Inicializar
  carregarVeiculos();
});
