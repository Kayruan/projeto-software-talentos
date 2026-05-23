// Variáveis globais
let todosPrestadores = [];
let prestadoresFiltrados = [];
let currentUser = null; 
let notaSelecionadaParaAvaliar = 0; // Controla o clique nas estrelas de feedback

// ==========================================
// INICIALIZAÇÃO DA PÁGINA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const sessionStr = localStorage.getItem('conectasul_session');
    
    if (!sessionStr) {
        window.location.replace('index.html');
        return;
    }
    
    currentUser = JSON.parse(sessionStr);
    lucide.createIcons();
    configurarMenuSuperior();
    carregarPrestadores();
});

function esc(str) {
    if (!str) return '';
    return str.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function exibirToast(msg) {
    const toast = document.getElementById("toast");
    document.getElementById("toast-msg").innerText = msg;
    toast.classList.remove("translate-y-20", "opacity-0");
    setTimeout(() => {
        toast.classList.add("translate-y-20", "opacity-0");
    }, 3000);
}

function abrirModal(id) { 
    document.getElementById(id).classList.remove('hidden'); 
    document.getElementById(id).classList.add('flex'); 
}

function fecharModais() { 
    document.querySelectorAll('.modal').forEach(m => { 
        m.classList.add('hidden'); 
        m.classList.remove('flex'); 
    }); 
}

function logout() {
    localStorage.removeItem('conectasul_session');
    window.location.replace('index.html'); 
}

// ==========================================
// RENDERIZAÇÃO E FILTROS DO DASHBOARD
// ==========================================
function configurarMenuSuperior() {
    const authSection = document.getElementById("auth-section");
    if (currentUser) {
        const badgeAdmin = currentUser.is_admin ? '<span class="text-[10px] font-black tracking-wider bg-red-600 text-white px-2 py-0.5 rounded ml-2 shadow">ADMIN</span>' : '';
        authSection.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-sm text-gray-400 hidden sm:block">
                    Olá, <strong class="text-white">${currentUser.nome}</strong> ${badgeAdmin}
                </span>
                <div class="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center font-bold text-sm text-purple-300 uppercase select-none">
                    ${currentUser.nome.substring(0, 2)}
                </div>
                <button onclick="logout()" class="text-red-400 hover:text-red-300 text-xs font-bold px-3 py-2 border border-red-900/30 bg-red-900/10 rounded-xl transition-colors">Sair</button>
            </div>
        `;
    }
}

async function carregarPrestadores() {
    try {
        const res = await fetch(`${API_URL}/prestadores`);
        if (!res.ok) throw new Error("Erro ao buscar prestadores");
        
        todosPrestadores = await res.json();
        prestadoresFiltrados = [...todosPrestadores];
        
        gerarOpcoesDosFiltros();
        atualizarMetricasDoPainel();
        aplicarFiltros();
    } catch (err) {
        exibirToast("Erro ao conectar com o servidor.");
    }
}

function atualizarMetricasDoPainel() {
    document.getElementById("stat-providers").innerText = todosPrestadores.length;
    const categoriesUnicas = new Set(todosPrestadores.map(p => p.categoria).filter(Boolean));
    const cidadesUnicas = new Set(todosPrestadores.map(p => p.cidade).filter(Boolean));
    
    document.getElementById("stat-categories").innerText = categoriesUnicas.size;
    document.getElementById("stat-cities").innerText = cidadesUnicas.size;
}

function gerarOpcoesDosFiltros() {
    const selectCidade = document.getElementById("filter-city");
    const selectCategoria = document.getElementById("filter-category");
    
    selectCidade.innerHTML = '<option value="">Todas as cidades</option>';
    selectCategoria.innerHTML = '<option value="">Todas as categorias</option>';
    
    const cidades = [...new Set(todosPrestadores.map(p => p.cidade).filter(Boolean))].sort();
    const categorias = [...new Set(todosPrestadores.map(p => p.categoria).filter(Boolean))].sort();
    
    cidades.forEach(cidade => selectCidade.innerHTML += `<option value="${cidade}">${cidade}</option>`);
    categorias.forEach(cat => selectCategoria.innerHTML += `<option value="${cat}">${cat}</option>`);
}

function aplicarFiltros() {
    const termoBusca = document.getElementById("search-input").value.toLowerCase();
    const cidadeSelecionada = document.getElementById("filter-city").value;
    const categoriaSelecionada = document.getElementById("filter-category").value;
    const ordenacao = document.getElementById("filter-order").value;
    
    prestadoresFiltrados = todosPrestadores.filter(p => {
        const bateNome = p.nome.toLowerCase().includes(termoBusca);
        const bateServico = (p.servicos || '').toLowerCase().includes(termoBusca);
        const bateCidade = cidadeSelecionada === "" || p.cidade === cidadeSelecionada;
        const bateCategoria = categoriaSelecionada === "" || p.categoria === categoriaSelecionada;
        
        return (bateNome || bateServico) && bateCidade && bateCategoria;
    });
    
    if (ordenacao === "melhores") {
        prestadoresFiltrados.sort((a, b) => (b.media_nota || 0) - (a.media_nota || 0));
    } else if (ordenacao === "nome") {
        prestadoresFiltrados.sort((a, b) => a.nome.localeCompare(b.nome));
    }
    
    renderizarGridCards();
}

function limparFiltros() {
    document.getElementById("search-input").value = "";
    document.getElementById("filter-city").value = "";
    document.getElementById("filter-category").value = "";
    document.getElementById("filter-order").value = "melhores";
    aplicarFiltros();
}

function renderizarGridCards() {
    const grid = document.getElementById("providers-grid");
    grid.innerHTML = "";
    
    if (prestadoresFiltrados.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 bg-[#161626] rounded-2xl border border-gray-800/80">
                <i data-lucide="users-2" class="w-12 h-12 text-gray-600 mx-auto mb-3"></i>
                <p class="text-gray-400 font-medium">Nenhum profissional encontrado com os filtros aplicados.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    prestadoresFiltrados.forEach(p => {
        const notaMedia = p.media_nota || 0;
        const totalAv = p.total_avaliacoes || 0;
        const avatarUrl = (p.foto_url && p.foto_url.trim() !== "") ? p.foto_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome)}&background=7c3aed&color=fff&size=150&bold=true`;
            
        const btnAdmin = (currentUser && currentUser.is_admin && currentUser.id !== p.id) 
            ? `<button onclick="banirUsuario('${p.id}')" class="w-full mt-2 text-red-500/70 hover:text-red-400 text-xs font-semibold py-1 border border-red-900/30 bg-red-900/10 rounded">Banir Conta (Admin)</button>` 
            : '';
        
        grid.innerHTML += `
            <div class="bg-[#161626] border border-gray-800 hover:border-purple-500/40 p-6 rounded-2xl flex flex-col justify-between h-full shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div>
                    <div class="flex justify-between items-start gap-2 mb-4">
                        <img src="${avatarUrl}" class="w-12 h-12 rounded-full border-2 border-purple-500/30 object-cover shadow-md">
                        <div class="flex items-center gap-1 bg-amber-950/40 border border-amber-800/60 px-2.5 py-1 rounded-lg text-amber-400 font-black text-xs">
                            <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i> ${notaMedia.toFixed(1)} <span class="text-gray-500 font-normal">(${totalAv})</span>
                        </div>
                    </div>
                    
                    <span class="bg-purple-950/40 border border-purple-900/60 text-purple-300 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md">${p.categoria || 'Geral'}</span>
                    <h4 class="text-xl font-bold text-white mt-3">${esc(p.nome)}</h4>
                    
                    <div class="flex items-center gap-1 text-gray-400 text-xs mt-1.5 font-medium">
                        <i data-lucide="map-pin" class="w-3.5 h-3.5 text-purple-500"></i> ${esc(p.cidade)}
                    </div>
                    
                    <p class="text-gray-400 text-sm mt-4 line-clamp-2 leading-relaxed italic">"${esc(p.descricao || 'Nenhuma descrição fornecida.')}"</p>
                </div>
                
                <div class="mt-6 pt-4 border-t border-gray-800/60">
                    <button onclick="abrirPerfil('${p.email}')" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-950/30">
                        Visualizar Perfil <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                    ${btnAdmin}
                </div>
            </div>
        `;
    });
    lucide.createIcons();
}

