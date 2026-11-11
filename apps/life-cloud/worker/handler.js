// Auth is enforced by Sites dispatch and checked again on every data operation.
// R2's conditional puts provide atomic compare-and-swap across devices.
const MAX_BYTES=10*1024*1024;
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function createHandler({html,validate,defaults,csp}){
 return {async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/api/data'){
   const id=request.headers.get('oai-authenticated-user-id');
   if(!id)return json({error:'sign_in_required'},401);
   if(!env.BUCKET)return json({error:'storage_unavailable'},503);
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id));
   const objectKey='life/'+Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('')+'.json';
   try{
    if(request.method==='GET'){
     const object=await env.BUCKET.get(objectKey);
     return json({data:object?JSON.parse(await object.text()):{records:{},settings:{...defaults}},etag:object?.etag||'none'});
    }
    if(request.method!=='PUT')return json({error:'method_not_allowed'},405);
    // Same-origin requests only; no permissive CORS or publicly writable endpoints.
    if(request.headers.get('Origin')!==url.origin)return json({error:'origin_not_allowed'},403);
    if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))return json({error:'json_required'},415);
    if(Number(request.headers.get('Content-Length'))>MAX_BYTES)return json({error:'payload_too_large'},413);
    const reader=request.body?.getReader();if(!reader)return json({error:'empty_body'},400);
    const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BYTES){await reader.cancel();return json({error:'payload_too_large'},413)}chunks.push(value)}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
    let body,normalized;try{body=JSON.parse(new TextDecoder().decode(bytes));normalized=validate(body.data)}catch{return json({error:'invalid_records'},400)}
    if(typeof body.etag!=='string'||!body.etag||body.etag.length>100)return json({error:'revision_required'},400);
    const object=await env.BUCKET.put(objectKey,JSON.stringify(normalized),{onlyIf:body.etag==='none'?{etagDoesNotMatch:'*'}:{etagMatches:body.etag},httpMetadata:{contentType:'application/json'}});
    if(!object)return json({error:'revision_conflict'},409);
    return json({etag:object.etag});
   }catch{return json({error:'storage_temporarily_unavailable'},503)}
  }
  if(!['GET','HEAD'].includes(request.method))return json({error:'method_not_allowed'},405);
  if(url.pathname!=='/'&&url.pathname!=='/life.html')return new Response('Not found',{status:404});
  return new Response(request.method==='HEAD'?null:html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':csp,'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
 }};
}
