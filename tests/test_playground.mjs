import test from 'node:test';
import assert from 'node:assert/strict';
import {fileState,counts,graphLayout,effects,explain} from '../gitcraft/web/playground.mjs';
const copy=value=>structuredClone(value);
function fixture(){const graph={commits:[{id:'a',parents:[],message:'Start'}],refs:[{name:'refs/heads/main',target:'a'},{name:'refs/remotes/origin/main',target:'a'}]};const files={'schedule.md':{working:'A',staged:'A',committed:'A'},'accessibility.md':{working:'B',staged:'B',committed:'B'}};return{views:{you:{bare:false,head:'a',files,graph},origin:{bare:true,head:'a',graph:{commits:graph.commits,refs:[{name:'refs/heads/main',target:'a'}]}}}};}
test('a file can be edited again after preparation',()=>{
 assert.deepEqual(fileState({working:'C',staged:'B',committed:'A'}),{working:true,prepared:true,conflict:false,label:'Changed again'});
 assert.equal(fileState({working:'markers',staged:null,committed:'A'}).conflict,true);
});
test('bare shared repositories never imply working or prepared files',()=>{assert.deepEqual(counts({bare:true}),{working:0,prepared:0,conflicts:0});});
test('a merge graph retains both real parents in separate positions',()=>{
 const commits=[{id:'merge',parents:['left','right']},{id:'left',parents:['root']},{id:'right',parents:['root']},{id:'root',parents:[]}];
 const graph=graphLayout(commits);
 assert.deepEqual(graph.edges.filter(edge=>edge.from==='merge').map(edge=>edge.to),['left','right']);
 assert.notEqual(graph.positions.get('left').x,graph.positions.get('right').x);
 for(const edge of graph.edges)assert.ok(edge.end.y>edge.start.y);
});
test('graph truncation never invents a missing parent node',()=>{
 const graph=graphLayout([{id:'shown',parents:['not-shown']}]);assert.equal(graph.positions.size,1);assert.equal(graph.edges.length,0);
});
test('editing is separate from preparing, committing and sharing',()=>{
 const before=fixture(),after=copy(before);after.views.you.files['schedule.md'].working='C';
 assert.deepEqual(effects(before,after,'you'),{working:true,prepared:false,history:false,shared:false});
 assert.match(explain(before,after,'you','edit'),/prepared version and saved snapshots stayed the same/);
});
test('fetching a remote reference does not claim that files changed',()=>{
 const before=fixture(),after=copy(before);after.views.you.graph.refs[1].target='sam';
 assert.deepEqual(effects(before,after,'you'),{working:false,prepared:false,history:true,shared:false});
 assert.match(explain(before,after,'you','fetch'),/did not change your working files/);
});
test('publishing a different shared branch is visible even when shared main stays put',()=>{
 const before=fixture(),after=copy(before);after.views.origin.graph.refs.push({name:'refs/heads/idea',target:'new'});
 assert.equal(after.views.origin.head,before.views.origin.head);assert.equal(effects(before,after,'you').shared,true);
 assert.match(explain(before,after,'you','push'),/reached Shared/);
});
