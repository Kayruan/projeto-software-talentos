let globalProviders = [];
let currentUser = null; // Vamos armazenar o usuário logado aqui para usar nas permissões

// ==========================================
// INICIALIZAÇÃO DA PÁGINA (Redirecionamento)
// ==========================================
window.onload = () => {
  const sessionStr = localStorage.getItem('conectasul_session');
  
  // Se não estiver logado, chuta para a tela de login
  if (!sessionStr) {
    window.location.href = 'login.html';
    return;
  }
  
  // Se passou, salva o usuário logado na variável global
  currentUser = JSON.parse(sessionStr);

  lucide.createIcons();
  checkSession();
  loadProvidersFromAPI();
  
  // Sistema de Busca
  document.getElementById('search-input').addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const filtrados = globalProviders.filter(p => 
      p.nome.toLowerCase().includes(termo) || 
      (p.categoria && p.categoria.toLowerCase().includes(termo))
    );
    renderProviders(filtrados);
  });
};

// ==========================================
// CONTROLE DE MODAIS (Apenas o de Perfil sobrou)
// ==========================================
function abrirModal(id) { document.getElementById(id).classList.add('active'); }
function fecharModais() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); }

// ==========================================
// RENDERIZAÇÃO DE ESTATÍSTICAS
// ==========================================
function updateStats(providers) {
  document.getElementById('stat-providers').textContent = providers.length;
  const cats = new Set(providers.map(p => p.categoria).filter(Boolean));
  document.getElementById('stat-categories').textContent = cats.size;
  const cities = new Set(providers.map(p => p.cidade).filter(Boolean));
  document.getElementById('stat-cities').textContent = cities.size;
}

// ==========================================
// RENDERIZAÇÃO DOS CARDS (Com botão de Admin)
// ==========================================
function renderProviders(providers) {
  const grid = document.getElementById('providers-grid');
  grid.innerHTML = '';
  
  if (providers.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">Nenhum profissional cadastrado.</div>';
    return;
  }

  providers.forEach(p => {
    const servicos = p.servicos ? p.servicos.split(',') : ['Serviços Gerais'];
    let tagsHtml = servicos.slice(0, 3).map(s => 
      `<span class="bg-purple-900/40 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-700/50">${esc(s.trim())}</span>`
    ).join('');

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome)}&background=7c3aed&color=fff&size=150&bold=true`;

    // Botão de banir aparece apenas se o usuário atual for ADMIN e não for ele mesmo
    const btnAdmin = (currentUser && currentUser.is_admin && currentUser.id !== p.id) 
      ? `<button onclick="banirUsuario('${p.id}')" class="w-full mt-2 text-red-500/70 hover:text-red-400 text-xs font-semibold py-1 border border-red-900/30 bg-red-900/10 rounded">Banir Conta (Admin)</button>` 
      : '';

    grid.innerHTML += `
      <div class="glass p-6 rounded-2xl hover:-translate-y-1 transition-transform border border-transparent hover:border-purple-500/50 flex flex-col h-full relative">
        <div class="flex items-center gap-4 mb-4">
          <img src="${avatarUrl}" class="w-16 h-16 rounded-full border-2 border-purple-500/30 object-cover shadow-lg">
          <div>
            <h3 class="font-bold text-lg text-white">${esc(p.nome)}</h3>
            <span class="text-sm text-purple-400 font-medium">${esc(p.categoria || 'Profissional')}</span>
          </div>
        </div>
        <p class="text-gray-400 text-sm mb-4 flex-grow line-clamp-2">${esc(p.descricao || 'Sem descrição.')}</p>
        <div class="flex flex-wrap gap-2 mb-6">${tagsHtml}</div>
        <div class="flex justify-between items-center border-t border-gray-800 pt-4 mt-auto">
          <span class="text-sm text-gray-400 flex items-center gap-1"><i data-lucide="map-pin" class="w-4 h-4 text-purple-500"></i> ${esc(p.cidade)}</span>
          <button onclick="abrirPerfil('${p.email}')" class="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">Ver Perfil</button>
        </div>
        ${btnAdmin}
      </div>
    `;
  });
  lucide.createIcons();
}

// ==========================================
// FUNÇÃO DE ADMINISTRAÇÃO (Banir)
// ==========================================
async function banirUsuario(usuarioId) {
  if (!confirm("Atenção ADMIN: Tem certeza que deseja banir e apagar este prestador do sistema?")) return;
  
  try {
    const res = await fetch(`${API_URL}/admin/usuarios/${usuarioId}?admin_id=${currentUser.id}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      toast("Usuário banido com sucesso.");
      loadProvidersFromAPI(); // Recarrega a lista
    } else {
      toast("Erro ao banir usuário. Você tem permissão?");
    }
  } catch (err) {
    toast("Erro de conexão com o servidor.");
  }
}