// ==========================================
// EXPANSÃO DE PERFIL E HISTÓRICO DE DEPOIMENTOS
// ==========================================
async function abrirPerfil(email) {
    // CORREÇÃO: Mudado de globalProviders para todosPrestadores
    const p = todosPrestadores.find(prov => prov.email === email);
    if (!p) return exibirToast("Profissional não encontrado.");

    notaSelecionadaParaAvaliar = 0; // Reseta o seletor interno de estrelas do form
    const content = document.getElementById('perfil-content');
    const avatarUrl = (p.foto_url && p.foto_url.trim() !== "") ? p.foto_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome)}&background=7c3aed&color=fff&size=150&bold=true`;
    const servicos = p.servicos ? p.servicos.split(',') : ['Serviços Gerais'];
    const tagsHtml = servicos.map(s => `<span class="bg-purple-900/40 text-purple-300 px-3 py-1 text-sm rounded-full border border-purple-700/50">${esc(s.trim())}</span>`).join('');
    const notaReal = parseFloat(p.media_nota || 0).toFixed(1);
    const totalAv = p.total_avaliacoes || 0;

    let html = `
        <div class="flex flex-col sm:flex-row gap-6 items-start">
            <img src="${avatarUrl}" class="w-24 h-24 rounded-full border-4 border-[#0f0f1a] shadow-xl object-cover bg-[#161626]">
            <div class="mt-4 sm:mt-12">
                <h2 class="text-3xl font-bold text-white">${esc(p.nome)}</h2>
                <p class="text-purple-400 font-medium text-lg">${esc(p.categoria || 'Profissional Independente')}</p>
                <div class="flex flex-wrap items-center gap-2 mt-2">
                    <i data-lucide="star" class="w-5 h-5 text-amber-400 fill-current"></i>
                    <span class="font-bold text-white text-lg">${notaReal}</span>
                    <span class="text-gray-400 text-sm">(${totalAv} avaliações)</span>
                    <span class="text-gray-600 mx-2">•</span>
                    <span class="text-gray-400 text-sm flex items-center gap-1"><i data-lucide="map-pin" class="w-4 h-4"></i> ${esc(p.cidade)}</span>
                </div>
            </div>
        </div>

        <div class="mt-8">
            <h3 class="text-xl font-bold text-white mb-3 font-space">Sobre</h3>
            <p class="text-gray-300 leading-relaxed bg-[#050508] p-4 rounded-xl border border-gray-800/80">${esc(p.descricao || 'Sem descrição detalhada.')}</p>
        </div>

        <div class="mt-8">
            <h3 class="text-xl font-bold text-white mb-3 font-space">Serviços Oferecidos</h3>
            <div class="flex flex-wrap gap-2">${tagsHtml}</div>
        </div>

        <div class="mt-8 border-t border-gray-800 pt-6">
            <h3 class="text-xl font-bold text-white mb-4 font-space flex items-center gap-2"><i data-lucide="message-square" class="text-purple-400 w-5 h-5"></i> Avaliações e Portfólio</h3>
            <div id="lista-depoimentos-container" class="space-y-4">
                <p class="text-gray-500 text-sm italic">Buscando histórico de depoimentos...</p>
            </div>
        </div>
    `;

    if (p.id === currentUser.id) {
        html += `
            <div class="mt-8 border-t border-gray-800 pt-6">
                <button onclick="carregarFormEdicao()" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold transition-all">✏️ Editar Meu Perfil</button>
            </div>
        `;
    } else {
        const foneLimpo = p.telefone ? p.telefone.replace(/\D/g, '') : '';
        const linkZap = `https://wa.me/55${foneLimpo}?text=Olá%20${esc(p.nome)},%20vi%20seu%20perfil%20no%20ConectaSul%20e%20gostaria%20de%20solicitar%20um%20orçamento!`;

        html += `
            <div class="mt-8 border-t border-gray-800 pt-6">
                <h3 class="text-xl font-bold text-white mb-4 font-space">Avaliar Profissional e Enviar Foto</h3>
                <form onsubmit="salvarNovaAvaliacaoCompleta(event, '${p.id}')" class="bg-[#050508] p-5 rounded-xl border border-gray-800 space-y-4">
                    
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Clique para selecionar a Nota</label>
                        <div class="flex gap-2 bg-black/40 p-3 rounded-xl border border-gray-800/80 justify-center">
                            ${[1,2,3,4,5].map(n => `<i data-lucide="star" id="estrela-form-${n}" onclick="marcarEstrelasNoForm(${n})" class="w-7 h-7 text-gray-600 cursor-pointer hover:text-amber-400 transition-all"></i>`).join('')}
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Seu Comentário / Feedback</label>
                        <textarea id="av-comentario-input" placeholder="Conte como foi a sua experiência com o serviço prestado..." class="w-full bg-black/50 border border-gray-700 rounded-lg p-2.5 text-white h-20 text-sm focus:border-purple-500 outline-none" required></textarea>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Foto do Serviço Finalizado (Opcional)</label>
                        <input type="file" id="av-foto-file" accept="image/*" class="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/30 cursor-pointer">
                    </div>

                    <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-md">Publicar Avaliação</button>
                </form>
            </div>

            <div class="mt-8 border-t border-gray-800 pt-6">
                <h3 class="text-xl font-bold text-white mb-4 font-space">Solicitar Orçamento de Serviço</h3>
                <form onsubmit="fazerAgendamento(event, '${p.id}')" class="bg-[#050508] p-5 rounded-xl border border-gray-800 space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Data e Hora Estimada</label>
                        <input type="datetime-local" id="agenda-data" class="w-full bg-black/50 border border-gray-700 rounded-lg p-2.5 text-white focus:border-purple-500 outline-none" required>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descreva detalhadamente o que você precisa</label>
                        <textarea id="agenda-desc" placeholder="Ex: Preciso de uma pintura externa em uma parede de 4x3 metros..." class="w-full bg-black/50 border border-gray-700 rounded-lg p-2.5 text-white h-24 focus:border-purple-500 outline-none" required></textarea>
                    </div>
                    <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-950/40">Enviar Pedido para Central</button>
                </form>
            </div>

            <div class="mt-6">
                <a href="${linkZap}" target="_blank" class="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold text-base flex justify-center items-center gap-2 transition-all shadow-lg shadow-green-950/30">
                    <i data-lucide="message-circle"></i> Conversar direto no WhatsApp
                </a>
            </div>
        `;
    }

    content.innerHTML = html;
    abrirModal('perfilModal');
    lucide.createIcons();
    
    renderizarListaDeAvaliacoesRealizadas(p.id);
}

