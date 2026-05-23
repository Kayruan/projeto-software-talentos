from fastapi import APIRouter, HTTPException, UploadFile, File
from models import LoginRequest, RegistroRequest, AgendamentoRequest, AvaliacaoRequest, PerfilUpdate
from database import supabase

# Criamos o roteador principal
router = APIRouter()

# ==========================================
# 1. AUTENTICAÇÃO E REGISTRO
# ==========================================

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

    novo_usuario = dados.model_dump() 
    response = supabase.table("usuarios").insert(novo_usuario).execute()
    return response.data[0]

# ==========================================
# 2. GESTÃO DE PERFIL E PRESTADORES
# ==========================================

@router.get("/prestadores")
def listar_prestadores():
    response = supabase.table("usuarios").select("*").eq("tipo_conta", "prestador").execute()
    return response.data

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
# 3. SISTEMA DE AGENDAMENTOS E ORÇAMENTOS
# ==========================================

@router.post("/agendamentos")
def criar_agendamento(agenda: AgendamentoRequest):
    try:
        dados = agenda.model_dump()
        dados["status"] = "pendente"
        dados["valor_orcamento"] = 0.0 
        
        response = supabase.table("agendamentos").insert(dados).execute()
        return {"message": "Agendamento criado com sucesso!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao criar agendamento: {str(e)}")

@router.get("/agendamentos/prestador/{prestador_id}")
def listar_agenda_prestador(prestador_id: str): 
    try:
        response = supabase.table("agendamentos")\
            .select("*, cliente:usuarios!fk_cliente(nome, telefone)")\
            .eq("prestador_id", prestador_id)\
            .order("data_hora", desc=False)\
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao buscar agenda do prestador: {str(e)}")

@router.get("/agendamentos/cliente/{cliente_id}")
def listar_agenda_cliente(cliente_id: str):
    try:
        response = supabase.table("agendamentos")\
            .select("*, prestador:usuarios!prestador_id(nome, telefone)")\
            .eq("cliente_id", cliente_id)\
            .order("data_hora", desc=False)\
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao buscar agenda do cliente: {str(e)}")

@router.patch("/agendamentos/{agendamento_id}/status")
def atualizar_status_agendamento(agendamento_id: str, novo_status: str, valor_orcamento: float = None):
    try:
        dados_atualizacao = {"status": novo_status}
        
        if valor_orcamento is not None:
            dados_atualizacao["valor_orcamento"] = valor_orcamento
            
        response = supabase.table("agendamentos")\
            .update(dados_atualizacao)\
            .eq("id", agendamento_id)\
            .execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado.")
            
        return {"message": f"Status atualizado para {novo_status} com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar status: {str(e)}")

# ==========================================
# 4. AVALIAÇÕES E MÉDIAS (VERSÃO PREMIUM COM FOTO E TEXTO)
# ==========================================

@router.post("/avaliar")
async def avaliar_prestador(
    prestador_id: str = Form(...),
    cliente_id: str = Form(...),
    nota: int = Form(...),
    comentario: Optional[str] = Form(""),
    arquivo: Optional[UploadFile] = File(None) # A foto do serviço agora é opcional
):
    try:
        foto_url = ""

        # 1. Se o cliente anexou uma foto do serviço realizado, faz o upload para o Storage
        if arquivo:
            conteudo_foto = await arquivo.read()
            extensao = arquivo.filename.split(".")[-1]
            # Cria um nome único baseado no carimbo de tempo/ids para não sobrescrever
            nome_arquivo = f"av_{prestador_id}_{cliente_id}.{extensao}"
            
            # Envia o arquivo para a mesma pasta 'fotos-conectasul' que criamos
            supabase.storage.from_("fotos-conectasul").upload(
                path=nome_arquivo,
                file=conteudo_foto,
                file_options={"content-type": arquivo.content_type, "x-upsert": "true"}
            )
            # Pega o link público da foto gerada
            foto_url = supabase.storage.from_("fotos-conectasul").get_public_url(nome_arquivo)

        # 2. Monta o dicionário para salvar na tabela 'avaliacoes'
        dados_avaliacao = {
            "prestador_id": prestador_id,
            "cliente_id": cliente_id,
            "nota": nota,
            "comentario": comentario,
            "foto_url": foto_url
        }
        
        # Insere a avaliação completa no banco de dados
        supabase.table("avaliacoes").insert(dados_avaliacao).execute()
        
        # 3. Recalcula a média de estrelas em tempo real do prestador
        todas_av = supabase.table("avaliacoes").select("nota").eq("prestador_id", prestador_id).execute()
        
        notas = [av['nota'] for av in todas_av.data]
        total = len(notas)
        nova_media = sum(notas) / total if total > 0 else 0
        
        # 4. Atualiza o perfil do prestador com o novo score totalizado
        supabase.table("usuarios").update({
            "media_nota": round(nova_media, 2),
            "total_avaliacoes": total
        }).eq("id", prestador_id).execute()
        
        return {"status": "sucesso", "nova_media": nova_media, "foto_url": foto_url}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao registrar avaliação: {str(e)}")
    

@router.get("/avaliacoes/prestador/{prestador_id}")
def listar_avaliacoes_prestador(prestador_id: str):
    try:
        # Busca os comentários trazendo o nome do cliente que avaliou
        response = supabase.table("avaliacoes")\
            .select("*, cliente:usuarios!cliente_id(nome)")\
            .eq("prestador_id", prestador_id)\
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==========================================
# 5. ADMINISTRAÇÃO E MODERAÇÃO
# ==========================================

@router.delete("/admin/usuarios/{usuario_id}")
def banir_usuario(usuario_id: str, admin_id: str):
    admin_check = supabase.table("usuarios").select("is_admin").eq("id", admin_id).execute()
    if not admin_check.data or not admin_check.data[0].get("is_admin"):
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")

    try:
        supabase.table("usuarios").delete().eq("id", usuario_id).execute()
        return {"message": "Usuário banido com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao apagar: {str(e)}")

# ==========================================
# 6. UPLOAD DE FOTOS (STORAGE)
# ==========================================

@router.post("/perfil/{usuario_id}/upload-foto")
async def upload_foto_perfil(usuario_id: str, arquivo: UploadFile = File(...)):
    try:
        conteudo_arquivo = await arquivo.read()
        extensao = arquivo.filename.split(".")[-1]
        nome_arquivo = f"perfil_{usuario_id}.{extensao}"
        
        supabase.storage.from_("fotos-conectasul").upload(
            path=nome_arquivo,
            file=conteudo_arquivo,
            file_options={"content-type": arquivo.content_type, "x-upsert": "true"}
        )
        
        url_publica = supabase.storage.from_("fotos-conectasul").get_public_url(nome_arquivo)
        supabase.table("usuarios").update({"foto_url": url_publica}).eq("id", usuario_id).execute()
        
        return {"status": "sucesso", "foto_url": url_publica}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro no upload do arquivo: {str(e)}")