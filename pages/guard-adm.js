// js/auth-guard-admin.js

// Este script executa uma única tarefa: proteger a página atual.
// Ele depende que o script principal (com o objeto App) já tenha sido carregado.

// Espera o objeto App estar disponível antes de executar a proteção
document.addEventListener('DOMContentLoaded', () => {
    if (window.App && typeof window.App.auth.protectAdminRoute === 'function') {
        window.App.auth.protectAdminRoute();
    } else {
        console.error("Erro crítico: O script principal 'App' não foi encontrado. A segurança da página pode estar comprometida.");
        // Como medida de segurança extra, redireciona mesmo em caso de erro.
        window.location.href = '/index.html';
    }
});