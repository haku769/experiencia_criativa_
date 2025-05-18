document.addEventListener('DOMContentLoaded', function() {
  // Toggle Filtros em dispositivos móveis
  const btnFilterToggle = document.querySelector('.btn-filter-toggle');
  const filtersBody = document.querySelector('.filters-body');

  if (btnFilterToggle && filtersBody) {
    btnFilterToggle.addEventListener('click', function() {
      filtersBody.classList.toggle('active');
      
      // Altera o texto do botão
      const icon = btnFilterToggle.querySelector('i');
      if (filtersBody.classList.contains('active')) {
        btnFilterToggle.innerHTML = '<i class="fas fa-times"></i> Fechar';
      } else {
        btnFilterToggle.innerHTML = '<i class="fas fa-sliders-h"></i> Filtros';
      }
    });
  }

  // Alternar entre visualizações de grade e lista
  const viewOptions = document.querySelectorAll('.view-option');
  const vehiclesGrid = document.querySelector('.vehicles-grid');

  if (viewOptions.length > 0 && vehiclesGrid) {
    viewOptions.forEach(option => {
      option.addEventListener('click', function() {
        // Remove a classe active de todas as opções
        viewOptions.forEach(opt => opt.classList.remove('active'));
        // Adiciona a classe active à opção clicada
        this.classList.add('active');
        
        // Altera a visualização com base no atributo data-view
        const viewType = this.getAttribute('data-view');
        if (viewType === 'grid') {
          vehiclesGrid.classList.remove('list-view');
          vehiclesGrid.classList.add('grid-view');
        } else if (viewType === 'list') {
          vehiclesGrid.classList.remove('grid-view');
          vehiclesGrid.classList.add('list-view');
        }
      });
    });
  }

  // Botões de Aplicar e Limpar Filtros
  const btnApplyFilters = document.querySelector('.filter-buttons .btn-primary');
  const btnClearFilters = document.querySelector('.filter-buttons .btn-outline');

  if (btnApplyFilters) {
    btnApplyFilters.addEventListener('click', function() {
      // Aqui você implementaria a lógica para aplicar os filtros
      console.log('Aplicando filtros...');
      
      // Exemplo de coleta de valores dos filtros
      const marca = document.getElementById('filter-marca').value;
      const modelo = document.getElementById('filter-modelo').value;
      const anoMin = document.getElementById('filter-ano-min').value;
      const anoMax = document.getElementById('filter-ano-max').value;
      
      console.log({
        marca,
        modelo,
        anoMin,
        anoMax
        // Adicione outros filtros conforme necessário
      });
      
      // Simulação de atualização da página após aplicar filtros
      showNotification('success', 'Filtros aplicados com sucesso!');
    });
  }

  if (btnClearFilters) {
    btnClearFilters.addEventListener('click', function() {
      // Limpa todos os campos de filtro
      const filterSelects = document.querySelectorAll('.filter-group select');
      filterSelects.forEach(select => {
        select.selectedIndex = 0;
      });
      
      // Desmarca todas as checkboxes
      const filterCheckboxes = document.querySelectorAll('.checkbox-label input[type="checkbox"]');
      filterCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
      
      showNotification('info', 'Filtros limpos!');
    });
  }

  // Funcionalidade de favoritar e comparar
  const carActionBtns = document.querySelectorAll('.car-action-btn');

  if (carActionBtns.length > 0) {
    carActionBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const icon = this.querySelector('i');
        
        // Verifica se é o botão de favorito
        if (icon.classList.contains('fa-heart')) {
          icon.classList.toggle('far');
          icon.classList.toggle('fas');
          
          if (icon.classList.contains('fas')) {
            // Adicionado aos favoritos
            showNotification('success', 'Veículo adicionado aos favoritos!');
          } else {
            // Removido dos favoritos
            showNotification('info', 'Veículo removido dos favoritos!');
          }
        }
        
        // Verifica se é o botão de comparar
        if (icon.classList.contains('fa-exchange-alt')) {
          // Adiciona à lista de comparação
          showNotification('success', 'Veículo adicionado à comparação!');
        }
      });
    });
  }

  // Função para mostrar notificações
  function showNotification(type, message) {
    // Verifica se já existe uma notificação
    const notification = document.querySelector('.notification');
    const notificationIcon = notification.querySelector('.notification-icon');
    const notificationMessage = notification.querySelector('.notification-message');
    
    // Define o ícone com base no tipo
    if (type === 'success') {
      notificationIcon.className = 'notification-icon fas fa-check-circle';
      notification.className = 'notification notification-success show';
    } else if (type === 'error') {
      notificationIcon.className = 'notification-icon fas fa-exclamation-circle';
      notification.className = 'notification notification-error show';
    } else if (type === 'info') {
      notificationIcon.className = 'notification-icon fas fa-info-circle';
      notification.className = 'notification notification-info show';
    }
    
    // Define a mensagem
    notificationMessage.textContent = message;
    
    // Mostra a notificação
    notification.classList.add('show');
    
    // Remove a notificação após 3 segundos
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  // Paginação
  const pageLinks = document.querySelectorAll('.pagination .page-link');

  if (pageLinks.length > 0) {
    pageLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove a classe active de todos os links
        pageLinks.forEach(pl => pl.classList.remove('active'));
        
        // Adiciona a classe active ao link clicado
        if (!this.classList.contains('next')) {
          this.classList.add('active');
        }
        
        // Aqui você implementaria a lógica para carregar a página correspondente
        console.log('Navegando para a página:', this.textContent.trim());
        
        // Rola a página para o topo
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    });
  }

  // Ordenação de veículos
  const sortBy = document.getElementById('sort-by');

  if (sortBy) {
    sortBy.addEventListener('change', function() {
      const selectedOption = this.value;
      console.log('Ordenando por:', selectedOption);
      
      // Aqui você implementaria a lógica para ordenar os veículos
      // Por exemplo, fazer uma requisição AJAX ou reordenar os elementos no DOM
      
      // Simulação de atualização da página após ordenar
      showNotification('success', 'Veículos reordenados!');
    });
  }
});