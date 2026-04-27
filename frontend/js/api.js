// REMOVIDO O ESPAÇO ANTES DO HTTPS!
const API_URL = "https://conectasul-api.onrender.com";

// ==========================================
// FUNÇÃO DE LOGIN
// ==========================================
async function login(email, senha) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha }) // Formato que o Python espera
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('conectasul_session', JSON.stringify(data.user));
            window.location.replace('dashboard.html'); // Usando replace por segurança
            return data.user;
        } else {
            alert(data.detail || "Erro ao fazer login");
            return null;
        }
    } catch (error) {
        console.error("Erro no login:", error);
        alert("Erro de conexão com o servidor.");
        return null;
    }
}

// ==========================================
// FUNÇÃO DE CADASTRO
// ==========================================
async function registrar(usuario) {
    try {
        const response = await fetch(`${API_URL}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuario)
        });

        const data = await response.json();

        if (response.ok) {
            alert("Cadastro realizado com sucesso! Redirecionando para o login...");
            window.location.replace('index.html'); // MUDOU AQUI: Redireciona para o index.html
        } else {
            alert(data.detail || "Erro ao cadastrar");
        }
    } catch (error) {
        console.error("Erro no registro:", error);
        alert("Erro de conexão com o servidor.");
    }
}