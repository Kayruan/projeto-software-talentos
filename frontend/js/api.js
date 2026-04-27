// Substitua pela URL do seu Render (ou deixe localhost se estiver testando no PC)
const API_URL =" https://conectasul-api.onrender.com";

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
            // A Mágica: Salva os dados do usuário no navegador
            localStorage.setItem('conectasul_session', JSON.stringify(data.user));
            return data.user;
        } else {
            // Mostra o erro que veio do Python (ex: "Email ou senha incorretos")
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
            window.location.href = 'login.html'; // Manda o usuário para logar
        } else {
            alert(data.detail || "Erro ao cadastrar");
        }
    } catch (error) {
        console.error("Erro no registro:", error);
        alert("Erro de conexão com o servidor.");
    }
}