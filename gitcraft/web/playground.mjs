// Compare observed native refs; different commit IDs never imply ancestry.
export function compareWorkspaces(views, branch='main') {
 const branches=[...new Set(Object.values(views).flatMap(view=>view.graph.refs.filter(ref=>ref.name.startsWith('refs/heads/')).map(ref=>ref.name.slice(11))))].sort((a,b)=>a==='main'?-1:b==='main'?1:a.localeCompare(b));
 if(!branches.includes(branch))branch=branches[0]||'main';
 const tip=(view,name)=>view?.graph.refs.find(ref=>ref.name===name)?.target||null;
 const shared=tip(views.origin,'refs/heads/'+branch);
 const commit=(view,id)=>({id,message:id?(view?.graph.commits.find(node=>node.id===id)?.message||'Details outside the visible history'):'No branch here'});
 const copies=['you','sam','origin'].filter(actor=>views[actor]).map(actor=>{
  const view=views[actor],id=tip(view,'refs/heads/'+branch),remembered=actor==='origin'?null:tip(view,'refs/remotes/origin/'+branch);
  const relation=!id?'missing':!shared?'unpublished':id===shared?'same':'different';
  const memory=!remembered?'unknown':!shared?'removed':remembered===shared?'same':'different';
  const files=view.bare?[]:Object.entries(view.files).filter(([,file])=>file.working!==file.staged||file.staged!==file.committed).map(([name,file])=>({name,conflict:file.staged===null,working:file.working!==file.staged,staged:file.staged!==null&&file.staged!==file.committed}));
  return {actor,branch:view.branch,commit:commit(view,id),relation,remembered:commit(view,remembered),memory,files};
 });
 const you=copies.find(copy=>copy.actor==='you'),sam=copies.find(copy=>copy.actor==='sam');
 let summary;
 if(!shared)summary=`${branch} is not published to Shared. A push shares committed work, not working-file edits.`;
 else if(you?.relation==='same'&&sam?.relation==='same')summary=`All three ${branch} branches point to the same commit. Uncommitted work can still differ.`;
 else if(you?.relation==='same'&&sam?.relation==='different')summary=`Your ${branch} matches Shared. Sam’s ${branch} points to a different commit. Pushing does not update Sam’s files.`;
 else if(sam?.relation==='same'&&you?.relation==='different')summary=`Sam’s ${branch} matches Shared. Your ${branch} points to a different commit. Fetching and merging are separate steps.`;
 else summary=`These ${branch} branch positions differ. Different commits do not tell you which is ahead; inspect History before combining work.`;
 return {branch,branches,copies,summary};
}
export function fileState(file) {
  if (file.staged === null) return {conflict:true,working:true,prepared:false,label:'Needs a merge'};
  const working=file.working!==file.staged, prepared=file.staged!==file.committed;
  return {working,prepared,conflict:false,label:working&&prepared?'Changed again':working?'Changed':prepared?'Prepared':'Unchanged'};
}
export function counts(view) {
  if(view.bare)return {working:0,prepared:0,conflicts:0};
  return Object.values(view.files).reduce((all,file)=>{const value=fileState(file);all.working+=Number(value.working);all.prepared+=Number(value.prepared);all.conflicts+=Number(value.conflict);return all;},{working:0,prepared:0,conflicts:0});
}
export function shortRef(name){return name.replace(/^refs\/heads\//,'').replace(/^refs\/remotes\//,'');}
export function graphLayout(commits) {
  const pending=new Map(),positions=new Map();let highest=0;
  function free(){let lane=0;while([...pending.values()].includes(lane))lane++;return lane;}
  commits.forEach((commit,index)=>{
    const lane=pending.has(commit.id)?pending.get(commit.id):free();
    pending.delete(commit.id);highest=Math.max(highest,lane);
    positions.set(commit.id,{x:80+lane*280,y:80+index*112});
    commit.parents.forEach((parent,number)=>{
      if(!pending.has(parent)){const next=number===0&&![...pending.values()].includes(lane)?lane:free();pending.set(parent,next);highest=Math.max(highest,next);}
    });
  });
  const edges=[];
  commits.forEach(commit=>commit.parents.forEach(parent=>{if(positions.has(parent))edges.push({from:commit.id,to:parent,start:positions.get(commit.id),end:positions.get(parent)});}));
  return {positions,edges,width:Math.max(380,highest*280+350),height:Math.max(300,commits.length*112+80)};
}
const signature=view=>JSON.stringify(view.graph.refs.map(ref=>[ref.name,ref.target]).sort((a,b)=>a[0].localeCompare(b[0])));
export function effects(before,after,actor) {
  const a=before.views[actor],b=after.views[actor];
  const files=Object.keys(a.files||{});
  return {working:!b.bare&&files.some(name=>a.files[name].working!==b.files[name].working),prepared:!b.bare&&files.some(name=>a.files[name].staged!==b.files[name].staged),history:signature(a)!==signature(b)||a.head!==b.head,shared:!!after.views.origin&&signature(before.views.origin)!==signature(after.views.origin)};
}
export function explain(before,after,actor,kind,code=0) {
  const changed=effects(before,after,actor),current=after.views[actor],total=counts(current);
  if(code!==0)return total.conflicts?'Both lines of work are still here. Git needs you to edit the highlighted file, prepare the result, then save a snapshot. Undo is available.':'Git could not complete that action. Your playground is still available. Open the response for details, or undo the last action.';
  if(kind==='edit')return changed.working?'Your working file changed. The prepared version and saved snapshots stayed the same.':'The file was saved. Its content was already the same.';
  if(kind==='stage')return changed.prepared?'This file’s current content is prepared for a snapshot. Editing it again will not change that prepared copy.':'The prepared content already matches this file.';
  if(kind==='unstage')return 'The file is no longer prepared. Your working edits are kept.';
  if(kind==='commit')return changed.history?'A new snapshot was saved and your current branch moved to it. Other workspaces did not update.':'No new snapshot was needed.';
  if(kind==='fetch')return changed.history?'New shared history is now known in this workspace. Fetch did not change your working files.':'Your remembered shared history is already up to date. Working files stayed the same.';
  if(kind==='push')return changed.shared?'Your saved work reached Shared. The other person’s working files did not change automatically.':'Shared already has the commits you sent.';
  if(kind==='branch')return 'You are now on another branch: a name pointing to a saved snapshot. This is still the same workspace.';
  if(kind==='switch')return 'Your active branch changed. Git kept or updated files according to the actual repository state.';
  if(kind==='merge')return changed.history?'The selected line of work was combined into your current branch. Inspect the graph and files to see the result.':'That work is already included in your current branch.';
  if(kind==='teammate')return 'Sam shared an entrance update. Your own files and remembered shared history have not refreshed automatically.';
  return 'Git completed the action. Select a snapshot or inspect the files to explore the result.';
}
export function commandFeedback(before,after,actor,command,result) {
 const current=after.views[actor],previous=before.views[actor],total=counts(current);
 const words=command.trim().split(/\s+/),verb=words[1],output=String(result.output||'');
 const message=(summary,hint='',tone='info')=>({summary,hint,tone});
 const changed=version=>Object.keys(current.files||{}).filter(name=>previous.files[name]?.[version]!==current.files[name][version]);
 const names=files=>files.join(', ');
 const conflicts=Object.keys(current.files||{}).filter(name=>current.files[name].staged===null);
 if(result.requestStatus!==undefined){
  if(result.requestStatus===0||result.requestStatus>=500)return message('The command’s outcome could not be confirmed.','It may have run. Reconnect and inspect with git status before retrying.','error');
  if(result.requestStatus===403)return message('This local session needs to reconnect.','Refresh the page before sending another command.','error');
  const rejectedBeforeGit=/No command ran|Enter a Git command under|Use a single-line|Close the quoted command|This is a Git console|supports up to 12 branches|Choose an editable collaborator|Expected a small JSON request/i.test(output);
  return message(result.requestStatus===400&&rejectedBeforeGit?'GitCraft did not run this command.':'The request could not be completed.',rejectedBeforeGit?output:output+' Inspect with git status before retrying.',rejectedBeforeGit?'info':'error');
 }
 if(result.code!==0){
  if(conflicts.length)return message(`Resolve the merge in ${names(conflicts)} before continuing.`,`Edit the file, stage the resolved content, then inspect with git status. Nothing was resolved for you.`);
  if(verb==='commit'&&!total.prepared&&previous.head===current.head&&/nothing to commit|no changes added to commit|nothing added to commit/i.test(output)){
   return total.working?message('No commit was created. Your saved edits are not staged.','Review them with git diff, then use git add on the files you want to commit.'):message('No commit was created because there is no staged change.','Use git status to inspect this workspace. You can edit a file when you have a change to make.');
  }
  if(verb==='push'&&/non-fast-forward|fetch first/i.test(output))return message('Shared rejected this push because the histories need to be reconciled.','Run git fetch origin, then inspect git log --oneline --graph --all before choosing how to combine the work.');
  if(verb==='push'&&/no upstream branch/i.test(output))return message('This branch has no default destination for git push.',`To publish this branch to Shared, use git push -u origin ${current.branch}.`);
  if((verb==='switch'||verb==='branch')&&/already exists/i.test(output))return message('That branch name already exists in this workspace.','Use git branch to inspect the names before choosing one.');
  if(verb==='switch'&&/would be overwritten/i.test(output))return message('Git blocked the switch to protect local edits.','Review git diff and git diff --staged before deciding what to keep.');
  if(verb==='switch'&&/invalid reference|not a valid reference/i.test(output))return message('Git could not find that branch in this workspace.','Use git branch to see the local branch names.');
  if(verb==='merge'&&words[2]==='--abort'&&/no merge to abort|MERGE_HEAD missing/i.test(output))return message('There is no in-progress merge to abort.','Use git status to inspect the current state.');
  return message('Git reported an error. Read its response above before choosing the next step.','Use git status to inspect the actual workspace. No retry runs automatically.','error');
 }
 if(verb==='status'){
  const summary=`${total.working} file(s) with unstaged edits; ${total.prepared} with staged changes.`;
  return message(summary,conflicts.length?`${names(conflicts)} needs a merge resolution.`:result.hasDraft?'Your browser draft is not saved yet. Git can only inspect saved files.':total.working?'Use git diff to review the unstaged lines.':total.prepared?'Use git diff --staged to review what a commit would contain.':'Working files and staging match the current commit. This does not check Shared for new work.');
 }
 if(verb==='diff'){
  const staged=words.includes('--staged')||words.includes('--cached');
  if(result.hasDraft)return message('Git compared saved file content. Your unsaved browser draft is excluded.','Save file when you want Git to inspect that draft.');
  if(!output.trim())return message(staged?'Staging matches the current commit.':'Saved working files match staging.',!staged&&total.prepared?'There are still staged changes. Inspect them with git diff --staged.':'No differences were reported for this comparison.');
  return message(staged?'Compared staging with the current commit.':'Compared saved working files with staging.','+ marks added lines; - marks removed lines. This command did not edit files.');
 }
 if(verb==='add'){
  const files=changed('staged');
  return message(files.length?`Staged ${names(files)}.`:'The staging content was already the same.','No commit was created. Use git diff --staged to review what is prepared.');
 }
 if(verb==='restore'){
  const staged=words[2]==='--staged',files=changed(staged?'staged':'working');
  if(staged)return message(files.length?`Unstaged ${names(files)}.`:'The selected staging content already matched the commit.',changed('working').length?'Inspect the working files with git diff.':'Working-file edits were kept. Use git diff to review them.');
  return message(files.length?`Replaced the saved working content of ${names(files)} with its staged version.`:'The selected working content already matched staging.',total.prepared?'Staged changes still remain. Inspect git diff --staged.':'No commit was created or published.');
 }
 if(verb==='commit')return message(previous.head!==current.head?`Created local commit ${current.head.slice(0,7)} on ${current.branch||'detached HEAD'}.`:'HEAD did not move. Inspect git log --oneline.',`${total.working?`${total.working} file(s) still have unstaged edits outside this commit. `:''}Committing does not publish to Shared or update the other workspace.`);
 if(verb==='fetch'){
  const refs=view=>JSON.stringify(view.graph.refs.filter(ref=>ref.name.startsWith('refs/remotes/')).map(ref=>[ref.name,ref.target]).sort());
  return message(refs(previous)!==refs(current)?'Updated this workspace’s remembered Shared refs.':'No remembered Shared ref moved.',previous.head===current.head&&!changed('working').length?'Your current branch and working files were not merged. Open Compare or History to inspect the received work.':'Inspect the branch and files before continuing.');
 }
 if(verb==='push')return message(effects(before,after,actor).shared?'Published committed work to Shared.':'Shared’s observed branch positions did not change.','The other workspace’s files do not update automatically. Open Compare to see the separate copies.');
 if(verb==='switch')return message(previous.branch!==current.branch?`Now working on ${current.branch||'detached HEAD'}.`:`Already on ${current.branch}.`,words[2]==='-c'?'Created a local branch. Nothing was published to Shared.':'Use git status to inspect the branch and files before editing.');
 if(verb==='branch')return message(effects(before,after,actor).history?`Created a local branch; stayed on ${current.branch}.`:`Listed local branches. You are on ${current.branch}.`,'A branch name is local until you publish it.');
 if(verb==='merge'&&words[2]==='--abort')return message('Stopped the in-progress merge.','Inspect git status before continuing. Nothing was published to Shared.');
 if(verb==='merge')return message(previous.head!==current.head?'Your branch now includes the selected line of work.':'No merge was needed; your branch already contains that work.','Nothing was pushed. Inspect git log --oneline --graph --all to check the result.');
 if(verb==='log'||verb==='show'||verb==='remote')return message(verb==='log'?'Displayed commits known in this workspace.':verb==='show'?'Displayed the requested saved content.':'Displayed configured remote locations.','This only inspected the repository. No files changed or remote work was fetched.');
 return message('Git completed the command.','Read its response above and inspect the result before continuing.');
}
export const helpTopics={
  files:{title:'Working files',text:'These are the files in this person’s own copy of the project. Edit them freely. Saving a file does not create a Git snapshot.',command:'git diff'},
  stage:{title:'Prepare a change',text:'Preparing, or staging, chooses the current contents for the next snapshot. Later edits stay separate until you prepare again.',command:'git add index.html'},
  commit:{title:'Save a snapshot',text:'A commit records the prepared content and a message. The circles in the graph are actual commits. A commit stays local until shared.',command:'git commit -m "Update book list"'},
  branch:{title:'Try a different line of work',text:'A branch is a name pointing to a commit. Create one, make a change and save a snapshot. Switch back to see the original line of work.',command:'git switch -c idea'},
  shared:{title:'Exchange changes',text:'Fetch receives shared commits. Merge combines a selected line into your current branch. Push sends saved commits. Neither person’s files update by magic.',command:'git fetch origin'},
  undo:{title:'A safe place to experiment',text:'Undo restores this whole playground to before the last saved action, including Sam and Shared. It is a playground feature, not a Git command. Unsaved editor drafts are kept.',command:''}
};

export const commandCatalog=[
 {id:'status',group:'Inspect',summary:'See what changed in this workspace.',when:'Start here when you want to know your branch, unstaged edits and staged changes.',changes:'Nothing. This only reads the current repository.',stays:'Files, staging, commits and Shared stay as they are.',note:'Ahead/behind information uses your last fetched remote-tracking branch; it does not contact Shared.',examples:[['git status','Read the state of your working files and staging area.']]},
 {id:'diff',group:'Inspect',summary:'Read the actual lines that changed.',when:'Before staging or committing, check exactly what you are about to keep.',changes:'Nothing. A diff is a comparison, not an edit.',stays:'Your file content, staging and saved commits stay unchanged.',note:'An empty git diff can mean your changes are already staged. Check git diff --staged too.',examples:[['git diff','Compare working files with staging. + means an added line; - means a removed line.'],['git diff --staged','Compare staged content with the last commit.']]},
 {id:'log',group:'Inspect',summary:'Look through saved commits.',when:'Find out what has already been committed in this workspace.',changes:'Nothing. Reading history does not fetch new work.',stays:'Working files and branch positions stay unchanged.',note:'Other people’s newer commits appear only after your workspace receives them.',examples:[['git log --oneline','Show one compact line per commit.'],['git log --oneline --graph --all','Show known branches and how their commits connect.']]},
 {id:'show',group:'Inspect',summary:'Inspect a saved commit or a file inside it.',when:'You want to read an earlier saved version without switching branches.',changes:'Nothing. This displays content rather than replacing your working file.',stays:'Your current edits, staging and branch are kept.',examples:[['git show HEAD','Inspect the latest commit and its patch.'],['git show HEAD:README.md','Read README.md as saved in the current commit.']]},
 {id:'add',group:'Save work',summary:'Choose saved file content for the next commit.',when:'You reviewed an edit and want to include its current content in a commit.',changes:'The staging area receives the selected file content.',stays:'Your working file stays editable. No commit is created or pushed.',note:'If you edit the file again, those later edits are not staged until you add it again.',examples:[['git add README.md','Stage the current saved content of README.md.']]},
 {id:'commit',group:'Save work',summary:'Save staged content as a local snapshot.',when:'The staging area contains a change you want to keep with a useful message.',changes:'A new commit is created and your current branch moves to it.',stays:'Unstaged edits stay outside this commit. Shared and Sam’s workspace do not update.',note:'Saving a file is not committing it. A commit records the staging area, not every working-file edit.',examples:[['git commit -m "Update reading club"','Replace the message with a short description of your own change.']]},
 {id:'restore',group:'Save work',summary:'Unstage a file, or replace its working edits.',when:'You staged something too soon, or deliberately want to discard working-file changes.',changes:'With --staged, the index is reset to the last commit for this file. Without it, the working file is restored from staging.',stays:'Unstaging keeps your working edits. Neither form creates a commit.',note:'git restore README.md overwrites that file’s working edits. Read the diff first; this is different from simply unstaging.',examples:[['git restore --staged README.md','Unstage README.md while keeping its working edits.'],['git restore README.md','Discard working edits by replacing them with the staged file content.']]},
 {id:'branch',group:'Branch',summary:'List branches or create a name for a line of work.',when:'You want to inspect branch names or mark a separate idea.',changes:'Listing changes nothing. Creating a branch adds a name at your current commit.',stays:'Creating with git branch does not switch your current branch or make a separate folder.',examples:[['git branch','List local branches; * marks the current one.'],['git branch book-list','Create book-list at your current commit without switching to it.']]},
 {id:'switch',group:'Branch',summary:'Choose the branch you are working on.',when:'You want to work on another idea or return to main.',changes:'The active branch changes. Git updates working files as needed and protects incompatible local edits.',stays:'Other workspaces and Shared stay unchanged.',note:'A branch is a name pointing to a commit, not another person’s workspace.',examples:[['git switch -c book-list','Create book-list at the current commit and switch to it.'],['git switch main','Return to your existing main branch.']]},
 {id:'remote',group:'Collaborate',summary:'See where this repository sends and receives work.',when:'You want to understand what origin refers to.',changes:'The example only lists configured remote names and locations.',stays:'It does not connect, fetch, push or change files.',note:'origin is a conventional name for a remote, not a special global Git server. In this playground it points to Shared.',examples:[['git remote -v','List the configured fetch and push locations.']]},
 {id:'fetch',group:'Collaborate',summary:'Receive shared history without changing your files.',when:'You want your workspace to learn about commits published to Shared.',changes:'Git receives remote objects and updates remote-tracking names such as origin/main.',stays:'Your active local branch and working files are not merged or switched.',note:'Fetch is not merge. Seeing origin/main move does not mean its changes are in your own main yet.',examples:[['git fetch origin','Refresh what this workspace knows about Shared.']]},
 {id:'merge',group:'Collaborate',summary:'Bring another line of work into your current branch.',when:'You are ready to combine known commits with the branch you are on.',changes:'Git may fast-forward your branch, make a merge commit, or pause for you to resolve conflicts.',stays:'Nothing is pushed automatically. Merging does not fetch newer remote work.',note:'If Git reports a conflict, edit the conflicted file yourself, stage the result and commit. Do not blindly remove someone’s changes.',examples:[['git merge origin/main','Combine the last fetched shared main into your current branch.'],['git merge book-list','Combine your existing local book-list branch into the branch you are on.'],['git merge --abort','Try to stop an in-progress merge and return to its pre-merge state.']]},
 {id:'push',group:'Collaborate',summary:'Publish local commits to Shared.',when:'You have committed work and want another workspace to receive it.',changes:'Git sends commits and updates the destination branch if the push is accepted.',stays:'Sam’s working files do not update automatically. Uncommitted edits are not sent.',note:'A rejected push can mean Shared has commits you do not have yet. Inspect, fetch and combine the work instead of overwriting it.',examples:[['git push','Push the current branch to its configured upstream.'],['git push -u origin book-list','Publish the local book-list branch and configure its upstream.']]},
 {id:'init',group:'Start a project',referenceOnly:true,summary:'Start Git tracking in an existing folder.',when:'You have files locally and want to create a Git repository for them.',changes:'Git creates repository metadata in a .git directory.',stays:'Existing files are not automatically staged, committed or uploaded.',note:'GitCraft has already created its practice repositories. Try this during the real-Git setup task, outside this playground.',examples:[['git init','Initialize a repository in your current folder.']]},
 {id:'clone',group:'Start a project',referenceOnly:true,summary:'Create your own local copy of a repository.',when:'You want to start working on a project that already has a Git repository.',changes:'Git creates a local repository, receives history and normally checks out a working copy.',stays:'Your future file edits and commits remain local until you share them.',note:'Your copy and Sam’s copy are already cloned in GitCraft. Repository URLs and authentication are covered in real-Git practice.',examples:[['git clone <repository-url>','Replace the placeholder with a repository you are authorized to access.']]},
 {id:'pull',group:'Collaborate',referenceOnly:true,summary:'Fetch and then integrate remote work.',when:'You deliberately want to receive and integrate changes in one operation.',changes:'Git fetches, then integrates according to the chosen options and branch configuration, such as merge or rebase.',stays:'It does not publish your commits or update someone else’s working folder.',note:'GitCraft keeps fetch and merge separate so you can observe both effects. pull is reference-only in this practice terminal.',examples:[['git pull --ff-only','Fetch and update only if a fast-forward is possible; otherwise stop.']]}
].map(command=>({...command,name:'git '+command.id,docs:'https://git-scm.com/docs/git-'+command.id}));
