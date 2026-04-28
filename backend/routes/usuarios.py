from fastapi import APIRouter, HTTPException
from models import LoginRequest, RegistroRequest, AgendamentoRequest, AvaliacaoRequest, PerfilUpdate
from database import supabase

# Criamos o roteador principal
router = APIRouter()

# ==========================================
# 1. AUTENTICAÇÃO E REGISTRO
# ==========================================

@router.post("/login")
def login(dados: LoginRequest):
    # Busca o usuário por email e senha
    response = supabase.table("usuarios").select("*").eq("email", dados.email).eq("senha", dados.senha).execute()
    if not response.data:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    return {"message": "Login realizado com sucesso!", "user": response.data[0]}

@router.post("/registro")
def registro(dados: RegistroRequest):
    # Verifica se o email já existe para evitar duplicatas
    busca = supabase.table("usuarios").select("*").eq("email", dados.email).execute()
    if busca.data:
        raise HTTPException(status_code=400, detail="Este email já está cadastrado")

    novo_usuario = dados.model_dump() 
    response = supabase.table("usuarios").insert(novo_usuario).execute()
    return response.data[0]

# ==========================================
# 2. GESTÃO DE PERFIL E PRESTADORES
# ==========================================

@router.get("/prestadores")
def listar_prestadores():
    # Retorna todos os usuários que são prestadores
    response = supabase.table("usuarios").select("*").eq("tipo_conta", "prestador").execute()
    return response.data

@router.put("/perfil/{usuario_id}")
def editar_perfil(usuario_id: str, request: PerfilUpdate):
    try:
        # Atualiza apenas os campos enviados no JSON (exclude_unset=True)
        dados_atualizados = request.model_dump(exclude_unset=True)
        if not dados_atualizados:
            raise HTTPException(status_code=400, detail="Nenhum dado fornecido.")

        response = supabase.table("usuarios").update(dados_atualizados).eq("id", usuario_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        return {"status": "sucesso", "user": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar perfil: {str(e)}")

# ==========================================
# 3. SISTEMA DE AGENDAMENTOS (OPÇÃO 2 - FLOW)
# ==========================================

@router.post("/agendamentos")
def criar_agendamento(agenda: AgendamentoRequest):
    try:
        dados = agenda.model_dump()
        dados["status"] = "pendente" # Todo agendamento nasce pendente
        
        response = supabase.table("agendamentos").insert(dados).execute()
        return {"message": "Agendamento criado com sucesso!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao criar agendamento: {str(e)}")

@router.get("/agendamentos/prestador/{prestador_id}")
def listar_agenda_prestador(prestador_id: str): 
    try:
        # Busca agenda unindo com usuários via fk_cliente para evitar erro 400
        # Ordenado por data (desc=False -> do mais antigo para o mais novo)
        response = supabase.table("agendamentos")\
            .select("*, cliente:usuarios!fk_cliente(nome, telefone)")\
            .eq("prestador_id", prestador_id)\
            .order("data_hora", desc=False)\
            .execute()
            
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao buscar agenda: {str(e)}")

@router.patch("/agendamentos/{agendamento_id}/status")
def atualizar_status_agendamento(agendamento_id: str, novo_status: str):
    try:
        # Rota dinâmica: serve para 'aceito' e 'concluido'
        response = supabase.table("agendamentos")\
            .update({"status": novo_status})\
            .eq("id", agendamento_id)\
            .execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado.")
            
        return {"message": f"Status atualizado para {novo_status}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==========================================
# 4. AVALIAÇÕES E MÉDIAS
# ==========================================

@router.post("/avaliar")
def avaliar_prestador(aval: AvaliacaoRequest):
    try:
        # 1. Salva a nova avaliação na tabela
        dados = aval.model_dump()
        supabase.table("avaliacoes").insert(dados).execute()
        
        # 2. Recalcula a média em tempo real
        prestador_id = aval.prestador_id
        todas_av = supabase.table("avaliacoes").select("nota").eq("prestador_id", prestador_id).execute()
        
        notas = [av['nota'] for av in todas_av.data]
        total = len(notas)
        nova_media = sum(notas) / total if total > 0 else 0
        
        # 3. Atualiza o perfil do prestador com o novo Score
        supabase.table("usuarios").update({
            "media_nota": round(nova_media, 2),
            "total_avaliacoes": total
        }).eq("id", prestador_id).execute()
        
        return {"status": "sucesso", "nova_media": nova_media}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao avaliar: {str(e)}")

# ==========================================
# 5. ADMINISTRAÇÃO E MODERAÇÃO
# ==========================================

@router.delete("/admin/usuarios/{usuario_id}")
def banir_usuario(usuario_id: str, admin_id: str):
    # Verifica permissão de administrador
    admin_check = supabase.table("usuarios").select("is_admin").eq("id", admin_id).execute()
    
    if not admin_check.data or not admin_check.data[0].get("is_admin"):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")

    try:
        supabase.table("usuarios").delete().eq("id", usuario_id).execute()
        return {"message": "Usuário banido com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao apagar: {str(e)}")