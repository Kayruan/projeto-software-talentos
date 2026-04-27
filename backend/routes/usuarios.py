from fastapi import APIRouter, HTTPException
from models import LoginRequest, RegistroRequest
from database import supabase

# Criamos um "mini-app" para as rotas de usuários
router = APIRouter()

# ==========================================
# ROTAS PÚBLICAS E DE AUTENTICAÇÃO
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

    novo_usuario = dados.dict()
    response = supabase.table("usuarios").insert(novo_usuario).execute()
    return response.data[0]


# ==========================================
# ROTAS DE AGENDAMENTO
# ==========================================

@router.post("/agendamentos")
def criar_agendamento(agendamento: dict):
    # Recebe os dados do agendamento (prestador_id, cliente_id, data_hora, descricao_servico)
    try:
        response = supabase.table("agendamentos").insert(agendamento).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao criar agendamento: {str(e)}")

@router.get("/agendamentos/prestador/{prestador_id}")
def listar_agenda_prestador(prestador_id: str): 
    try:
        # Busca os agendamentos e traz junto o nome e telefone do cliente que marcou
        response = supabase.table("agendamentos")\
            .select("*, usuarios!agendamentos_cliente_id_fkey(nome, telefone)")\
            .eq("prestador_id", prestador_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao buscar agenda: {str(e)}")


# ==========================================
# ROTAS DE ADMINISTRAÇÃO
# ==========================================

@router.delete("/admin/usuarios/{usuario_id}")
def deletar_usuario(usuario_id: str, admin_id: str):
    # 1. Busca os dados do usuário que está tentando fazer a exclusão
    check = supabase.table("usuarios").select("is_admin").eq("id", admin_id).execute()
    
    # 2. Verifica se a busca retornou algo e se ele realmente é um administrador
    if len(check.data) > 0 and check.data[0].get('is_admin') == True:
        try:
            response = supabase.table("usuarios").delete().eq("id", usuario_id).execute()
            return {"status": "sucesso", "message": "Usuário deletado com sucesso", "data": response.data}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Erro ao deletar: {str(e)}")
            
    # 3. Se não for administrador, barra a requisição com Erro 403
    raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores podem realizar esta ação.")

# ==========================================
# ROTAS DE PERFIL E AVALIAÇÃO
# ==========================================

@router.put("/perfil/{usuario_id}")
def editar_perfil(usuario_id: str, dados: dict):
    try:
        # Atualiza os dados do usuário no banco
        response = supabase.table("usuarios").update(dados).eq("id", usuario_id).execute()
        return {"status": "sucesso", "user": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar perfil: {str(e)}")

@router.post("/avaliar")
def avaliar_prestador(avaliacao: dict):
    try:
        # 1. Salva a nova avaliação
        supabase.table("avaliacoes").insert(avaliacao).execute()
        
        # 2. Busca todas as avaliações desse prestador para recalcular a média
        prestador_id = avaliacao['prestador_id']
        todas_av = supabase.table("avaliacoes").select("nota").eq("prestador_id", prestador_id).execute()
        
        notas = [av['nota'] for av in todas_av.data]
        total_avaliacoes = len(notas)
        nova_media = sum(notas) / total_avaliacoes if total_avaliacoes > 0 else 0
        
        # 3. Atualiza a nota média no perfil do prestador
        supabase.table("usuarios").update({
            "media_nota": round(nova_media, 2),
            "total_avaliacoes": total_avaliacoes
        }).eq("id", prestador_id).execute()
        
        return {"status": "sucesso", "nova_media": nova_media}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao avaliar: {str(e)}")