// Scripts globais para todas as páginas
document.addEventListener('DOMContentLoaded', function() {
  // Funcionalidade do menu mobile
  const menuToggle = document.querySelector('.menu-toggle');
  const menuClose = document.querySelector('.menu-close');
  const mobileMenu = document.querySelector('.mobile-menu');
  const body = document.body;
  
  // Criar overlay para o menu mobile se não existir
  let menuOverlay = document.querySelector('.menu-overlay');
  if (!menuOverlay) {
    menuOverlay = document.createElement('div');
    menuOverlay.className = 'menu-overlay';
    document.body.appendChild(menuOverlay);
  }
  
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      mobileMenu.style.transform = 'translateX(0)';
      body.classList.add('menu-open');
    });
  }
  
  if (menuClose) {
    menuClose.addEventListener('click', function() {
      mobileMenu.style.transform = 'translateX(-100%)';
      body.classList.remove('menu-open');
    });
  }
  
  if (menuOverlay) {
    menuOverlay.addEventListener('click', function() {
      mobileMenu.style.transform = 'translateX(-100%)';
      body.classList.remove('menu-open');
    });
  }
  
  // Botão voltar ao topo
  const backToTopButton = document.getElementById('back-to-top');
  
  if (backToTopButton) {
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
      } else {
        backToTopButton.classList.remove('visible');
      }
    });
    
    backToTopButton.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
  
  // Funcionalidade para filtros na página de veículos
  const filterToggleBtn = document.querySelector('.filter-toggle-btn');
  const filtersSidebar = document.querySelector('.filters-sidebar');
  const filterCloseBtn = document.querySelector('.filter-close-btn');
  
  if (filterToggleBtn && filtersSidebar) {
    filterToggleBtn.addEventListener('click', function() {
      filtersSidebar.classList.add('open');
      body.classList.add('filters-open');
    });
  }
  
  if (filterCloseBtn && filtersSidebar) {
    filterCloseBtn.addEventListener('click', function() {
      filtersSidebar.classList.remove('open');
      body.classList.remove('filters-open');
    });
  }
  
  // Ajuste de altura para elementos com mesma altura
  function equalizeHeights(elements) {
    if (!elements || elements.length === 0) return;
    
    // Resetar alturas
    elements.forEach(el => {
      el.style.height = 'auto';
    });
    
    // Pular em telas muito pequenas
    if (window.innerWidth < 576) return;
    
    // Encontrar a maior altura
    let maxHeight = 0;
    elements.forEach(el => {
      const height = el.offsetHeight;
      if (height > maxHeight) {
        maxHeight = height;
      }
    });
    
    // Aplicar a mesma altura a todos os elementos
    elements.forEach(el => {
      el.style.height = maxHeight + 'px';
    });
  }
  
  // Equalizar altura dos cards de veículos
  const vehicleCards = document.querySelectorAll('.vehicle-card');
  if (vehicleCards.length > 0) {
    equalizeHeights(vehicleCards);
    window.addEventListener('resize', function() {
      equalizeHeights(vehicleCards);
    });
  }
  
  // Equalizar altura dos cards de serviços
  const serviceCards = document.querySelectorAll('.service-card');
  if (serviceCards.length > 0) {
    equalizeHeights(serviceCards);
    window.addEventListener('resize', function() {
      equalizeHeights(serviceCards);
    });
  }
  
  // Equalizar altura dos cards de informações de contato
  const contactInfoCards = document.querySelectorAll('.contact-info-card');
  if (contactInfoCards.length > 0) {
    equalizeHeights(contactInfoCards);
    window.addEventListener('resize', function() {
      equalizeHeights(contactInfoCards);
    });
  }
  
  // Adicionar classe para indicar que o JavaScript está carregado
  document.body.classList.add('js-loaded');
});