document.addEventListener('DOMContentLoaded', function() {
  // Menu Mobile
  const menuToggle = document.querySelector('.menu-toggle');
  const menuClose = document.querySelector('.menu-close');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function() {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (menuClose && mobileMenu) {
    menuClose.addEventListener('click', function() {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // Botão Voltar ao Topo
  const backToTopBtn = document.getElementById('back-to-top');

  if (backToTopBtn) {
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    });

    backToTopBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Marca a página atual no menu
  const currentPage = window.location.pathname;
  const navLinks = document.querySelectorAll('.sidebar nav a, .mobile-menu nav a');
  
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage || 
        (currentPage === '/' && link.getAttribute('href') === '/index.html')) {
      link.classList.add('active');
    }
  });

  // Animação suave para links internos
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
});