// ==========================================
// ABRIR PERFIL (Com Formulário de Agendamento)
// ==========================================
function abrirPerfil(email) {
  const p = globalProviders.find(prov => prov.email === email);
  if (!p) return toast("Profissional não encontrado.");

  const content = document.getElementById('perfil-content');
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome)}&background=7c3aed&color=fff&size=150&bold=true`;
  
  const servicos = p.servicos ? p.servicos.split(',') : ['Serviços Gerais'];
  const tagsHtml = servicos.map(s => `
    <span class="bg-purple-900/40 text-purple-300 px-3 py-1 text-sm rounded-full border border-purple-700/50">${esc(s.trim())}</span>
  `).join('');

  const foneLimpo = p.telefone ? p.telefone.replace(/\D/g, '') : '';
  const linkZap = `https://wa.me/55${foneLimpo}?text=Olá%20${esc(p.nome)},%20vi%20seu%20perfil%20no%20ConectaSul%20e%20gostaria%20de%20solicitar%20um%20orçamento!`;

  const notaMock = (Math.random() * (5 - 4.2) + 4.2).toFixed(1); 
  const avaliacoesMock = Math.floor(Math.random() * 30) + 5;

  content.innerHTML = `
    <div class="flex flex-col sm:flex-row gap-6 items-start">
      <img src="${avatarUrl}" class="w-24 h-24 rounded-full border-4 border-surface shadow-xl object-cover bg-surface">
      <div class="mt-4 sm:mt-12">
        <h2 class="text-3xl font-bold text-white">${esc(p.nome)}</h2>
        <p class="text-purple-400 font-medium text-lg">${esc(p.categoria || 'Profissional Independente')}</p>
        <div class="flex items-center gap-2 mt-2">
          <i data-lucide="star" class="w-5 h-5 text-yellow-400 fill-current"></i>
          <span class="font-bold text-white text-lg">${notaMock}</span>
          <span class="text-gray-400 text-sm">(${avaliacoesMock} avaliações)</span>
          <span class="text-gray-600 mx-2">•</span>
          <span class="text-gray-400 text-sm flex items-center gap-1"><i data-lucide="map-pin" class="w-4 h-4"></i> ${esc(p.cidade)}</span>
        </div>
      </div>
    </div>

    <div class="mt-8">
      <h3 class="text-xl font-bold text-white mb-3">Sobre o profissional</h3>
      <p class="text-gray-300 leading-relaxed">${esc(p.descricao || 'Sem descrição detalhada.')}</p>
    </div>

    <div class="mt-8">
      <h3 class="text-xl font-bold text-white mb-3">Serviços Oferecidos</h3>
      <div class="flex flex-wrap gap-2">${tagsHtml}</div>
    </div>

    <div class="mt-8 border-t border-gray-800 pt-6">
      <h3 class="text-xl font-bold text-white mb-4">Agendar Serviço (Sistema)</h3>
      <form onsubmit="fazerAgendamento(event, '${p.id}')" class="bg-[#0a0a12] p-4 rounded-xl border border-gray-800 space-y-3">
        <div>
          <label class="text-sm text-gray-400 mb-1 block">Data e Hora Preferencial</label>
          <input type="datetime-local" id="agenda-data" class="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-white" required>
        </div>
        <div>
          <label class="text-sm text-gray-400 mb-1 block">O que você precisa?</label>
          <textarea id="agenda-desc" placeholder="Ex: Instalar um chuveiro 220v..." class="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-white h-20" required></textarea>
        </div>
        <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition-colors">Confirmar Agendamento</button>
      </form>
    </div>

    <div class="mt-6 flex justify-center text-gray-500 text-sm">OU</div>

    <div class="mt-6">
      <a href="${linkZap}" target="_blank" class="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg flex justify-center items-center gap-2 no-underline">
        <i data-lucide="message-circle"></i> Falar direto no WhatsApp
      </a>
    </div>
  `;

  abrirModal('perfilModal');
  lucide.createIcons();
}

// ==========================================
// FUNÇÃO PARA SALVAR AGENDAMENTO
// ==========================================
async function fazerAgendamento(event, prestadorId) {
  event.preventDefault();
  const dataHora = document.getElementById('agenda-data').value;
  const desc = document.getElementById('agenda-desc').value;

  const agendamento = {
    prestador_id: prestadorId,
    cliente_id: currentUser.id, // Pega o ID de quem está logado
    data_hora: dataHora,
    descricao_servico: desc
  };

  try {
    const res = await fetch(`${API_URL}/agendamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agendamento)
    });

    if (res.ok) {
      toast("Agendamento solicitado com sucesso!");
      fecharModais();
    } else {
      toast("Erro ao agendar. Tente novamente.");
    }
  } catch(e) {
    toast("Erro de conexão.");
  }
}

// ==========================================
// BUSCAR DADOS NA API
// ==========================================
async function loadProvidersFromAPI() {
  try {
    const res = await fetch(`${API_URL}/prestadores`); // Verifique se sua rota é essa ou /usuarios/prestadores
    if (!res.ok) throw new Error("Erro na rede");
    globalProviders = await res.json();
    renderProviders(globalProviders);
    updateStats(globalProviders);
  } catch (error) {
    console.error(error);
  }
}

// ==========================================
// SESSÃO E LOGOUT
// ==========================================
function checkSession() {
  const authDiv = document.getElementById('auth-section');
  
  if (currentUser) {
    // Adicionamos uma tag [ADMIN] se for administrador
    const badgeAdmin = currentUser.is_admin ? '<span class="text-xs bg-red-600 text-white px-2 py-0.5 rounded ml-2">ADMIN</span>' : '';
    
    authDiv.innerHTML = `
      <span class="text-sm text-gray-400 flex items-center">
        Olá, <strong class="text-white ml-1">${currentUser.nome}</strong> ${badgeAdmin}
      </span>
      <button onclick="logout()" class="text-red-400 hover:text-red-300 text-sm font-medium ml-4 border border-red-900/30 bg-red-900/10 px-3 py-1.5 rounded-lg transition-colors">Sair</button>
    `;
  }
}

function logout() {
  localStorage.removeItem('conectasul_session');
  window.location.href = 'login.html';
}