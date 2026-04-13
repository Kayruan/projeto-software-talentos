let globalProviders = [];

// Controle de Janelas
function abrirModal(id) { document.getElementById(id).classList.add('active'); }
function fecharModais() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); }
function toggleProfissao() {
  const isPrestador = document.getElementById('cad-tipo').value === 'prestador';
  document.getElementById('cad-extra').style.display = isPrestador ? 'flex' : 'none';
}

// Renderização na Tela
function updateStats(providers) {
  document.getElementById('stat-providers').textContent = providers.length;
  const cats = new Set(providers.map(p => p.categoria).filter(Boolean));
  document.getElementById('stat-categories').textContent = cats.size;
  const cities = new Set(providers.map(p => p.cidade).filter(Boolean));
  document.getElementById('stat-cities').textContent = cities.size;
}

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

    // A mágica acontece aqui: onclick="abrirPerfil('${p.email}')"
    grid.innerHTML += `
      <div class="glass p-6 rounded-2xl hover:-translate-y-1 transition-transform border border-transparent hover:border-purple-500/50 flex flex-col h-full">
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
      </div>
    `;
  });
  lucide.createIcons();
}

// NOVA FUNÇÃO: Abre os detalhes completos do profissional
function abrirPerfil(email) {
  // 1. Acha o prestador na lista usando o email
  const p = globalProviders.find(prov => prov.email === email);
  if (!p) return toast("Profissional não encontrado.");

  const content = document.getElementById('perfil-content');
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome)}&background=7c3aed&color=fff&size=150&bold=true`;
  
  // Converte os serviços em tags
  const servicos = p.servicos ? p.servicos.split(',') : ['Serviços Gerais'];
  const tagsHtml = servicos.map(s => `<span class="bg-purple-900/40 text-purple-300 px-3 py-1 text-sm rounded-full border border-purple-700/50">${esc(s.trim())}</span>`).join('');

  // MOCK DE DADOS (Vamos criar isso de verdade no banco depois)
  const notaMock = (Math.random() * (5 - 4.2) + 4.2).toFixed(1); // Nota aleatória alta
  const avaliacoesMock = Math.floor(Math.random() * 30) + 5;

  // 2. Desenha a tela do Perfil
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
      <p class="text-gray-300 leading-relaxed">${esc(p.descricao || 'Este profissional ainda não adicionou uma descrição detalhada sobre seu trabalho.')}</p>
    </div>

    <div class="mt-8">
      <h3 class="text-xl font-bold text-white mb-3">Serviços Oferecidos</h3>
      <div class="flex flex-wrap gap-2">${tagsHtml}</div>
    </div>

    <div class="mt-8 border-t border-gray-800 pt-6">
      <h3 class="text-xl font-bold text-white mb-4">Últimas Avaliações</h3>
      <div class="bg-[#0a0a12] p-4 rounded-xl border border-gray-800">
        <div class="flex justify-between items-start mb-2">
          <div>
            <span class="font-bold text-gray-200 block">Cliente Anônimo</span>
            <span class="text-xs text-gray-500">Há 2 dias</span>
          </div>
          <div class="flex text-yellow-400">
            <i data-lucide="star" class="w-4 h-4 fill-current"></i>
            <i data-lucide="star" class="w-4 h-4 fill-current"></i>
            <i data-lucide="star" class="w-4 h-4 fill-current"></i>
            <i data-lucide="star" class="w-4 h-4 fill-current"></i>
            <i data-lucide="star" class="w-4 h-4 fill-current"></i>
          </div>
        </div>
        <p class="text-gray-400 text-sm italic">"Excelente trabalho! Muito pontual e resolveu meu problema rapidamente. Recomendo a todos da região."</p>
      </div>
    </div>

    <div class="mt-8">
      <button onclick="toast('Funcionalidade de contato em breve!')" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-purple-600/20 flex justify-center items-center gap-2">
        <i data-lucide="message-circle"></i> Solicitar Orçamento
      </button>
    </div>
  `;

  abrirModal('perfilModal');
  lucide.createIcons();
}
async function loadProvidersFromAPI() {
  try {
    const res = await fetch(`${API_URL}/prestadores`);
    if (!res.ok) throw new Error("Erro na rede");
    globalProviders = await res.json();
    renderProviders(globalProviders);
    updateStats(globalProviders);
  } catch (error) {
    console.error(error);
  }
}

function checkSession() {
  const session = localStorage.getItem('conectasul_session');
  const authDiv = document.getElementById('auth-section');
  
  if (session) {
    const user = JSON.parse(session);
    authDiv.innerHTML = `
      <span class="text-sm text-gray-400">Olá, <strong class="text-white">${user.nome}</strong></span>
      <button onclick="logout()" class="text-red-400 hover:text-red-300 text-sm font-medium ml-2 border border-red-900/30 bg-red-900/10 px-3 py-1.5 rounded-lg transition-colors">Sair</button>
    `;
  } else {
    authDiv.innerHTML = `
      <button onclick="abrirModal('loginModal')" class="text-gray-300 hover:text-white font-medium px-4 py-2">Entrar</button>
      <button onclick="abrirModal('signupModal')" class="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">Criar Conta</button>
    `;
  }
}

// Inicializa quando a página carrega
window.onload = () => {
  lucide.createIcons();
  checkSession();
  loadProvidersFromAPI();
  
  document.getElementById('search-input').addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const filtrados = globalProviders.filter(p => 
      p.nome.toLowerCase().includes(termo) || 
      (p.categoria && p.categoria.toLowerCase().includes(termo))
    );
    renderProviders(filtrados);
  });
};