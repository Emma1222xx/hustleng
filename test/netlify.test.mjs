import test from 'node:test';
import assert from 'node:assert/strict';
import { parameters } from '../db.mjs';
import marketplace,{config} from '../netlify/functions/marketplace.mjs';
test('SQL parameters remain bound and ordered',()=>assert.equal(parameters('SELECT * FROM tasks WHERE owner=? AND id=?'),'SELECT * FROM tasks WHERE owner=$1 AND id=$2'));
test('Netlify route and static CDN configuration',()=>{assert.deepEqual(config.path,['/','/*']);assert.equal(config.preferStatic,true)});
test('robots route runs without database access',async()=>{const response=await marketplace(new Request('https://example.test/robots.txt'),{ip:'192.0.2.1'});assert.equal(response.status,200);assert.match(await response.text(),/https:\/\/example\.test\/sitemap\.xml/);assert.equal(response.headers.get('x-content-type-options'),'nosniff')});
test('HEAD responses have no body',async()=>{const response=await marketplace(new Request('https://example.test/robots.txt',{method:'HEAD'}),{});assert.equal(response.status,200);assert.equal(await response.text(),'')});
