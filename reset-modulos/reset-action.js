
import {getApps,initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getAuth,EmailAuthProvider,reauthenticateWithCredential} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {getDatabase,ref,get,update} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
const CFG={"apiKey": "AIzaSyDY_69KizkBQj3IoJuTS2F-Slu1tqkCjlQ", "authDomain": "bif-v2-94b2c.firebaseapp.com", "databaseURL": "https://bif-v2-94b2c-default-rtdb.firebaseio.com", "projectId": "bif-v2-94b2c", "storageBucket": "bif-v2-94b2c.firebasestorage.app", "messagingSenderId": "863302060084", "appId": "1:863302060084:web:f9da9098fe6ca0a71e2261"},REMOTE={"tarefas/tarefas.html": ["bif_tarefas_fiscal/tasks"], "tarefas/mapa.html": [], "apoio/apoio.html": ["apoio_escrituracao"], "atendimento/atendimento.html": ["atendimento_cliente"], "controleguias/controle-guias.html": ["guias"], "cultura-clima/cultura-clima-bif.html": [], "documentos/documentos.html": ["documentos"], "manuaisext/manuais.html": ["manuais_ext_docs"], "obrigacoes/obrigacoes.html": ["obrigacoes", "obrigacoes_anexos"], "portal/portal.html": ["pop_hub/registros"], "procedimentos/pop.html": [], "ferramentas/calculadora-simples.html": ["calculadora_simples"], "indicadores/indicadores-principal-com-sped.html": ["bif_kpi_numeros_v2/dados"], "leitura-org/leitura-organizacional-bif.html": [], "planos/index-planos.html": [], "processos/portal_pedido_emissao_nota.html": [], "recebimento/recebimento.html": ["bif_controle_recebimento_movimentos"], "arquivo/arquivo.html": [], "kanban/kanban.html": [], "anotacoes/anotacoes.html": [], "painel/painel.html": []},LOCAL={"tarefas/tarefas.html": ["fiscal_tasks", "fiscal_exp", "fiscal_pts", "fiscal_recovery_flags", "fiscal_last_save", "fiscal_task_draft", "fiscal_cloud_backup_before_priorizacao_v5"], "tarefas/mapa.html": ["bif_mapa_calendar_view"], "atendimento/atendimento.html": ["bif_atendimento_cliente_v1"], "controleguias/controle-guias.html": ["bifGuias"], "obrigacoes/obrigacoes.html": ["bifObrigacoes"], "procedimentos/pop.html": ["hub-pop-fiscal-v2"], "ferramentas/calculadora-simples.html": ["snAliquotaManager.v1"], "arquivo/arquivo.html": ["bif_gestao_arquivo_alef_v1"], "kanban/kanban.html": ["bif_criatividade_alef_state_v1"], "anotacoes/anotacoes.html": ["bif_anotacoes_tdah_v1"], "recebimento/recebimento.html": ["bif_controle_recebimento_movimentos_v1"], "processos/portal_pedido_emissao_nota.html": ["pedidoNota_draft_v1"], "indicadores/monitor_reforma_tributaria.html": ["monitor_reforma_tributaria_v2"], "indicadores/controle_ciap.html": ["controle_ciap_v1"], "comunicacao/comunicacao.html": ["bif_comunicacao_modelos_v1"], "conhecimento/elicitacao.html": ["bif_elicitacao_modules_v1"], "conhecimento/faq.html": ["bif_faq_base_v1"], "processos/gestao_implantacao_empresas.html": ["implantacao_empresas_v1"]};
const UID="lUChAjAb3jbzjZ834JPhjcEgyrO2";
const RESERVED=["colaboradores","painel","configuracoes","usuarios","users","pop_hub/categorias"];
function add(parent,tag,txt){const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;parent.appendChild(e);return e;}
function safePath(path){
 if(!path||path.startsWith("/")||path.split("/").some(x=>!x||x==="."||x===".."))return false;
 return !RESERVED.some(r=>r===path||r.startsWith(path+"/")||path.startsWith(r+"/"));
}
function countLocal(keys){return keys.filter(k=>localStorage.getItem(k)!==null)}
export function render(key,panel,close){
 panel.replaceChildren();
 add(panel,"strong","Limpeza por módulo — Firebase e navegador");
 const remote=REMOTE[key]||[],local=LOCAL[key]||[];
 add(panel,"p","Firebase: "+(remote.length?remote.join(", "):"nenhum caminho independente validado"));
 add(panel,"p","LocalStorage: "+(local.length?local.join(", "):"nenhuma chave exclusiva identificada"));
 const existing=countLocal(local);
 add(panel,"p",existing.length+" chave(s) local(is) com dados neste navegador.");
 const info=add(panel,"p","A exclusão do Firebase exige autorização das regras do banco. A limpeza local não altera o Firebase nem outros navegadores.");
 const status=add(panel,"p");status.setAttribute("role","status");status.style.cssText="white-space:pre-wrap;color:#7f1d1d";
 const password=add(panel,"input");password.type="password";password.placeholder="Senha do seu login Firebase";password.autocomplete="current-password";
 const confirm=add(panel,"input");confirm.placeholder="Digite APAGAR";
 for(const e of [password,confirm])e.style.cssText="box-sizing:border-box;width:100%;padding:9px;margin:5px 0;border:1px solid #bbb;border-radius:5px;background:white;color:#222";
 const check=add(panel,"button","Verificar Firebase");check.type="button";
 const cloud=add(panel,"button","Apagar Firebase + local");cloud.type="button";
 const only=add(panel,"button","Apagar somente local");only.type="button";
 const cancel=add(panel,"button","Fechar");cancel.type="button";cancel.onclick=close;
 for(const b of [check,cloud,only,cancel])b.style.cssText="padding:9px;margin:5px 5px 0 0;border:1px solid #ccc;border-radius:6px;cursor:pointer";
 cloud.style.background="#991b1b";cloud.style.color="#fff";
 function verify(){if(confirm.value!=="APAGAR")throw Error("Digite APAGAR para confirmar.");}
 async function identity(){
 const app=getApps().find(a=>a.name==="[DEFAULT]")||initializeApp(CFG);
 if(app.options.projectId!==CFG.projectId)throw Error("Firebase conectado ao projeto "+app.options.projectId+"; esperado "+CFG.projectId);
 const auth=getAuth(app);await auth.authStateReady();
 const user=auth.currentUser;
 if(!user)throw Error("Firebase Auth sem usuário nesta sessão. Faça login novamente.");
 if(user.uid!==UID)throw Error("UID autenticado "+user.uid+" não é o UID autorizado para reset.");
 if(!user.email)throw Error("Conta sem e-mail para confirmar senha.");
 await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,password.value));
 return getDatabase(app);
 }
 function clearLocal(){
 const removed=[];
 for(const k of local){if(localStorage.getItem(k)!==null){localStorage.removeItem(k);removed.push(k);}}
 return removed;
 }
 check.onclick=async()=>{
 check.disabled=true;status.textContent="Verificando conta e permissões...";
 try{
 const db=await identity();
 const details=[];
 for(const p of remote){if(!safePath(p))throw Error("Caminho protegido: "+p);const snap=await get(ref(db,p));details.push(p+": "+(snap.exists()?"há registros":"vazio"));}
 status.textContent="Autenticação confirmada.\n"+(details.join("\n")||"Sem caminho remoto configurado.");
 }catch(e){status.textContent="Diagnóstico: "+(e.message||String(e));}
 finally{check.disabled=false;}
 };
 cloud.onclick=async()=>{
 try{verify();if(!remote.length)throw Error("Não existe caminho Firebase exclusivo validado para esta página. Use somente a limpeza local, se aplicável.");}
 catch(e){status.textContent=e.message;return;}
 cloud.disabled=true;status.textContent="Autenticando e verificando caminhos...";
 try{
 const db=await identity();
 for(const p of remote){if(!safePath(p))throw Error("Caminho protegido: "+p);
 for(const [other,paths] of Object.entries(REMOTE)){if(other!==key&&paths.some(q=>p===q||p.startsWith(q+"/")||q.startsWith(p+"/")))throw Error("Caminho compartilhado: "+p);}
 await get(ref(db,p));
 }
 // Single atomic multi-location update: all targeted Firebase paths removed together or none.
 const updates=Object.fromEntries(remote.map(p=>[p,null]));
 await update(ref(db),updates);
 const removed=clearLocal();
 status.textContent="Exclusão confirmada no Firebase.\nLocalStorage removido: "+removed.length+" chave(s).\nAtualize a página.";
 password.value="";confirm.value="";
 }catch(e){status.textContent="Nenhuma limpeza local foi feita. Firebase não confirmado: "+(e.message||String(e));}
 finally{cloud.disabled=false;}
 };
 only.onclick=async()=>{
 try{verify();if(!local.length)throw Error("Sem chaves locais exclusivas identificadas.");
 const db=await identity(); // still require admin reauthentication even for local cleanup
 const removed=clearLocal();status.textContent="LocalStorage removido: "+removed.length+" chave(s). Firebase não foi alterado. Atualize a página.";
 password.value="";confirm.value="";
 }catch(e){status.textContent="Limpeza local não executada: "+(e.message||String(e));}
 };
}
