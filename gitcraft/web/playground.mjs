export const fileNames = ['schedule.md','accessibility.md'];
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
