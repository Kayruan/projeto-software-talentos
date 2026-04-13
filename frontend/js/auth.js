async function doLogin() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-pass').value;
  
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('conectasul_session', JSON.stringify(data.user));
        fecharModais();
        checkSession();
        toast("Login realizado com sucesso!");
      } else {
        toast(data.detail || "Erro no login");
      }
    } catch (e) {
      toast("Erro ao conectar com o servidor.");
    }
  }
  
  async function doSignup() {
    const dados = {
      nome: document.getElementById('cad-nome').value,
      email: document.getElementById('cad-email').value,
      senha: document.getElementById('cad-senha').value,
      cidade: document.getElementById('cad-cidade').value,
      tipo_conta: document.getElementById('cad-tipo').value,
      categoria: document.getElementById('cad-categoria').value || "",
      descricao: document.getElementById('cad-descricao').value || "",
      servicos: ""
    };
  
    if (!dados.nome || !dados.email || !dados.senha) return toast("Preencha nome, email e senha!");
  
    try {
      const res = await fetch(`${API_URL}/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      
      if (res.ok) {
        fecharModais();
        toast("Conta criada! Faça login para entrar.");
        if(dados.tipo_conta === 'prestador') loadProvidersFromAPI();
      } else {
        const erro = await res.json();
        toast(erro.detail || "Erro ao cadastrar");
      }
    } catch (e) {
      toast("Erro ao conectar com o servidor.");
    }
  }
  
  function logout() {
    localStorage.removeItem('conectasul_session');
    checkSession();
    toast("Você saiu da conta.");
  }