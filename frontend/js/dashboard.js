let globalProviders = [];
let currentUser = null; 

// ==========================================
// INICIALIZAÇÃO DA PÁGINA
// ==========================================
window.onload = () => {
  const sessionStr = localStorage.getItem('conectasul_session');
  
  // Se não estiver logado, chuta para a tela inicial (Login)
  if (!sessionStr) {
    window.location.replace('index.html');
    return;
  }
  
  currentUser = JSON.parse(sessionStr);

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

function esc(str) {
  if (!str) return '';
  return str.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.remove('opacity-0', 'translate-y-20');
  setTimeout(() => t.classList.add('opacity-0', 'translate-y-20'), 3000);
}

function abrirModal(id) { document.getElementById(id).classList.remove('hidden'); document.getElementById(id).classList.add('flex'); }
function fecharModais() { document.querySelectorAll('.modal').forEach(m => { m.classList.add('hidden'); m.classList.remove('flex'); }); }

// ==========================================
// RENDERIZAÇÃO DE ESTATÍSTICAS E CARDS
// ==========================================
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
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">Nenhum profissional encontrado.</div>';
    return;
  }

  providers.forEach(p => {
    const servicos = p.servicos ? p.servicos.split(',') : ['Serviços Gerais'];
    let tagsHtml = servicos.slice(0, 3).map(s => 
      `<span class="bg-purple-900/40 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-700/50">${esc(s.trim())}</span>`
    ).join('');

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome)}&background=7c3aed&color=fff&size=150&bold=true`;
    
    // Puxa a nota real do banco de dados (se for nulo, mostra 0.0)
    const notaReal = parseFloat(p.media_nota || 0).toFixed(1);

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
            <div class="flex items-center gap-1 mt-1 text-yellow-400 text-xs">
               <i data-lucide="star" class="w-3 h-3 fill-current"></i> <span class="text-white">${notaReal}</span>
            </div>
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

async function banirUsuario(usuarioId) {
  if (!confirm("Atenção ADMIN: Tem certeza que deseja banir e apagar este prestador do sistema?")) return;
  try {
    const res = await fetch(`${API_URL}/admin/usuarios/${usuarioId}?admin_id=${currentUser.id}`, { method: 'DELETE' });
    if (res.ok) { toast("Usuário banido com sucesso."); loadProvidersFromAPI(); } 
    else { toast("Erro ao banir usuário."); }
  } catch (err) { toast("Erro de conexão com o servidor."); }
}

// ==========================================
// ABRIR PERFIL & AVALIAÇÃO
// ==========================================
function abrirPerfil(email) {
  const p = globalProviders.find(prov => prov.email === email);
  if (!p) return toast("Profissional não encontrado.");

  const content = document.getElementById('perfil-content');
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome)}&background=7c3aed&color=fff&size=150&bold=true`;
  
  const servicos = p.servicos ? p.servicos.split(',') : ['Serviços Gerais'];
  const tagsHtml = servicos.map(s => `<span class="bg-purple-900/40 text-purple-300 px-3 py-1 text-sm rounded-full border border-purple-700/50">${esc(s.trim())}</span>`).join('');

  // Pega os dados reais
  const notaReal = parseFloat(p.media_nota || 0).toFixed(1);
  const totalAv = p.total_avaliacoes || 0;

  // Renderiza a parte superior (Foto e Info)
  let html = `
    <div class="flex flex-col sm:flex-row gap-6 items-start">
      <img src="${avatarUrl}" class="w-24 h-24 rounded-full border-4 border-surface shadow-xl object-cover bg-[#14142a]">
      <div class="mt-4 sm:mt-12">
        <h2 class="text-3xl font-bold text-white">${esc(p.nome)}</h2>
        <p class="text-purple-400 font-medium text-lg">${esc(p.categoria || 'Profissional Independente')}</p>
        <div class="flex items-center gap-2 mt-2">
          <i data-lucide="star" class="w-5 h-5 text-yellow-400 fill-current"></i>
          <span class="font-bold text-white text-lg">${notaReal}</span>
          <span class="text-gray-400 text-sm">(${totalAv} avaliações)</span>
          <span class="text-gray-600 mx-2">•</span>
          <span class="text-gray-400 text-sm flex items-center gap-1"><i data-lucide="map-pin" class="w-4 h-4"></i> ${esc(p.cidade)}</span>
        </div>
      </div>
    </div>

    <div class="mt-8">
      <h3 class="text-xl font-bold text-white mb-3">Sobre</h3>
      <p class="text-gray-300 leading-relaxed">${esc(p.descricao || 'Sem descrição detalhada.')}</p>
    </div>

    <div class="mt-8">
      <h3 class="text-xl font-bold text-white mb-3">Serviços Oferecidos</h3>
      <div class="flex flex-wrap gap-2">${tagsHtml}</div>
    </div>
  `;

  // Define o que aparece embaixo: Botão de Editar (se for o próprio usuário) ou Agendamento/Avaliação
  if (p.id === currentUser.id) {
      html += `
        <div class="mt-8 border-t border-gray-800 pt-6">
          <button onclick="carregarFormEdicao()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors">✏️ Editar Meu Perfil</button>
        </div>
      `;
  } else {
      const foneLimpo = p.telefone ? p.telefone.replace(/\D/g, '') : '';
      const linkZap = `https://wa.me/55${foneLimpo}?text=Olá%20${esc(p.nome)},%20vi%20seu%20perfil%20no%20ConectaSul%20e%20gostaria%20de%20solicitar%20um%20orçamento!`;
      
      let estrelasHtml = [1,2,3,4,5].map(n => 
        `<i data-lucide="star" onclick="avaliarProfissional('${p.id}', ${n})" class="w-8 h-8 text-gray-600 cursor-pointer hover:text-yellow-400 hover:fill-current transition-all"></i>`
      ).join('');

      html += `
        <div class="mt-8 border-t border-gray-800 pt-6">
          <h3 class="text-xl font-bold text-white mb-4">Avaliar Profissional</h3>
          <div class="flex gap-2 justify-center bg-[#0a0a12] p-4 rounded-xl border border-gray-800">
             ${estrelasHtml}
          </div>
        </div>

        <div class="mt-8 border-t border-gray-800 pt-6">
          <h3 class="text-xl font-bold text-white mb-4">Agendar Serviço</h3>
          <form onsubmit="fazerAgendamento(event, '${p.id}')" class="bg-[#0a0a12] p-4 rounded-xl border border-gray-800 space-y-3">
            <input type="datetime-local" id="agenda-data" class="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-white" required>
            <textarea id="agenda-desc" placeholder="O que você precisa?" class="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-white h-20" required></textarea>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold">Confirmar</button>
          </form>
        </div>

        <div class="mt-6">
          <a href="${linkZap}" target="_blank" class="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2">
            <i data-lucide="message-circle"></i> WhatsApp
          </a>
        </div>
      `;
  }

  content.innerHTML = html;
  abrirModal('perfilModal');
  lucide.createIcons();
}