// Pintura interativa das estrelas do formulário ao clicar
function marcarEstrelasNoForm(nota) {
    notaSelecionadaParaAvaliar = nota;
    for (let i = 1; i <= 5; i++) {
        const estrela = document.getElementById(`estrela-form-${i}`);
        if (i <= nota) {
            estrela.classList.add("text-amber-400", "fill-current");
            estrela.classList.remove("text-gray-600");
        } else {
            estrela.classList.remove("text-amber-400", "fill-current");
            estrela.classList.add("text-gray-600");
        }
    }
}

// Busca e desenhos a lista de portfólio/feedbacks embaixo do perfil
async function renderizarListaDeAvaliacoesRealizadas(prestadorId) {
    const box = document.getElementById("lista-depoimentos-container");
    try {
        const res = await fetch(`${API_URL}/avaliacoes/prestador/${prestadorId}`);
        if (!res.ok) throw new Error();
        const lista = await res.json();

        if (!lista || lista.length === 0) {
            box.innerHTML = `<p class="text-gray-500 text-sm italic">Nenhum comentário ou foto foi postado para este profissional ainda.</p>`;
            return;
        }

        box.innerHTML = "";
        lista.forEach(av => {
            const estrelasRepetidas = '<span class="text-amber-400 font-bold">★</span>'.repeat(av.nota) + '<span class="text-gray-700">★</span>'.repeat(5 - av.nota);
            const nomeCliente = av.cliente ? av.cliente.nome : 'Cliente Anonimo';
            
            box.innerHTML += `
                <div class="bg-[#0b0b14] border border-gray-800/60 p-4 rounded-xl space-y-2">
                    <div class="flex justify-between items-center">
                        <strong class="text-sm text-gray-200 font-semibold">${esc(nomeCliente)}</strong>
                        <div class="text-xs">${estrelasRepetidas}</div>
                    </div>
                    <p class="text-gray-400 text-sm italic leading-relaxed">"${esc(av.comentario || 'Apenas deu a nota.')}"</p>
                    
                    ${av.foto_url ? `
                        <div class="mt-2">
                            <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Foto do Serviço Realizado:</p>
                            <img src="${av.foto_url}" class="w-full max-w-xs h-40 object-cover rounded-lg border border-gray-800 shadow shadow-purple-950/20 cursor-zoom-in" onclick="window.open('${av.foto_url}', '_blank')">
                        </div>
                    ` : ''}
                </div>
            `;
        });
    } catch (err) {
        box.innerHTML = `<p class="text-red-500 text-xs">Não foi possível carregar o mural de feedbacks.</p>`;
    }
}

