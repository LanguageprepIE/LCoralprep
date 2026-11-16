'use strict';
(async()=>{
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),60000);
 try{
 const res=await fetch('https://deploy-preview-27--lcorals.netlify.app/.netlify/functions/gemini',{
   method:'POST',
   headers:{'Content-Type':'application/json','X-LCorals-Age-Band':'18-plus'},
   body:JSON.stringify({contents:[{parts:[{text:'You are a Spanish study tutor. Respond with one brief, safe, age-appropriate Spanish sentence about the weather. No explanation or personal details.'}]}]}),
   signal:controller.signal
 });
 const body=await res.json();
 const provider=res.headers.get('x-lcorals-provider');
 const code=body?.error?.code||null;
 console.log('SAFETY_PREVIEW_SMOKE',JSON.stringify({status:res.status,provider,code,hasReply:Boolean(body?.candidates?.[0]?.content?.parts?.[0]?.text)}));
 if(res.status!==200||provider!=='openai-luna'||!body?.candidates?.[0]?.content?.parts?.[0]?.text)process.exitCode=1;
 }catch(e){console.log('SAFETY_PREVIEW_SMOKE_ERROR',String(e.message||e).slice(0,120));process.exitCode=1}
 finally{clearTimeout(timer)}
})();