// ==========================================
// FUNÇÕES DE EDIÇÃO DE PERFIL
// ==========================================
function carregarFormEdicao() {
    const content = document.getElementById('perfil-content');
    content.innerHTML = `
        <h3 class="text-2xl font-bold text-white mb-4 mt-8">Editar Perfil</h3>
        <form onsubmit="salvarPerfil(event)" class="space-y-4">
            <div>
                <label class="text-sm text-gray-400">Sua Profissão / Categoria</label>
                <input type="text" id="edit-cat" value="${esc(currentUser.categoria || '')}" class="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white">
            </div>
            <div>
                <label class="text-sm text-gray-400">Cidade</label>
                <input type="text" id="edit-cid" value="${esc(currentUser.cidade || '')}" class="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white">
            </div>
            <div>
                <label class="text-sm text-gray-400">Serviços Oferecidos (separados por vírgula)</label>
                <input type="text" id="edit-serv" value="${esc(currentUser.servicos || '')}" class="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white">
            </div>
            <div>
                <label class="text-sm text-gray-400">Sobre Você</label>
                <textarea id="edit-desc" class="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white h-32">${esc(currentUser.descricao || '')}</textarea>
            </div>
            <div class="flex gap-4 pt-4">
                <button type="button" onclick="abrirPerfil('${currentUser.email}')" class="w-1/3 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold">Cancelar</button>
                <button type="submit" class="w-2/3 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold">Salvar Alterações</button>
            </div>
        </form>
    `;
}

