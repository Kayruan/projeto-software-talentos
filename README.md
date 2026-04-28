
ConectaSul - Plataforma de Talentos e Serviços
O ConectaSul é uma aplicação Full-Stack desenvolvida como projeto acadêmico. A plataforma visa conectar prestadores de serviços independentes a clientes locais, permitindo agendamentos, avaliações de profissionais e uma gestão administrativa completa.

🚀 Tecnologias Utilizadas
O projeto utiliza uma arquitetura moderna e distribuída:

Frontend: HTML5, CSS3 (Tailwind CSS), JavaScript (Vanilla) - Hospedado na Vercel.

Backend: Python com FastAPI e Pydantic - Hospedado no Render.

Banco de Dados: PostgreSQL via Supabase.

Ícones: Lucide Icons.

Metodologia: Scrum.

🗄️ Estrutura do Banco de Dados (PostgreSQL)
O banco de dados foi projetado para garantir a integridade referencial e suportar as funcionalidades de negócio. Abaixo, as principais tabelas:

1. Tabela usuarios
Armazena dados de clientes, prestadores e administradores.

id: UUID (Primary Key)

nome, email, senha: Dados de autenticação.

telefone: Contato para integração com WhatsApp.

tipo_conta: Define se o usuário é 'cliente' ou 'prestador'.

is_admin: Boolean para controle de acesso administrativo.

categoria, cidade, servicos, descricao: Dados de perfil do profissional.

foto_url: Link para imagem de perfil.

2. Tabela agendamentos
Gerencia a agenda entre prestadores e clientes.

id: UUID (PK)

prestador_id: FK -> usuarios(id)

cliente_id: FK -> usuarios(id)

data_hora: Timestamp

descricao_servico: Texto

status: 'pendente', 'concluido'.

3. Tabela avaliacoes
Sistema de feedback (estrelas).

prestador_id: FK -> usuarios(id)

cliente_id: FK -> usuarios(id)

nota: Inteiro (1-5)

🛠️ Funcionalidades Principais
Autenticação: Fluxo completo de login e cadastro com diferenciação de tipos de conta.

Dashboard Dinâmico: Visualização de prestadores com filtros por categoria e busca em tempo real.

Perfil do Profissional: Edição de perfil com suporte a fotos externas e listagem de serviços.

Agendamento: Clientes podem solicitar serviços definindo data e descrição.

Painel do Prestador: Agenda dedicada para visualização de pedidos e contato via WhatsApp.

Painel Administrativo: Permite que administradores realizem a moderação de usuários (banimento).

📋 Como Executar o Projeto
Backend:

Certifique-se de ter o Python 3.9+ instalado.

Instale as dependências: pip install -r requirements.txt

Execute o servidor: uvicorn main:app --reload

Frontend:

Acesse o arquivo index.html via Live Server ou abra diretamente no navegador.