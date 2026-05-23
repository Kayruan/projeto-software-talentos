# ConectaSul - Plataforma de Talentos e Serviços

O **ConectaSul** é uma aplicação Full-Stack robusta desenvolvida como projeto acadêmico estruturado sob a metodologia ágil **Scrum**. A plataforma atua como um marketplace de talentos, visando conectar prestadores de serviços independentes a clientes locais, permitindo a solicitação de orçamentos, agendamentos bi-direcionais, avaliações detalhadas com fotos de portfólio e moderação administrativa.

## 🚀 Tecnologias Utilizadas

O projeto utiliza uma arquitetura moderna, desacoplada e distribuída:
* **Frontend:** HTML5, CSS3 estruturado com **Tailwind CSS**, JavaScript assíncrono (Vanilla ES6) — Hospedado na **Vercel**.
* **Backend:** Python 3.9+ utilizando o ecossistema de alto desempenho **FastAPI** e validação tipada com **Pydantic** — Hospedado no **Render**.
* **Banco de Dados & Storage:** Relacional PostgreSQL gerenciado via **Supabase** (incluindo Bucket de Armazenamento de Mídia).
* **Vetor de Ícones:** Lucide Icons.

---

## 🗄️ Estrutura do Banco de Dados (PostgreSQL)

O banco de dados foi modelado para garantir integridade referencial estrita por meio de chaves estrangeiras (`FK`) e restrições de unicidade.

### 1. Tabela `usuarios`
Armazena a identidade e perfis do ecossistema.
* `id`: UUID (Primary Key - Geração Automática)
* `nome`, `email`, `senha`: Atributos de autenticação e identificação.
* `telefone`: Contato sanitizado para integração nativa com a API do WhatsApp.
* `tipo_conta`: String restrita (`'cliente'` ou `'prestador'`).
* `is_admin`: Boolean controlador de privilégios de moderação.
* `categoria`, `cidade`, `servicos`, `descricao`: Metadados específicos do perfil profissional.
* `foto_url`: String armazenando o link público da foto de perfil gerada no Supabase Storage.

### 2. Tabela `agendamentos`
Gerencia o fluxo de contratações por meio de uma Máquina de Estados.
* `id`: UUID (PK)
* `prestador_id`: FK -> `usuarios(id)`
* `cliente_id`: FK -> `usuarios(id)`
* `data_hora`: Timestamp sem fuso horário.
* `descricao_servico`: Texto descritivo da necessidade do cliente.
* `valor_orcamento`: Numeric(10,2) representando a contraproposta financeira do profissional.
* `status`: Máquina de estados controlando o ciclo de vida do serviço: `'pendente'`, `'orcado'`, `'aceito'`, `'recusado'` ou `'concluido'`.

### 3. Tabela `avaliacoes`
Sistema de feedback e composição de portfólio de serviços.
* `id`: UUID (PK)
* `prestador_id`: FK -> `usuarios(id)`
* `cliente_id`: FK -> `usuarios(id)`
* `nota`: Inteiro restrito (escala de 1 a 5).
* `comentario`: Texto detalhado contendo a experiência do cliente.
* `foto_url`: Link público da foto do serviço finalizado anexada pelo cliente.

---

## 🛠️ Funcionalidades Principais

* **Autenticação Avançada:** Sistema de login e registro dinâmico com blindagem contra e-mails duplicados e separação de escopo por tipo de conta.
* **Dashboard Avançado com Filtros em Cascata:** Mecanismo de busca síncrona que cruza dados textuais com seletores de Cidade e Categoria em tempo real.
* **Ordenação por Relevância (★):** Algoritmo que calcula a média ponderada das notas de avaliações em tempo real e joga os profissionais mais bem avaliados para o topo.
* **Fluxo de Orçamentos Duplo:** O cliente solicita o serviço, o prestador estipula o preço (`'orcado'`), e o cliente ganha os botões de aprovação ou recusa antes do agendamento definitivo.
* **Mural de Avaliações & Portfólio Real:** Área interna do perfil onde é disparada uma agregação que renderiza os comentários e as fotos reais dos serviços postadas por antigos clientes.
* **Upload de Mídia em Nuvem:** Integração nativa via objetos multipart (`FormData`) com o Supabase Storage para upload de arquivos de imagem locais sem passar URLs em texto.
* **Painel Administrativo:** Filtro de segurança que checa a flag `is_admin` diretamente no banco e libera o botão de banimento por ID.

---

## 📋 Como Executar o Projeto Localmente

### Backend (FastAPI)
1. Certifique-se de ter o Python 3.9+ instalado no seu ambiente de desenvolvimento.
2. Instale o pacote completo de dependências necessárias para a aplicação e manipulação de formulários:
   ```bash
   pip install -r requirements.txt