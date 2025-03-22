document.addEventListener("DOMContentLoaded", () => {
  const veiculos = [
    { marca: "audi", modelo: "A3", ano: 2023, preco: 200000 },
    { marca: "audi", modelo: "Q5", ano: 2022, preco: 300000 },
    { marca: "bmw", modelo: "X1", ano: 2021, preco: 250000 },
    { marca: "bmw", modelo: "M3", ano: 2023, preco: 500000 },
    { marca: "mercedes", modelo: "C200", ano: 2020, preco: 280000 },
    { marca: "toyota", modelo: "Corolla", ano: 2022, preco: 150000 },

  ];

  const marcaSelect = document.getElementById("marca");
  const modeloSelect = document.getElementById("modelo");
  const anoSelect = document.getElementById("ano");
  const precoSelect = document.getElementById("preco");
  const btnBuscar = document.getElementById("btnBuscar");


  const resultadoDiv = document.createElement("div");
  resultadoDiv.id = "resultado";
  resultadoDiv.style.marginTop = "20px";
  resultadoDiv.style.padding = "10px";
  resultadoDiv.style.border = "1px solid #ccc";
  resultadoDiv.style.backgroundColor = "#f9f9f9";
  document.body.appendChild(resultadoDiv);

  // Atualiza os modelos ao selecionar uma marca
  marcaSelect.addEventListener("change", () => {
    const marcaSelecionada = marcaSelect.value;
    modeloSelect.innerHTML = '<option value="">Todos os modelos</option>';

    if (marcaSelecionada) {
      const modelosFiltrados = [...new Set(veiculos
        .filter(veiculo => veiculo.marca === marcaSelecionada)
        .map(veiculo => veiculo.modelo))];

      modelosFiltrados.forEach(modelo => {
        const option = document.createElement("option");
        option.value = modelo;
        option.textContent = modelo;
        modeloSelect.appendChild(option);
      });
    }
  });

  // Função para buscar veículos
  btnBuscar.addEventListener("click", (e) => {
    e.preventDefault();
    console.log('o botao foi clicado') // Evita recarregar a página caso esteja dentro de um <form>

    const marcaSelecionada = marcaSelect.value;
    const modeloSelecionado = modeloSelect.value;
    const anoSelecionado = anoSelect.value;
    const precoSelecionado = precoSelect.value;

    let resultados = veiculos.filter(veiculo => {
      return (
        (marcaSelecionada === "" || veiculo.marca === marcaSelecionada) &&
        (modeloSelecionado === "" || veiculo.modelo === modeloSelecionado) &&
        (anoSelecionado === "" || veiculo.ano == anoSelecionado) &&
        (precoSelecionado === "" || veiculo.preco <= parseInt(precoSelecionado))
      );
    });

    resultadoDiv.innerHTML = "<h3>Resultados:</h3>";
    if (resultados.length > 0) {
      resultados.forEach(veiculo => {
        resultadoDiv.innerHTML += `<p>${veiculo.marca.toUpperCase()} - ${veiculo.modelo} - ${veiculo.ano} - R$ ${veiculo.preco.toLocaleString()}</p>`;
      });
    } else {
      resultadoDiv.innerHTML += "<p>Nenhum veículo encontrado.</p>";
    }
  });
});
