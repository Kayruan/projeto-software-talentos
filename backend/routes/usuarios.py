from fastapi import APIRouter, HTTPException
from models import LoginRequest, RegistroRequest, AgendamentoRequest, AvaliacaoRequest, PerfilUpdate
from database import supabase

# Criamos o roteador principal
router = APIRouter()

# ==========================================
# ROTAS DE USUÁRIOS E AUTENTICAÇÃO
# ==========================================

@router.get("/prestadores")
def listar_prestadores():
    # Busca apenas quem tem o tipo_conta como 'prestador'
    response = supabase.table("usuarios").select("*").eq("tipo_conta", "prestador").execute()
    return response.data

@router.post("/login")
def login(dados: LoginRequest):
    response = supabase.table("usuarios").select("*").eq("email", dados.email).eq("senha", dados.senha).execute()
    if not response.data:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    return {"message": "Login realizado com sucesso!", "user": response.data[0]}

@router.post("/registro")
def registro(dados: RegistroRequest):
    busca = supabase.table("usuarios").select("*").eq("email", dados.email).execute()
    if busca.data:
        raise HTTPException(status_code=400, detail="Este email já está cadastrado")

    novo_usuario = dados.model_dump() # Usando model_dump (padrão Pydantic v2)
    response = supabase.table("usuarios").insert(novo_usuario).execute()
    return response.data[0]

@router.put("/perfil/{usuario_id}")
def editar_perfil(usuario_id: str, request: PerfilUpdate):
    try:
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
# ROTAS DE AGENDAMENTO (VERSÃO FINAL CORRIGIDA)
# ==========================================

@router.post("/agendamentos")
def criar_agendamento(agenda: AgendamentoRequest):
    try:
        # Converte o modelo Pydantic para dicionário
        dados = agenda.model_dump()
        
        # Garante que todo agendamento novo comece como 'pendente'
        dados["status"] = "pendente"
        
        # Insere na tabela de agendamentos
        response = supabase.table("agendamentos").insert(dados).execute()
        
        return {"message": "Agendamento criado com sucesso!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao criar agendamento: {str(e)}")

@router.get("/agendamentos/prestador/{prestador_id}")
def listar_agenda_prestador(prestador_id: str): 
    try:
        # Mudamos de !cliente_id para !fk_cliente conforme o erro sugeriu
        response = supabase.table("agendamentos")\
            .select("*, cliente:usuarios!fk_cliente(nome, telefone)")\
            .eq("prestador_id", prestador_id)\
            .order("data_hora", desc=False)\
            .execute()
            
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao buscar agenda: {str(e)}")
    
# ==========================================
# ROTA DE AVALIAÇÃO (COM RECALCULO DE MÉDIA)
# ==========================================

@router.post("/avaliar")
def avaliar_prestador(aval: AvaliacaoRequest):
    try:
        # 1. Salva a nova avaliação
        dados = aval.model_dump()
        supabase.table("avaliacoes").insert(dados).execute()
        
        # 2. Busca todas as avaliações para recalcular a média
        prestador_id = aval.prestador_id
        todas_av = supabase.table("avaliacoes").select("nota").eq("prestador_id", prestador_id).execute()
        
        notas = [av['nota'] for av in todas_av.data]
        total = len(notas)
        nova_media = sum(notas) / total if total > 0 else 0
        
        # 3. Atualiza o perfil do prestador com a nova nota
        supabase.table("usuarios").update({
            "media_nota": round(nova_media, 2),
            "total_avaliacoes": total
        }).eq("id", prestador_id).execute()
        
        return {"status": "sucesso", "nova_media": nova_media}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao avaliar: {str(e)}")

# ==========================================
# ROTA DE ADMIN: BANIR USUÁRIO
# ==========================================

@router.delete("/admin/usuarios/{usuario_id}")
def banir_usuario(usuario_id: str, admin_id: str):
    # 1. Verifica se quem deleta é Admin
    admin_check = supabase.table("usuarios").select("is_admin").eq("id", admin_id).execute()
    
    if not admin_check.data or not admin_check.data[0].get("is_admin"):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")

    # 2. Remove o usuário (tabela sem acento para evitar erros)
    try:
        supabase.table("usuarios").delete().eq("id", usuario_id).execute()
        return {"message": "Usuário banido com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao apagar: {str(e)}")