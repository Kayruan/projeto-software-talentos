# projeto-software-talentos

-- 1. Criar a tabela principal de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    -- Identificação e Login
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'cliente', -- Define se é 'cliente' ou 'prestador'
    
    -- Informações de Contato (Essencial para o WhatsApp)
    telefone TEXT,
    cidade TEXT,
    
    -- Campos de Perfil Profissional (Exclusivos para Prestadores)
    categoria TEXT,       -- Ex: Eletricista, Encanador, Desenvolvedor
    descricao TEXT,       -- Texto do "Sobre o profissional"
    servicos TEXT,        -- Tags de serviços separadas por vírgula
    
    -- Metadados de Controle
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inserir um Prestador de Teste (Exemplo para validar o Dashboard)
-- Lembre-se: no seu sistema real, a senha deve ser enviada via hash pelo Python
INSERT INTO usuarios (nome, email, senha, tipo, telefone, cidade, categoria, descricao, servicos)
VALUES (
    'João Silva', 
    'joao@email.com', 
    'senha123', 
    'prestador', 
    '51999999999', 
    'Espumoso', 
    'Eletricista', 
    'Especialista em instalações residenciais e manutenção de ar-condicionado com 10 anos de experiência.', 
    'Instalação, Manutenção, Quadros Elétricos'
);