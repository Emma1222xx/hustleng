import { handle } from '../../server.mjs';
export const config = { path: ['/', '/*'], preferStatic: true };
export default async function marketplace(request, context) {
  const url=new URL(request.url);
  const req={
    method:request.method==='HEAD'?'GET':request.method,
    url:url.pathname+url.search,
    headers:Object.fromEntries(request.headers),
    hustleOrigin:url.origin,
    socket:{remoteAddress:context?.ip||'unknown'},
    async *[Symbol.asyncIterator](){
      if(!request.body)return;
      for await(const chunk of request.body)yield Buffer.from(chunk);
    }
  };
  const headers=new Headers();
  let status=200,body=null;
  const res={
    headersSent:false,
    setHeader(name,value){headers.set(name,String(value));},
    writeHead(code,values={}){status=code;for(const [key,value] of Object.entries(values))headers.set(key,String(value));this.headersSent=true;return this;},
    end(value){body=value??null;this.headersSent=true;return this;}
  };
  try {
    await handle(req,res);
    return new Response(request.method==='HEAD'?null:body,{status,headers});
  } catch(error) {
    console.error('Marketplace request failed:',error.code||error.name);
    return new Response('HustleNG temporarily unavailable. Please retry.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
  }
}
