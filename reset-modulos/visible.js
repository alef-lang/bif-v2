(function(){
"use strict";
const script=document.currentScript, moduleKey=script.dataset.module;
const source=new URL("./reset.js",script.src).href;
function start(){
 if(document.getElementById("bif-reset-control-v3"))return;
 const root=document.createElement("div");root.id="bif-reset-control-v3";
 root.style.cssText="position:fixed;right:16px;bottom:16px;z-index:2147483600;font:13px Arial,sans-serif;max-width:calc(100vw - 32px)";
 const btn=document.createElement("button");btn.type="button";btn.textContent="Apagar dados deste módulo";
 btn.style.cssText="border:0;border-radius:9px;background:#9f1239;color:white;padding:10px 13px;cursor:pointer;box-shadow:0 3px 12px #0004";
 const panel=document.createElement("div");panel.hidden=true;
 panel.style.cssText="box-sizing:border-box;background:#fff;color:#222;border:1px solid #ddd;border-radius:10px;padding:15px;width:min(390px,calc(100vw - 32px));box-shadow:0 6px 24px #0004;margin-bottom:8px;max-height:65vh;overflow:auto";
 root.append(panel,btn);document.body.append(root);
 btn.onclick=async()=>{
   panel.hidden=!panel.hidden;if(panel.hidden)return;
   panel.textContent="Carregando informações deste módulo...";
   try{const api=await import(source);api.render(moduleKey,panel,()=>{panel.hidden=true});}
   catch(e){panel.textContent="Falha ao abrir a ferramenta: "+(e.message||e);}
 };
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();