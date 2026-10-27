(()=>{
const script=document.currentScript;
const moduleKey=script.dataset.module;
const source=new URL("reset-action.js",script.src).href;
function mount(){
if(document.getElementById("bif-reset-v4"))return;
const root=document.createElement("div");root.id="bif-reset-v4";
root.style.cssText="position:fixed;right:12px;bottom:12px;z-index:2147483646;font:13px Arial,sans-serif;max-width:calc(100vw - 24px)";
const btn=document.createElement("button");btn.type="button";btn.textContent="Limpar registros deste módulo";
btn.style.cssText="background:#991b1b;color:#fff;border:0;border-radius:8px;padding:9px 12px;cursor:pointer;box-shadow:0 3px 12px #0005";
const panel=document.createElement("section");panel.hidden=true;
panel.style.cssText="box-sizing:border-box;background:white;color:#222;width:min(410px,calc(100vw - 24px));max-height:70vh;overflow:auto;padding:16px;border:1px solid #ddd;border-radius:10px;margin-bottom:8px;box-shadow:0 6px 22px #0005";
root.append(panel,btn);document.body.append(root);
btn.onclick=async()=>{
 panel.hidden=!panel.hidden;
 if(panel.hidden)return;
 panel.textContent="Carregando ferramentas de limpeza...";
 try{const mod=await import(source);mod.render(moduleKey,panel,()=>{panel.hidden=true});}
 catch(e){panel.textContent="Falha ao carregar: "+(e.message||String(e));}
};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();