// Envio em FormData (Multi-part) da avaliação para aceitar o arquivo binário
async function salvarNovaAvaliacaoCompleta(e, prestadorId) {
    e.preventDefault();
    if (notaSelecionadaParaAvaliar === 0) { alert("Por favor, selecione ao menos 1 estrela de nota."); return; }

    const comentarioTxt = document.getElementById("av-comentario-input").value;
    const inputFoto = document.getElementById("av-foto-file");

    try {
        exibirToast("Processando avaliação...");
        const formData = new FormData();
        formData.append("prestador_id", prestadorId);
        formData.append("cliente_id", currentUser.id);
        formData.append("nota", notaSelecionadaParaAvaliar);
        formData.append("comentario", comentarioTxt);

        if (inputFoto && inputFoto.files.length > 0) {
            formData.append("arquivo", inputFoto.files[0]);
        }

        const res = await fetch(`${API_URL}/avaliar`, {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            exibirToast("Avaliação e foto postadas com sucesso!");
            carregarPrestadores(); // Recarrega os dados do dashboard
            fecharModais();
        } else {
            alert("Erro ao salvar avaliação.");
        }
    } catch (err) {
        console.error(err);
        exibirToast("Erro de conexão.");
    }
}

// ==========================================
// FUNÇÕES DE EDIÇÃO DE PERFIL
// ==========================================
function carregarFormEdicao() {
    const content = document.getElementById('perfil-content');
    content.innerHTML = `
        <h3 class="text-2xl font-bold text-white mb-4 mt-8 font-space">Editar Perfil</h3>
        <form onsubmit="salvarPerfil(event)" class="space-y-4">
            <div class="bg-[#050508] p-4 rounded-xl border border-gray-800">
                <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sua Foto de Perfil (Arquivo)</label>
                <input type="file" id="edit-foto-file" accept="image/*" class="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/30 cursor-pointer">
                <p class="text-[11px] text-gray-500 mt-2">Selecione uma imagem (.jpg, .png) do seu dispositivo.</p>
            </div>
            <div>
                <label class="text-sm text-gray-400 font-medium">Sua Profissão / Categoria</label>
                <input type="text" id="edit-cat" value="${esc(currentUser.categoria || '')}" class="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none">
            </div>
            <div>
                <label class="text-sm text-gray-400 font-medium">Cidade</label>
                <input type="text" id="edit-cid" value="${esc(currentUser.cidade || '')}" class="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none">
            </div>
            <div>
                <label class="text-sm text-gray-400 font-medium">Serviços Oferecidos (separados por vírgula)</label>
                <input type="text" id="edit-serv" value="${esc(currentUser.servicos || '')}" class="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none">
            </div>
            <div>
                <label class="text-sm text-gray-400 font-medium">Sobre Você</label>
                <textarea id="edit-desc" class="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white h-32 focus:border-purple-500 outline-none">${esc(currentUser.descricao || '')}</textarea>
            </div>
            <div class="flex gap-4 pt-4">
                <button type="button" onclick="abrirPerfil('${currentUser.email}')" class="w-1/3 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white py-3 rounded-xl font-bold transition-all">Cancelar</button>
                <button type="submit" class="w-2/3 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg">Salvar Alterações</button>
            </div>
        </form>
    `;
}

async function salvarPerfil(e) {
    e.preventDefault();
    const dadosTexto = {
        categoria: document.getElementById('edit-cat').value,
        cidade: document.getElementById('edit-cid').value,
        servicos: document.getElementById('edit-serv').value,
        descricao: document.getElementById('edit-desc').value
    };

    try {
        let resTexto = await fetch(`${API_URL}/perfil/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosTexto)
        });
        
        if (!resTexto.ok) throw new Error("Erro ao salvar textos");
        let dataTexto = await resTexto.json();
        currentUser = dataTexto.user;

        const inputFoto = document.getElementById('edit-foto-file');
        if (inputFoto && inputFoto.files.length > 0) {
            exibirToast("Enviando imagem para a nuvem...");
            const formData = new FormData();
            formData.append("arquivo", inputFoto.files[0]);

            let resFoto = await fetch(`${API_URL}/perfil/${currentUser.id}/upload-foto`, {
                method: 'POST',
                body: formData
            });

            if (resFoto.ok) {
                let dataFoto = await resFoto.json();
                currentUser.foto_url = dataFoto.foto_url; 
            }
        }

        localStorage.setItem('conectasul_session', JSON.stringify(currentUser));
        exibirToast("Perfil atualizado com sucesso!");
        carregarPrestadores();
        abrirPerfil(currentUser.email);
    } catch(err) { 
        exibirToast("Erro ao sincronizar o perfil."); 
    }
}

// ==========================================
// OUTROS ENVIOS: AGENDAMENTO E ADMIN
// ==========================================
async function fazerAgendamento(event, prestadorId) {
    event.preventDefault();
    const agendamento = {
        prestador_id: prestadorId,
        cliente_id: currentUser.id,
        data_hora: document.getElementById('agenda-data').value,
        descricao_servico: document.getElementById('agenda-desc').value
    };
    try {
        const res = await fetch(`${API_URL}/agendamentos`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(agendamento)
        });
        if (res.ok) { exibirToast("Agendamento solicitado com sucesso!"); fecharModais(); } 
        else { exibirToast("Erro ao agendar."); }
    } catch(e) { exibirToast("Erro de conexão."); }
}

async function banirUsuario(usuarioId) {
    if (!confirm("Atenção ADMIN: Tem certeza que deseja banir e apagar este prestador do sistema?")) return;
    try {
        const res = await fetch(`${API_URL}/admin/usuarios/${usuarioId}?admin_id=${currentUser.id}`, { method: 'DELETE' });
        if (res.ok) { exibirToast("Usuário banido com sucesso."); carregarPrestadores(); } 
        else { exibirToast("Erro ao banir usuário."); }
    } catch (err) { exibirToast("Erro de conexão com o servidor."); }
}