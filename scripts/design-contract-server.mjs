import { createServer } from "vite";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
export async function designServer() {
const server = await createServer({configFile:false, optimizeDeps:{entries:["scripts/fixtures/design-contract.tsx"],include:["react","react-dom/client","react/jsx-runtime","react/jsx-dev-runtime","hono/jsx/jsx-runtime"]}, server:{host:"127.0.0.1",port:0},plugins:[{name:"design-fixture",configureServer(s){s.middlewares.use("/__fonts", async(req,res)=>{try{const name=new URL(req.url,"http://fixture").pathname.slice(1);if(!/^[a-z-]+\.woff2$/.test(name))throw Error("font");res.setHeader("Content-Type","font/woff2");res.end(await readFile(resolve(process.env.DESIGN_FONT_DIR ?? "/home/drew/code/tangle-router/public/assets/fonts",name)));}catch{res.statusCode=404;res.end();}});s.middlewares.use("/design-contract",(_req,res)=>{res.setHeader("Content-Type","text/html");res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tangle design contract</title></head><body><div id="root"></div><script type="module" src="/scripts/fixtures/design-contract.tsx"></script></body></html>');});}}]});
await server.listen();
const url = server.resolvedUrls.local[0]+"design-contract";
return {server,url};
}
