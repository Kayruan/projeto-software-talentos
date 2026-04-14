// URL central da nossa API
// URL central da nossa API na Nuvem
const API_URL = "https://conectasul-api.onrender.com";

// Função utilitária para mensagens na tela
function toast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// Função de segurança para evitar que quebrem o HTML
function esc(str) { 
  return String(str || '').replace(/[&<>'"]/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[match])); 
}