async function salvarPerfil(e) {
    e.preventDefault();
    const dados = {
        categoria: document.getElementById('edit-cat').value,
        cidade: document.getElementById('edit-cid').value,
        servicos: document.getElementById('edit-serv').value,
        descricao: document.getElementById('edit-desc').value
    };

    try {
        const res = await fetch(`${API_URL}/perfil/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        if (res.ok) {
            const data = await res.json();
            // Atualiza os dados locais e a sessão
            currentUser = data.user;
            localStorage.setItem('conectasul_session', JSON.stringify(currentUser));
            toast("Perfil atualizado com sucesso!");
            loadProvidersFromAPI();
            abrirPerfil(currentUser.email); // Volta para a tela de visualização
        } else { toast("Erro ao salvar."); }
    } catch(err) { toast("Erro de conexão."); }
}

// ==========================================
// FUNÇÕES DE AVALIAÇÃO E AGENDAMENTO
// ==========================================
async function avaliarProfissional(prestadorId, nota) {
    try {
        const res = await fetch(`${API_URL}/avaliar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prestador_id: prestadorId, cliente_id: currentUser.id, nota: nota })
        });
        if (res.ok) {
            toast(`Avaliação de ${nota} estrelas enviada!`);
            loadProvidersFromAPI();
            fecharModais();
        } else { toast("Erro ao registrar avaliação."); }
    } catch(err) { toast("Erro de conexão."); }
}

async function fazerAgendamento(event, prestadorId) {
  event.preventDefault();
  const agendamento = {
    prestador_id: prestadorId, cliente_id: currentUser.id,
    data_hora: document.getElementById('agenda-data').value,
    descricao_servico: document.getElementById('agenda-desc').value
  };
  try {
    const res = await fetch(`${API_URL}/agendamentos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(agendamento)
    });
    if (res.ok) { toast("Agendamento solicitado com sucesso!"); fecharModais(); } 
    else { toast("Erro ao agendar."); }
  } catch(e) { toast("Erro de conexão."); }
}

// ==========================================
// API E SESSÃO
// ==========================================
async function loadProvidersFromAPI() {
  try {
    const res = await fetch(`${API_URL}/prestadores`);
    if (!res.ok) throw new Error("Erro na rede");
    globalProviders = await res.json();
    renderProviders(globalProviders);
    updateStats(globalProviders);
  } catch (error) { console.error(error); }
}

// ==========================================
// SESSÃO E LOGOUT
// ==========================================
function checkSession() {
  const authDiv = document.getElementById('auth-section');
  if (currentUser) {
    const badgeAdmin = currentUser.is_admin ? '<span class="text-xs bg-red-600 text-white px-2 py-0.5 rounded ml-2">ADMIN</span>' : '';
    
    // Se o usuário for prestador, mostra o botão da Agenda
    const btnAgenda = currentUser.tipo_conta === 'prestador' 
        ? `<a href="agenda.html" class="bg-purple-900/30 border border-purple-500/50 hover:bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors ml-4 hidden sm:block">📅 Minha Agenda</a>` 
        : '';

    authDiv.innerHTML = `
      <div class="flex items-center">
          <span class="text-sm text-gray-400 flex items-center">
            Olá, <strong class="text-white ml-1">${currentUser.nome}</strong> ${badgeAdmin}
          </span>
          ${btnAgenda}
          <button onclick="logout()" class="text-red-400 hover:text-red-300 text-sm font-medium ml-4 border border-red-900/30 bg-red-900/10 px-3 py-1.5 rounded-lg transition-colors">Sair</button>
      </div>
    `;
  }
}

function logout() {
  // Limpa os dados da sessão
  localStorage.removeItem('conectasul_session');
  
  // Redireciona para a porta da frente (seu novo index.html de login)
  window.location.replace('index.html'); 
}