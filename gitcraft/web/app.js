import {fileState,counts,shortRef,graphLayout,explain,helpTopics,commandCatalog,compareWorkspaces} from '/playground.mjs';

const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={you:'Your workspace',sam:'Sam’s workspace',origin:'Shared'};
let token,state,actor='you',file='README.md',version='working',snapshot=null,busy=false,previewOpen=false;
let drafts={};
const transcripts={you:'',sam:'',origin:''},commandHistory={you:[],sam:[],origin:[]};
let historyCursor=0;
let commandError='';
let compareBranch='main';
function closeComparison(focus=false){
 $('compare-panel').hidden=true;$('compare-toggle').setAttribute('aria-expanded','false');
 for(const element of document.querySelectorAll('.editor-panel,.console-panel,.files-panel'))element.inert=false;
 if(focus)$('compare-toggle').focus();
}
function renderComparison(){
 if($('compare-panel').hidden||!state)return;
 const comparison=compareWorkspaces(state.views,compareBranch);compareBranch=comparison.branch;
 $('compare-branch').innerHTML=comparison.branches.map(branch=>`<option value="${esc(branch)}">${esc(branch)}</option>`).join('');$('compare-branch').value=compareBranch;
 const labels={you:'Your workspace',sam:'Sam’s workspace',origin:'Shared'};
 const relation={same:'Same commit as Shared',different:'Different commit from Shared',unpublished:'Not published to Shared',missing:'No branch here'};
 const memory={same:'Matches Shared now',different:'Differs from Shared now',unknown:'No remembered ref',removed:'Branch is no longer on Shared'};
 const commit=entry=>`<strong>${esc(entry.message)}</strong>${entry.id?`<code>${esc(entry.id.slice(0,7))}</code>`:''}`;
 $('compare-content').innerHTML=`<p class="compare-summary">${esc(comparison.summary)}</p><div class="compare-table-wrap"><table class="compare-table"><caption>Saved branch positions · ${esc(compareBranch)}</caption><thead><tr><th scope="col">State</th>${comparison.copies.map(copy=>`<th scope="col">${labels[copy.actor]}</th>`).join('')}</tr></thead><tbody><tr><th scope="row">Latest commit</th>${comparison.copies.map(copy=>`<td>${commit(copy.commit)}<span class="compare-relation">${copy.actor==='origin'?'Published here':relation[copy.relation]}</span></td>`).join('')}</tr><tr><th scope="row">Remembered Shared<br><small>origin/${esc(compareBranch)}</small></th>${comparison.copies.map(copy=>`<td>${copy.actor==='origin'?'<span>Shared has no local copy to refresh.</span>':`${copy.remembered.id?`<code>${esc(copy.remembered.id.slice(0,7))}</code>`:''}<span>${memory[copy.memory]}</span>`}</td>`).join('')}</tr></tbody></table></div><section class="compare-working"><h3>Uncommitted work</h3><p>These belong to each person’s current checkout. Saving or staging them does not publish them.</p>${comparison.copies.filter(copy=>copy.actor!=='origin').map(copy=>{const current=state.views[copy.actor],draftCount=Object.keys(current.files).filter(name=>{const key=[state.lessonId,copy.actor,current.branch,name].join(':');return Object.hasOwn(drafts,key)&&drafts[key]!==current.files[name].working;}).length;return `<div class="compare-person"><h4>${labels[copy.actor]} <span>on ${esc(copy.branch||'detached HEAD')}</span></h4>${copy.files.length?`<ul>${copy.files.map(file=>`<li><code>${esc(file.name)}</code><span>${file.conflict?'Merge needs resolution':[file.working?'Unstaged edits':'',file.staged?'Staged content':''].filter(Boolean).join(' · ')}</span></li>`).join('')}</ul>`:'<p>No saved file changes.</p>'}${draftCount?`<p class="compare-draft">${draftCount} unsaved browser draft${draftCount===1?'':'s'} · Git cannot see ${draftCount===1?'it':'them'} yet.</p>`:''}</div>`;}).join('')}<p class="compare-shared-note">Shared stores commits. It has no working files or staging area.</p></section>`;
 const region=$('compare-content').querySelector('.compare-table-wrap');region.tabIndex=0;region.setAttribute('role','region');region.setAttribute('aria-label','Saved branch positions. Scroll horizontally to compare all workspaces.');
 const hint=document.createElement('p');hint.className='compare-scroll-note';hint.textContent='Scroll sideways to compare all three copies.';region.before(hint);
}
function openComparison(){
 if(!state||busy)return;
 toggleHistory(false);$('help-panel').hidden=true;$('help-toggle').setAttribute('aria-expanded','false');
 $('workspace').classList.remove('files-open');$('files-toggle').setAttribute('aria-expanded','false');closeActionPanel();
 $('compare-panel').hidden=false;$('compare-toggle').setAttribute('aria-expanded','true');
 for(const element of document.querySelectorAll('.editor-panel,.console-panel,.files-panel'))element.inert=true;
 renderComparison();$('compare-heading').focus({preventScroll:true});
}
function suggestCommand(command){$('command').value=command;$('command').focus();$('command-effect').textContent='Suggested command only. Read it, edit it if needed, then press Enter to execute.';}
try{drafts=JSON.parse(localStorage.getItem('gitcraft-playground-drafts')||'{}');if(!drafts||typeof drafts!=='object'||Array.isArray(drafts))drafts={};}catch{drafts={};}
for(const [key,value] of Object.entries(drafts))if(typeof value!=='string'||value.length>8192)delete drafts[key];
const view=()=>state.views[actor];
const projectFiles=()=>Object.keys(state.views.you.files);
const draftKey=()=>[state.lessonId,actor,view().branch,file].join(':');
function rememberDrafts(){try{localStorage.setItem('gitcraft-playground-drafts',JSON.stringify(drafts));}catch{/* Editing still works without browser storage. */}}
function hasDraft(){return !view().bare&&Object.hasOwn(drafts,draftKey())&&drafts[draftKey()]!==view().files[file].working;}
function feedback(text){$('feedback').textContent=text;}
function restoreControls(){
 document.querySelectorAll('#workspace button,#workspace input,#workspace select,#workspace textarea,#actors button,#project,.project-actions select,#action-panel button,#action-panel input,#action-panel select').forEach(el=>{el.disabled=busy;});
 if(!state)return;
 $('undo').disabled=busy||!state.canUndo;
 const bare=view().bare,total=counts(view());
 for(const id of ['quick-edit','new-branch','branch','share-toggle'])$(id).disabled=busy||bare;
 $('commit').disabled=busy||bare||!total.prepared||!!total.conflicts;
 $('command').disabled=busy||bare;$('run-command').disabled=busy||bare;
 $('drawer-preview').disabled=busy||bare||!!snapshot||version!=='working';
 document.querySelectorAll('[data-reference-example]').forEach(button=>{button.disabled=busy||bare;});
 if(!$('inspector').hidden)applyEditorControls();
}
function setBusy(value){busy=value;$('workspace').setAttribute('aria-busy',String(value));$('run-command').textContent=value?'Working…':'Run command';restoreControls();}
async function api(path,body){
 if(busy)return null;
 const focusId=document.activeElement?.id;setBusy(true);
 try{
  const response=await fetch(path,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','X-Gitcraft-Token':token},body:JSON.stringify(body)});
  const result=await response.json();
  if(result.token)token=result.token;
  if(result.state){state=result.state;if(!state.views[actor])actor='you';}
  if(!response.ok){
   const error=(result.error||'The operation could not be confirmed.').replace('Open Command reference for supported forms.','Open Commands in the top navigation for supported forms.');
   if(path==='/api/command')commandError=error;
   // An operation may have partially run. Inspect; never automatically retry it.
   if(response.status!==403){const sync=await fetch('/api/state');if(sync.ok){const actual=await sync.json();state=actual.state;token=actual.token;if(!state.views[actor])actor='you';}}
   render();
   feedback(response.status===403?'Refresh to reconnect to this local playground.':error+' You can inspect the files or use Undo.');
   return null;
  }
  return result;
 }catch{
  feedback('The connection was interrupted. Refresh to inspect the actual project before retrying. Your browser editor drafts are kept.');
  return null;
 }finally{setBusy(false);if(focusId&&document.activeElement===document.body)$(focusId)?.focus();}
}
function appendOutput(command,result){let entry=`${actor}@${view().branch||'shared'} $ ${command}\n${result.output||'(No output)'}`;if(result.code)entry+=`\nExit code: ${result.code}`;transcripts[actor]=(transcripts[actor]+'\n\n'+entry).trim().slice(-40000);$('output').textContent=transcripts[actor];$('output').scrollTop=$('output').scrollHeight;}
function requireSavedDraft(){if(hasDraft()){feedback('Save your editor draft first, so Git uses the file version you can see.');$('save-file').focus();return false;}return true;}
async function runGit(command,kind='command'){
 commandError='';
 const inspection=/^git\s+(status|diff|log|show|remote)(\s|$)/.test(command)||/^git branch(?: -vv)?$/.test(command);
 if(!inspection&&!requireSavedDraft())return;
 const started=performance.now();
 const before=state,active=actor,result=await api('/api/command',{actor,command});
 $('command-timing').textContent=Math.round(performance.now()-started)+' ms';
 if(!result){if(commandError){appendOutput(command,{output:commandError,code:1});$('command-effect').textContent=commandError;}return;}
 appendOutput(command,result);render();
 const intent={add:'stage',restore:'unstage',switch:/ -c /.test(command)?'branch':'switch'}[kind]||kind;
 let explanation=explain(before,state,active,intent,result.code);
 if(result.code===0&&kind==='status'){const total=counts(view());explanation=`${total.working} file(s) have unstaged edits; ${total.prepared} have staged changes. Status only inspected this workspace. Use git diff to review edits.`;}
 if(result.code===0&&kind==='diff')explanation=`This compares ${/--staged|--cached/.test(command)?'the staging area with the last commit':'saved working files with the staging area'}. + marks added lines; - marks removed lines. No files changed.`;
 if(result.code===0&&kind==='log')explanation='These are commits known in this workspace. Each has an identifier and message. Reading history did not change files or fetch shared work.';
 feedback(explanation);$('command-effect').textContent=explanation;
 return result;
}
async function saveContent(content,name=file){
 const before=state,active=actor,result=await api('/api/edit',{actor,file:name,content});
 if(!result)return false;
 if(name===file){delete drafts[draftKey()];rememberDrafts();}
 render();feedback(explain(before,state,active,'edit'));
 return true;
}
function renderFiles(){
 const current=view(),total=counts(current);
 $('file-tabs').innerHTML=projectFiles().map(name=>`<button data-tab-file="${name}" aria-pressed="${file===name}">${name}${!current.bare&&(fileState(current.files[name]).working||fileState(current.files[name]).prepared)?' ·':''}</button>`).join('');
 $('repo-summary').textContent=current.bare?'Shared repository · no working files':`${current.branch} · ${total.working} unstaged · ${total.prepared} staged · ${current.graph.commits.length} known commits`;
 $('files').innerHTML=current.bare?'<p class="empty">Shared stores snapshots. Open History to inspect one.</p>':projectFiles().map(name=>{
  const status=fileState(current.files[name]);
  return `<div class="file-row ${status.working||status.prepared?'changed':''} ${status.conflict?'conflict':''}"><button class="file-open" data-file="${name}" aria-pressed="${!$('inspector').hidden&&!snapshot&&file===name}"><span>${name}</span><small>${status.label}</small></button>${status.working?`<button class="file-action" data-stage="${name}">${status.conflict?'Resolve command…':'Stage command…'}</button>`:''}</div>`;
 }).join('');
 $('prepared').innerHTML=current.bare?'<p class="empty">Choose a person’s workspace to prepare files.</p>':projectFiles().filter(name=>fileState(current.files[name]).prepared).map(name=>`<div class="prepared-file"><span>${name}</span><button data-unstage="${name}" aria-label="Unprepare ${name}">Unprepare</button></div>`).join('')||'<p class="empty">Nothing prepared yet.</p>';
 $('commit-note').textContent=total.conflicts?'Resolve the highlighted file before saving the combined snapshot.':total.prepared?'A snapshot saves prepared content, not every edit.':'Prepare a changed file to save a snapshot.';
 $('flow').innerHTML=current.bare?'<span>Shared repository</span><strong>Snapshots and branch names, without a working folder.</strong>':`<button class="text-button ${total.working?'active':''}" data-flow="files"><strong>Your files</strong><span>${total.working} unprepared change${total.working===1?'':'s'}</span></button><span class="flow-arrow" aria-hidden="true">→</span><button class="text-button ${total.prepared?'active':''}" data-flow="prepared"><strong>Prepared</strong><span>${total.prepared} file${total.prepared===1?'':'s'}</span></button><span class="flow-arrow" aria-hidden="true">→</span><span><strong>Known snapshots</strong>${current.graph.commits.length}${current.graph.truncated?'+':''} saved version${current.graph.commits.length===1?'':'s'}</span>`;
}
function renderGraph(){
 const current=view(),commits=current.graph.commits,layout=graphLayout(commits);
 const graph=$('graph'),width=Math.max(layout.width,$('canvas').clientWidth-24),offset=(width-layout.width)/2;
 graph.style.width=width+'px';graph.style.height=layout.height+'px';graph.replaceChildren();
 const paths=layout.edges.map(edge=>{const a={x:edge.start.x+offset,y:edge.start.y},b={x:edge.end.x+offset,y:edge.end.y};return `<path class="graph-edge" d="M${a.x},${a.y+14} C${a.x},${a.y+60} ${b.x},${b.y-60} ${b.x},${b.y-15}"/>`;}).join('');
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('width',width);svg.setAttribute('height',layout.height);svg.setAttribute('aria-hidden','true');svg.innerHTML=paths;graph.append(svg);
 for(const commit of commits){
  const node=document.createElement('button'),point=layout.positions.get(commit.id),refs=current.graph.refs.filter(ref=>ref.target===commit.id);
  const isHead=commit.id===current.head;
  node.className='commit-node'+(isHead?' current':'')+(snapshot?.commit===commit.id?' selected':'');
  node.style.left=(point.x+offset-17)+'px';node.style.top=(point.y-17)+'px';node.dataset.commit=commit.id;
  node.setAttribute('aria-label',`Inspect snapshot ${commit.id.slice(0,7)}: ${commit.message}, by ${commit.author}${isHead?', current HEAD':''}${refs.length?', branches '+refs.map(ref=>shortRef(ref.name)).join(', '):''}`);
  node.setAttribute('aria-pressed',String(snapshot?.commit===commit.id));
  node.innerHTML=`<span class="commit-labels">${isHead?'<span class="ref-tag head">HEAD</span>':''}${refs.map(ref=>`<span class="ref-tag ${ref.name.startsWith('refs/remotes/')?'remote':''}">${esc(shortRef(ref.name))}</span>`).join('')}</span><span class="commit-circle" aria-hidden="true"></span><span class="commit-message">${esc(commit.message)}</span><span class="commit-meta">${commit.id.slice(0,7)} · ${esc(commit.author)}</span>`;
  graph.append(node);
 }
 $('graph-text').innerHTML='<ol>'+commits.map(commit=>`<li><strong>${esc(commit.message)}</strong> (${commit.id.slice(0,7)}), by ${esc(commit.author)}. ${commit.parents.length?'Parents: '+commit.parents.map(id=>id.slice(0,7)).join(', '):'Starting snapshot.'} ${current.graph.refs.filter(ref=>ref.target===commit.id).map(ref=>esc(shortRef(ref.name))).join(', ')}</li>`).join('')+'</ol>'+(current.graph.truncated?'<p>Showing the 60 most recent known snapshots.</p>':'');
}
function render(){
 if(!state.views[actor])actor='you';
 if(!projectFiles().includes(file))file=projectFiles()[0];
 const current=view();$('project').value=state.mission;
 $('compare-toggle').hidden=!state.views.sam||!state.views.origin;
 document.querySelectorAll('[data-actor]').forEach(button=>{button.hidden=!state.views[button.dataset.actor];button.setAttribute('aria-pressed',String(button.dataset.actor===actor));});
 $('workspace-note').textContent=current.bare?'Lab observation: the actual shared repository.':actor==='sam'?'Sam’s independent copy. Your copy stays separate.':'Your independent copy. Shared changes arrive only when you fetch.';
 const branches=current.graph.refs.filter(ref=>ref.name.startsWith('refs/heads/')).map(ref=>shortRef(ref.name));
 $('branch').innerHTML=branches.map(branch=>`<option value="${esc(branch)}">${esc(branch)}</option>`).join('');$('branch').value=current.branch;
 $('branch-description').textContent=current.bare?'Shared is a bare repository, with no working folder.':`Viewing ${names[actor].toLowerCase()} on ${current.branch||'detached HEAD'}.`;
 $('prompt').textContent=actor+':'+(current.branch||'shared')+' $';$('loading').hidden=true;
 if(snapshot&&!current.graph.commits.some(commit=>commit.id===snapshot.commit)){snapshot=null;version='working';}
 renderFiles();if(!$('history-panel').hidden)renderGraph();
 if(!$('inspector').hidden)renderInspector();
 renderComparison();
 const output=transcripts[actor];$('output').textContent=output||'Your terminal is ready. Type git status and press Enter.\nThis runs native Git in the selected practice repository.';
 restoreControls();
}
function applyEditorControls(){
 if(!view().bare&&!view().files[file])return;
 const editing=!snapshot&&version==='working'&&!view().bare;
 $('source').readOnly=!editing;$('save-file').hidden=!editing;
 $('source').disabled=busy;$('save-file').disabled=busy||!hasDraft();
}
function renderInspector(){
 const current=view();
 $('inspector-title').textContent=snapshot?'Snapshot '+snapshot.commit.slice(0,7):current.bare?'Shared repository':file;
 $('close-inspector').hidden=!snapshot&&version==='working';
 $('snapshot-info').hidden=!snapshot;$('compare-versions').hidden=!!snapshot||current.bare;
 if(snapshot){const node=current.graph.commits.find(commit=>commit.id===snapshot.commit);$('snapshot-info').textContent=(node?.message||'Saved snapshot')+' · '+(node?.author||'');}
 document.querySelectorAll('[data-version]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.version===version)));
 const actual=snapshot?snapshot.files[file]:current.bare?'':current.files[file][version];
 const text=!current.bare&&!snapshot&&version==='working'&&Object.hasOwn(drafts,draftKey())?drafts[draftKey()]:actual;
 $('source').value=text??'No single prepared version. Resolve the merge in the working file.';
 $('version-note').textContent=snapshot?'Read-only snapshot. Choose Working files to return to your own edits.':current.bare?'Shared has no working folder. Open History and select a snapshot to read its files.':version==='working'?'Edit the file yourself. Save it, then prepare the changes you want to keep.':version==='staged'?'The prepared copy Git would save next. Later working edits do not change it.':'The version already saved in the current commit.';
 $('draft-note').textContent=hasDraft()&&!snapshot&&version==='working'?'Unsaved browser draft':'Saved file';
 updateLineNumbers();applyEditorControls();renderPreview();
}
function updateLineNumbers(){
 $('line-numbers').textContent=Array.from({length:$('source').value.split('\n').length},(_,i)=>i+1).join('\n');
 $('line-numbers').scrollTop=$('source').scrollTop;
}
let previewKey='';
function renderPreview(force=false){
 const allowed=previewOpen&&!view().bare&&!snapshot&&version==='working';
 $('preview-pane').hidden=!allowed;
 $('editor-workarea').classList.toggle('with-preview',allowed);
 if(!allowed)return;
 const key=JSON.stringify([state.lessonId,actor,view().files['index.html'].working,view().files['styles.css'].working]);
 if(force||key!==previewKey){previewKey=key;$('site-preview').src='/preview/'+actor+'/index.html?v='+Date.now();}
}
function toggleHistory(open){
 if(open)closeComparison();
 if(open){$('help-panel').hidden=true;$('help-toggle').setAttribute('aria-expanded','false');}
 $('history-panel').hidden=!open;$('history-toggle').setAttribute('aria-expanded',String(open));
 if(open)renderGraph();
}
function openFile(name){
 if(view().bare)return;
 file=name;version='working';snapshot=null;$('help-panel').hidden=true;$('help-toggle').setAttribute('aria-expanded','false');$('inspector').hidden=false;
 $('workspace').classList.remove('files-open');$('files-toggle').setAttribute('aria-expanded','false');renderFiles();renderInspector();$('source').focus({preventScroll:true});
}
function closeInspector(){snapshot=null;version='working';if(state){$('inspector').hidden=false;renderFiles();renderInspector();}}
async function inspectCommit(id){
 const result=await api('/api/snapshot',{actor,commit:id});if(!result)return;
 snapshot=result;$('help-panel').hidden=true;$('help-toggle').setAttribute('aria-expanded','false');$('inspector').hidden=false;renderInspector();renderGraph();$('inspector-title').focus({preventScroll:true});
}
async function quickEdit(){
 if(view().bare)return;
 openFile('README.md');feedback('This sample has a real page, stylesheet and project notes. Edit any of them yourself; no sample edit has been applied.');
}
function showHelp(topic){
 closeComparison();
 toggleHistory(false);
 $('help-panel').hidden=false;$('help-toggle').setAttribute('aria-expanded','true');
 if(topic){const entry=$('help-topics').querySelector(`[data-topic="${topic}"]`);if(entry){entry.open=true;entry.scrollIntoView({block:'nearest'});}}
 $('help-heading').focus({preventScroll:true});
}
function panel(html){closeComparison();$('action-panel').innerHTML=html;$('action-panel').hidden=false;$('share-toggle').setAttribute('aria-expanded','true');}
function closeActionPanel(){$('action-panel').hidden=true;$('share-toggle').setAttribute('aria-expanded','false');}
function newBranch(){
 if(view().bare)return;
 panel(`<h2>Try a new line of work</h2><p>A branch starts at your current snapshot. You can edit and save a different version, then switch back.</p><form id="branch-form"><label for="branch-name">Branch name<input id="branch-name" placeholder="For example: book-list" maxlength="32" autocomplete="off"></label><button class="primary" type="submit">Create branch</button><button type="button" data-close-panel>Cancel</button></form>`);
 $('branch-form').addEventListener('submit',async event=>{event.preventDefault();const name=$('branch-name').value.trim();if(!/^[A-Za-z][A-Za-z0-9_-]{0,31}$/.test(name)){feedback('Use a short branch name beginning with a letter, with letters, numbers, hyphens or underscores.');$('branch-name').focus();return;}suggestCommand('git switch -c '+name);closeActionPanel();});$('branch-name').focus();
}
function exchange(){
 if(view().bare)return;
 const current=view(),targets=current.graph.refs.filter(ref=>ref.name.startsWith('refs/heads/')||ref.name.startsWith('refs/remotes/')).map(ref=>shortRef(ref.name)).filter(name=>name!==current.branch);
 const hasRemote=!!state.views.origin;
 panel(`<h2>Exchange and combine work</h2><p>Fetch receives shared commits. Merge combines a line into your current branch. Push shares saved commits. Choose what you want to try.</p><div class="exchange-buttons">${hasRemote?'<button data-exchange="fetch">Fetch from Shared</button><button data-exchange="push">Push this branch</button>':''}<button data-close-panel>Close</button></div>${targets.length?`<form id="merge-form"><label for="merge-target">Bring work into ${esc(current.branch)}<select id="merge-target">${targets.map(name=>`<option>${esc(name)}</option>`).join('')}</select></label><button type="submit">Merge selected branch</button></form>`:'<p>Create another branch to explore merging.</p>'}`);
 const merge=$('merge-form');if(merge)merge.addEventListener('submit',async event=>{event.preventDefault();suggestCommand('git merge '+$('merge-target').value);closeActionPanel();});
}
function setActor(next){actor=next;historyCursor=commandHistory[actor].length;$('command').value='';$('command-effect').textContent='Terminal connected to '+names[actor]+'. Nothing ran when you switched.';snapshot=null;version='working';closeInspector();closeActionPanel();render();feedback(view().bare?'You are observing the actual shared repository. This does not refresh either person’s local copy.':`You are now in ${names[actor].toLowerCase()}. The other workspace was kept as it was.`);}

$('files').addEventListener('click',event=>{const open=event.target.closest('[data-file]'),stage=event.target.closest('[data-stage]');if(open)openFile(open.dataset.file);if(stage)suggestCommand('git add '+stage.dataset.stage);});
$('compare-toggle').addEventListener('click',()=>{$('compare-panel').hidden?openComparison():closeComparison(true);});
$('close-compare').addEventListener('click',()=>closeComparison(true));
$('compare-branch').addEventListener('change',()=>{compareBranch=$('compare-branch').value;renderComparison();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('compare-panel').hidden)closeComparison(true);});
$('prepared').addEventListener('click',event=>{const button=event.target.closest('[data-unstage]');if(button)suggestCommand('git restore --staged '+button.dataset.unstage);});
$('graph').addEventListener('click',event=>{const button=event.target.closest('[data-commit]');if(button)inspectCommit(button.dataset.commit);});
document.querySelectorAll('[data-actor]').forEach(button=>button.addEventListener('click',()=>setActor(button.dataset.actor)));
$('branch').addEventListener('change',async()=>{suggestCommand('git switch '+$('branch').value);$('branch').value=view().branch;});
$('new-branch').addEventListener('click',newBranch);$('quick-edit').addEventListener('click',quickEdit);
$('commit-form').addEventListener('submit',async event=>{event.preventDefault();const message=$('message').value.trim();if(!message){feedback('Give this snapshot a short name, so you can recognise it later.');$('message').focus();return;}if(/[\x00-\x1f]/.test(message)){feedback('Use a single line for the snapshot name.');return;}suggestCommand('git commit -m '+JSON.stringify(message));});
$('share-toggle').addEventListener('click',()=>{$('action-panel').hidden?exchange():closeActionPanel();});
$('action-panel').addEventListener('click',event=>{if(event.target.closest('[data-close-panel]'))closeActionPanel();const kind=event.target.closest('[data-exchange]')?.dataset.exchange;if(kind==='fetch')suggestCommand('git fetch origin');if(kind==='push')suggestCommand('git push -u origin '+view().branch);});
$('undo').addEventListener('click',async()=>{const result=await api('/api/undo',{});if(result){snapshot=null;appendOutput('Undo playground action',result);render();feedback(result.output+(hasDraft()?' Your unsaved editor draft is kept.':''));}});
function markDraft(content){drafts[draftKey()]=content;rememberDrafts();$('draft-note').textContent=hasDraft()?'Unsaved browser draft':'Saved file';applyEditorControls();}
$('source').addEventListener('input',()=>{markDraft($('source').value);updateLineNumbers();});
$('source').addEventListener('scroll',()=>{$('line-numbers').scrollTop=$('source').scrollTop;});
$('file-tabs').addEventListener('click',event=>{const tab=event.target.closest('[data-tab-file]');if(tab&&!busy){file=tab.dataset.tabFile;snapshot=null;version='working';renderFiles();renderInspector();}});
$('refresh-preview').addEventListener('click',()=>renderPreview(true));
$('drawer-preview').addEventListener('click',()=>{previewOpen=true;renderPreview();$('workspace').classList.remove('files-open');$('files-toggle').setAttribute('aria-expanded','false');});
$('close-preview').addEventListener('click',()=>{previewOpen=false;renderPreview();$('source').focus();});
$('history-toggle').addEventListener('click',()=>toggleHistory($('history-panel').hidden));
$('close-history').addEventListener('click',()=>{toggleHistory(false);$('history-toggle').focus();});
$('save-file').addEventListener('click',()=>saveContent($('source').value));
document.querySelectorAll('[data-version]').forEach(button=>button.addEventListener('click',()=>{version=button.dataset.version;renderInspector();}));
$('close-inspector').addEventListener('click',()=>{closeInspector();$('source').focus();});
$('help-toggle').addEventListener('click',()=>{if($('help-panel').hidden)showHelp();else{$('help-panel').hidden=true;$('help-toggle').setAttribute('aria-expanded','false');}});
$('close-help').addEventListener('click',()=>{$('help-panel').hidden=true;$('help-toggle').setAttribute('aria-expanded','false');$('help-toggle').focus();});
$('files-help').addEventListener('click',()=>showHelp('files'));$('stage-help').addEventListener('click',()=>showHelp('stage'));
$('help-topics').innerHTML=Object.entries(helpTopics).map(([id,topic])=>`<details data-topic="${id}"><summary>${esc(topic.title)}</summary><p>${esc(topic.text)}</p>${topic.command?`<code>${esc(topic.command)}</code>`:''}</details>`).join('');
document.querySelectorAll('[data-experiment]').forEach(button=>button.addEventListener('click',()=>{$('help-panel').hidden=true;$('help-toggle').setAttribute('aria-expanded','false');const kind=button.dataset.experiment;if(kind==='edit')openFile('index.html');if(kind==='branch')newBranch();if(kind==='sam'&&state.views.sam){setActor('sam');openFile('index.html');}}));
$('reset').addEventListener('click',()=>{panel('<h2>Reset this playground?</h2><p>This returns all its workspaces and Shared to the starting point. You can Undo the reset.</p><button id="confirm-reset">Reset playground</button> <button data-close-panel>Keep exploring</button>');$('help-panel').hidden=true;$('help-toggle').setAttribute('aria-expanded','false');$('confirm-reset').addEventListener('click',async()=>{const result=await api('/api/restore',{});if(result){snapshot=null;closeActionPanel();render();feedback('The playground is back at its starting point. Undo can restore the state before the reset. Browser drafts are kept.');}});});
$('console-toggle').addEventListener('click',()=>{$('command').focus();});
$('close-console').addEventListener('click',()=>{$('workspace').classList.toggle('terminal-focus');$('close-console').textContent=$('workspace').classList.contains('terminal-focus')?'Show editor':'Focus terminal';$('command').focus();});
$('console-form').addEventListener('submit',async event=>{event.preventDefault();const command=$('command').value.trim();if(command&&!busy){commandHistory[actor].push(command);historyCursor=commandHistory[actor].length;const result=await runGit(command,command.split(/\s+/)[1]);if(result?.code===0)$('command').value='';$('command').focus();}});
$('command').addEventListener('keydown',event=>{if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();const history=commandHistory[actor];historyCursor=Math.max(0,Math.min(history.length,historyCursor+(event.key==='ArrowUp'?-1:1)));$('command').value=history[historyCursor]||'';}});
$('graph-text-toggle').addEventListener('click',()=>{const open=$('graph-text').hidden;$('graph-text').hidden=!open;$('graph-text-toggle').setAttribute('aria-expanded',String(open));});
$('files-toggle').addEventListener('click',()=>{closeComparison();const open=$('workspace').classList.toggle('files-open');$('files-toggle').setAttribute('aria-expanded',String(open));});
$('flow').addEventListener('click',event=>{if(event.target.closest('[data-flow]')){$('workspace').classList.add('files-open');$('files-toggle').setAttribute('aria-expanded','true');const target=event.target.closest('[data-flow]').dataset.flow==='prepared'?$('message'):$('files').querySelector('button');target?.focus();}});
$('project').addEventListener('change',async()=>{const result=await api('/api/switch',{mission:$('project').value});if(result){actor='you';snapshot=null;version='working';closeInspector();closeActionPanel();render();feedback('You opened another project. The previous project’s saved work is kept in this running session.');}else $('project').value=state.mission;});
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();if(!$('workspace').hidden&&!$('inspector').inert&&state&&!busy&&!view().bare&&!snapshot&&version==='working'&&hasDraft())saveContent($('source').value);}if(event.key==='Escape'){$('help-panel').hidden=true;$('help-toggle').setAttribute('aria-expanded','false');closeActionPanel();$('workspace').classList.remove('files-open');$('files-toggle').setAttribute('aria-expanded','false');}});
window.addEventListener('resize',()=>{if(state&&!$('history-panel').hidden)renderGraph();});
const referenceChecks={
 status:['git diff','Read the changed lines behind the file names.'],
 diff:['git diff --staged','Check staging separately before committing.'],
 log:['git show HEAD','Inspect the latest commit in detail.'],
 show:['git log --oneline','Find another commit to inspect.'],
 add:['git diff --staged','Look for the exact content you intended to stage.'],
 commit:['git log --oneline','Look for your message at the top of local history.'],
 restore:['git status','Check which edits are still staged or unstaged.'],
 branch:['git branch','The asterisk marks your current branch.'],
 switch:['git status','Check the branch name before making another edit.'],
 remote:['git remote -v','Inspect where this workspace sends and receives work.'],
 fetch:['git log --oneline --graph --all','Compare local and remote-tracking branch labels.'],
 merge:['git status','Check for a completed merge or files needing resolution.'],
 push:['git status','Check local tracking information, then inspect Shared separately.'],
 init:['git status','Confirm that Git recognizes the folder as a repository.'],
 clone:['git status','Run this inside the cloned folder.'],
 pull:['git status','Check the branch and any remaining work after integration.']
};
function renderReference({detail=true}={}){
 const selected=location.hash.split('/')[2]||'status';
 const entry=commandCatalog.find(command=>command.id===selected)||commandCatalog[0];
 const query=$('command-search').value.trim().toLowerCase();
 const allGroups=[...new Set(commandCatalog.map(command=>command.group))];
 $('command-groups').innerHTML=allGroups.map(group=>{const first=commandCatalog.find(command=>command.group===group);return `<a href="#/commands/${first.id}" ${!query&&group===entry.group?'aria-current="true"':''}>${esc(group)}<span>${commandCatalog.filter(command=>command.group===group).length}</span></a>`;}).join('');
 const matches=commandCatalog.filter(command=>{if(!query)return command.group===entry.group;const text=[command.name,command.group,command.summary,command.when,command.changes,command.stays,command.note,...command.examples.flat()].join(' ').toLowerCase();return query.split(/\s+/).every(word=>text.includes(word));});
 $('command-list-label').textContent=query?`${matches.length} ${matches.length===1?'match':'matches'}. Choose a command to read.`:entry.group;
 $('reference-search-note').hidden=!query;
 $('reference-search-note').textContent=query?`Showing ${entry.name} below. Choose a search result to open a different command.`:'';
 $('command-list').innerHTML=matches.map(command=>`<a href="#/commands/${command.id}" ${command.id===entry.id?'aria-current="page"':''}><code>${esc(command.name)}</code><span>${esc(command.summary)}</span></a>`).join('')||'<p class="reference-empty" role="status">No matching commands. Try “stage”, “branch” or “share”.</p><button id="clear-command-search">Clear search</button>';
 $('clear-command-search')?.addEventListener('click',()=>{$('command-search').value='';renderReference();$('command-search').focus();});
 if(!detail&&$('command-detail').hasChildNodes())return;
 const check=referenceChecks[entry.id];
 const related=commandCatalog.filter(command=>command.group===entry.group&&command.id!==entry.id);
 $('command-detail').innerHTML=`<header class="reference-command-heading"><div><h2 tabindex="-1">${esc(entry.name)}</h2><p>${esc(entry.summary)}</p></div><div class="reference-heading-actions"><span class="reference-scope">${entry.referenceOnly?'Reference only · outside this playground':'Available in this playground'}</span><button id="reference-examples-jump">${entry.referenceOnly?'View syntax':'View examples'}</button></div></header><div class="reference-understand"><section><h3>When to use it</h3><p>${esc(entry.when)}</p></section><div class="reference-effects"><section><h3>What changes</h3><p>${esc(entry.changes)}</p></section><section><h3>What stays the same</h3><p>${esc(entry.stays)}</p></section></div>${entry.note?`<aside class="reference-note"><h3>Keep in mind</h3><p>${esc(entry.note)}</p></aside>`:''}<section class="reference-related"><h3>In the same toolkit</h3>${related.map(command=>`<a href="#/commands/${command.id}">${esc(command.name)}<span>${esc(command.summary)}</span></a>`).join('')}</section><a class="reference-docs" href="${entry.docs}" target="_blank" rel="noopener noreferrer">Official Git documentation ↗</a></div><div class="reference-practice"><section class="reference-examples"><h3 id="reference-examples-heading" tabindex="-1">${entry.referenceOnly?'Syntax for real Git':'Try a command'}</h3><p class="reference-instruction">${entry.referenceOnly?'Read here; use this in an ordinary Git repository.':'Fill the terminal, inspect the command, then run it when you’re ready.'}</p>${entry.examples.map(([code,text],index)=>`<div class="reference-example"><pre><code>${esc(code)}</code></pre><p>${esc(text)}</p>${!entry.referenceOnly?`<button data-reference-example="${index}">Put in terminal <span aria-hidden="true">→</span></button>`:''}</div>`).join('')}</section><section class="reference-check"><h3>Check the result</h3><code>${esc(check[0])}</code><p>${esc(check[1])}</p><p class="reference-instruction">${entry.referenceOnly?'The practice repositories are already set up. This command is reference-only here.':'Nothing runs from this page. Your terminal and files are kept.'}</p></section></div>`;
 $('reference-examples-jump').addEventListener('click',()=>{$('reference-examples-heading').focus({preventScroll:true});$('reference-examples-heading').scrollIntoView({block:'start'});});
 document.querySelectorAll('[data-reference-example]').forEach(button=>{button.disabled=!state||busy||view().bare;button.addEventListener('click',()=>{const code=entry.examples[Number(button.dataset.referenceExample)][0];location.hash='/workspace';suggestCommand(code);});});
 if(state&&view().bare&&!entry.referenceOnly)$('command-detail').insertAdjacentHTML('beforeend','<p class="reference-note">Choose Your workspace or Sam’s workspace before trying a command. Shared has no working folder.</p>');
}
$('command-groups').addEventListener('click',event=>{if(event.target.closest('a')){$('command-search').value='';renderReference();}});
function showPage(focus=false){
 const reference=location.hash.startsWith('#/commands');
 if(reference){closeActionPanel();closeComparison();}
 $('commands-page').hidden=!reference;$('workspace').hidden=reference;
 for(const element of document.querySelectorAll('.workspace-bar,.project-actions,.status-bar'))element.hidden=reference;
 $('nav-workspace').toggleAttribute('aria-current',!reference);$('guide-toggle').toggleAttribute('aria-current',reference);
 if(reference){$('guide-toggle').setAttribute('aria-current','page');renderReference();if(focus)$('command-detail').querySelector('h2').focus();}
 else{$('nav-workspace').setAttribute('aria-current','page');if(focus&&state)$('command').focus();}
 document.title=reference?'GitCraft | Commands':'GitCraft | Split Workbench';
 document.querySelector('.skip').textContent=reference?'Skip to command explanation':'Skip to the terminal';
}
document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();(location.hash.startsWith('#/commands')?$('command-detail').querySelector('h2'):$('command')).focus();});
$('command-search').addEventListener('input',()=>renderReference({detail:false}));
window.addEventListener('hashchange',()=>showPage(true));
showPage();
const initial=await api('/api/state');
if(initial){if(state.mission!=='playground')await api('/api/switch',{mission:'playground'});render();if(!$('commands-page').hidden)renderReference();feedback('Start in the terminal: type git status. Edit files when you need a change to track, then inspect, stage and commit it yourself.');}
