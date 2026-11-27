import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const base=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT||3000), dir=process.env.DATA_DIR||join(base,'data');
const origin=new URL(process.env.PUBLIC_ORIGIN||`http://localhost:${port}`).origin;
mkdirSync(dir,{recursive:true});
const db=new DatabaseSync(join(dir,'hustle.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,admin INTEGER NOT NULL DEFAULT 0,created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,uid INTEGER REFERENCES users(id),csrf TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY,owner INTEGER NOT NULL REFERENCES users(id),title TEXT NOT NULL,category TEXT NOT NULL,description TEXT NOT NULL,proof TEXT NOT NULL,reward INTEGER NOT NULL CHECK(reward>=10000),slots INTEGER NOT NULL CHECK(slots BETWEEN 1 AND 100),minutes INTEGER NOT NULL,deadline TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',fundref TEXT UNIQUE,created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS applications(id INTEGER PRIMARY KEY,task INTEGER NOT NULL REFERENCES tasks(id),worker INTEGER NOT NULL REFERENCES users(id),status TEXT NOT NULL DEFAULT 'claimed',proof TEXT,reason TEXT,dispute TEXT,payout TEXT NOT NULL DEFAULT 'none',payref TEXT UNIQUE,created TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(task,worker));
CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY,task INTEGER REFERENCES tasks(id),reporter INTEGER REFERENCES users(id),reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,actor INTEGER REFERENCES users(id),action TEXT NOT NULL,target INTEGER,detail TEXT,created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS tasks_status ON tasks(status,deadline); CREATE INDEX IF NOT EXISTS apps_worker ON applications(worker,status);
`);
const run=(s,...a)=>db.prepare(s).run(...a), one=(s,...a)=>db.prepare(s).get(...a), all=(s,...a)=>db.prepare(s).all(...a);
const token=()=>randomBytes(32).toString('hex'), digest=s=>createHash('sha256').update(s).digest('hex');
const hash=p=>{const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(p,salt,64).toString('hex')};
const verify=(p,h)=>{try{const [s,k]=h.split(':');return timingSafeEqual(scryptSync(p,s,64),Buffer.from(k,'hex'))}catch{return false}};
const tx=fn=>{db.exec('BEGIN IMMEDIATE');try{const r=fn();db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}};
if(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD){if(process.env.ADMIN_PASSWORD.length<14)throw Error('ADMIN_PASSWORD must be at least 14 characters');const email=process.env.ADMIN_EMAIL.trim().toLowerCase();const existing=one('SELECT admin FROM users WHERE email=?',email);if(existing&&!existing.admin)throw Error('Cannot elevate an existing public account through bootstrap');if(!existing)run('INSERT INTO users(name,email,password,admin) VALUES(?,?,?,1)','HustleNG Admin',email,hash(process.env.ADMIN_PASSWORD));}
const cats=['Data entry','Research & surveys','Website testing','Transcription','Creative tasks','Local research','Business support'];
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=k=>'₦'+(k/100).toLocaleString('en-NG',{maximumFractionDigits:2});
const today=()=>new Date().toISOString().slice(0,10);
const label=s=>s.replaceAll('_',' ');
const fail=(msg,status=400)=>{throw Object.assign(new Error(msg),{status})};
const field=(f,k,min,max)=>{const v=String(f.get(k)||'').trim();if(v.length<min||v.length>max)fail(`${k.replaceAll('_',' ')} must contain ${min}–${max} characters.`);return v};
const int=(f,k,min,max)=>{const v=Number(f.get(k));if(!Number.isInteger(v)||v<min||v>max)fail(`Invalid ${k}.`);return v};
const log=(u,action,id,detail='')=>run('INSERT INTO audit(actor,action,target,detail) VALUES(?,?,?,?)',u.id,action,id,detail);
function session(req,res){const raw=(req.headers.cookie||'').match(/(?:^|;\s*)hn_session=([a-f0-9]{64})(?:;|$)/)?.[1];let s=raw&&one('SELECT * FROM sessions WHERE id=? AND expires>?',digest(raw),Date.now());if(!s){return newSession(res,null)}return s;}
function newSession(res,uid){const raw=token(),s={id:digest(raw),uid,csrf:token(),expires:Date.now()+7*86400000};run('INSERT INTO sessions VALUES(?,?,?,?)',s.id,s.uid,s.csrf,s.expires);res.setHeader('Set-Cookie',`hn_session=${raw}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${origin.startsWith('https:')?'; Secure':''}`);return s;}
function redirect(res,url){res.writeHead(303,{Location:url});res.end()}
const csrf=s=>`<input type="hidden" name="csrf" value="${s.csrf}">`;
const hidden=(n,v)=>`<input type="hidden" name="${e(n)}" value="${e(v)}">`;
const form=(s,path,body,cls='')=>`<form class="${cls}" method="post" action="${path}">${csrf(s)}${body}</form>`;
const button=(t,cls='')=>`<button class="btn ${cls}" type="submit">${e(t)}</button>`;
const input=(n,t='text',extra='')=>`<input name="${n}" type="${t}" required ${extra}>`;
const area=(n,max=3000)=>`<textarea name="${n}" required maxlength="${max}" rows="4"></textarea>`;
const fld=(name,body)=>`<label class="field">${e(name)}${body}</label>`;
const badge=s=>`<span class="tag ${e(s)}">${e(label(s))}</span>`;
const empty=(t,d)=>`<div class="empty"><strong>${e(t)}</strong><p>${e(d)}</p></div>`;
const userOf=s=>s.uid?one('SELECT id,name,email,admin FROM users WHERE id=?',s.uid):null;
const nav=(u,s)=>`<header><div class="nav wrap"><a class="brand" href="/"><span class="mark">h<span>.</span></span>hustle<span class="brand-green">NG</span></a><nav><a href="/tasks">Explore tasks</a><a href="/post">Post a task</a><a href="/guide">How it works</a>${u?`<a href="/dashboard">Dashboard</a>${u.admin?'<a href="/admin">Admin</a>':''}${form(s,'/logout',button('Sign out','ghost'),'inline')}`:'<a href="/login">Sign in</a><a class="btn small" href="/register">Join free ↗</a>'}</nav></div></header>`;
function page(res,s,u,title,body,desc='Find meaningful micro-jobs and hire skilled people in Nigeria. Join free.',status=200,noindex=false){res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)} | HustleNG</title><meta name="description" content="${e(desc)}">${noindex?'<meta name="robots" content="noindex,nofollow">':''}<meta name="theme-color" content="#123b32"><link rel="stylesheet" href="/style.css"><link rel="icon" href="/icon.svg" type="image/svg+xml"><script src="/app.js" defer></script></head><body>${nav(u,s)}<main>${body}</main><footer><div class="wrap foot"><div><a class="brand" href="/">hustle<span class="brand-green">NG</span></a><p>Small tasks. Real money.<br>Built for everyday Nigerians.</p></div><div><a href="/guide">How it works</a><a href="/rules">Community rules</a><a href="/privacy">Privacy & beta terms</a></div><div><a href="/tasks">Browse tasks</a><a href="/post">Hire talent</a><span>© ${new Date().getFullYear()} HustleNG · Beta</span></div></div></footer></body></html>`)}
const taskSQL=`SELECT t.*,u.name employer,(SELECT count(*) FROM applications a WHERE a.task=t.id AND a.status!='cancelled') used FROM tasks t JOIN users u ON u.id=t.owner`;
const taskBy=id=>one(taskSQL+' WHERE t.id=?',id);
const card=t=>`<article class="task"><div class="between"><span class="tag">${e(t.category)}</span><span class="muted smalltext">Remote / Nigeria</span></div><h3><a href="/tasks/${t.id}">${e(t.title)}</a></h3><p>${e(t.description.slice(0,140))}${t.description.length>140?'…':''}</p><div class="taskmeta"><span>◷ ${t.minutes} min</span><span>${Math.max(0,t.slots-t.used)} slots left</span></div><div class="between taskbottom"><strong class="price">${money(t.reward)}</strong><a class="textlink" href="/tasks/${t.id}">View task ↗</a></div></article>`;
const header=(k,t,d)=>`<section class="sectionhead"><div class="wrap"><div class="eyebrow">${e(k)}</div><h1>${e(t)}</h1><p>${e(d)}</p></div></section>`;
const listOpen=()=>all(taskSQL+` WHERE t.status='open' AND t.deadline>=? AND (SELECT count(*) FROM applications a WHERE a.task=t.id AND a.status!='cancelled')<t.slots ORDER BY t.id DESC LIMIT 100`,today());
const examples=[['Website testing','Test a mobile checkout','₦1,000','15 min'],['Data entry','Organise a small spreadsheet','₦750','20 min'],['Research & surveys','Collect local market prices','₦1,500','30 min']];
const exampleCards=()=>examples.map(([c,t,r,m])=>`<article class="task example"><div class="between"><span class="tag">${c}</span><span class="muted smalltext">Example only</span></div><h3>${t}</h3><p>Illustration of a task category. Not an available paid job.</p><div class="taskmeta"><span>◷ ${m}</span></div><div class="taskbottom"><strong class="price">${r}</strong><span class="muted smalltext">Illustrative reward</span></div></article>`).join('');
