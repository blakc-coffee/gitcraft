import test from 'node:test';
import assert from 'node:assert/strict';
import {commandFeedback} from '../gitcraft/web/playground.mjs';

function fixture(){return {views:{you:{bare:false,branch:'main',head:'a',files:{'README.md':{working:'A',staged:'A',committed:'A'}},graph:{commits:[{id:'a',parents:[]}],refs:[{name:'refs/heads/main',target:'a'},{name:'refs/remotes/origin/main',target:'a'}]}},origin:{bare:true,head:'a',files:{},graph:{commits:[{id:'a',parents:[]}],refs:[{name:'refs/heads/main',target:'a'}]}}}};}
const clone=value=>structuredClone(value);
const describe=(before,after,command,output='',code=0,extra={})=>commandFeedback(before,after,'you',command,{code,output,...extra});

test('empty commits distinguish unstaged work from no change, without guessing at unknown errors',()=>{
 const before=fixture(),after=clone(before);after.views.you.files['README.md'].working='B';
 const unstaged=describe(before,after,'git commit -m "Update"','no changes added to commit',1);
 assert.match(unstaged.summary,/not staged/);assert.match(unstaged.hint,/git diff/);assert.equal(unstaged.tone,'info');
 assert.match(describe(before,before,'git commit -m "Update"','nothing to commit',1).summary,/no staged change/);
 assert.match(describe(before,after,'git commit -m "Update"','unexpected object error',1).summary,/reported an error/);
});
test('an empty working diff does not hide existing staged changes or browser drafts',()=>{
 const before=fixture();before.views.you.files['README.md']={working:'B',staged:'B',committed:'A'};
 const result=describe(before,before,'git diff');assert.match(result.summary,/match staging/);assert.match(result.hint,/still staged/);
 assert.match(describe(before,before,'git diff','',0,{hasDraft:true}).summary,/unsaved browser draft/);
});
test('staging and the two restore operations explain different effects',()=>{
 const before=fixture();before.views.you.files['README.md'].working='B';const staged=clone(before);staged.views.you.files['README.md'].staged='B';
 assert.equal(describe(before,staged,'git add README.md').summary,'Staged README.md.');
 assert.match(describe(staged,before,'git restore --staged README.md').summary,/Unstaged/);
 const later=clone(staged);later.views.you.files['README.md'].working='C';
 const restored=describe(later,staged,'git restore README.md');assert.match(restored.summary,/with its staged version/);assert.match(restored.hint,/Staged changes still remain/);assert.doesNotMatch(restored.summary,/Unstaged/);
});
test('commit feedback reports the new native HEAD and edits left outside it',()=>{
 const before=fixture();before.views.you.files['README.md']={working:'C',staged:'B',committed:'A'};
 const after=clone(before);after.views.you.head='b123456789';after.views.you.files['README.md'].committed='B';
 const result=describe(before,after,'git commit -m "Update"');assert.match(result.summary,/b123456/);assert.match(result.hint,/unstaged edits outside this commit/);assert.match(result.hint,/does not publish/);
});
test('fetch and merge abort never claim local integration or a new merge commit',()=>{
 const before=fixture(),after=clone(before);after.views.you.graph.refs[1].target='b';
 const fetched=describe(before,after,'git fetch origin');assert.match(fetched.summary,/remembered Shared refs/);assert.match(fetched.hint,/not merged/);
 assert.match(describe(after,before,'git merge --abort').summary,/Stopped the in-progress merge/);
});
test('push rejection and missing upstream give explicit, non-forcing next steps',()=>{
 const before=fixture();const rejected=describe(before,before,'git push','! [rejected] main -> main (fetch first)',1);
 assert.match(rejected.hint,/git fetch origin/);assert.doesNotMatch(rejected.hint,/--force/);
 before.views.you.branch='reading-list';assert.match(describe(before,before,'git push','has no upstream branch',1).hint,/git push -u origin reading-list/);
});
test('branch errors distinguish protecting edits, a missing name and an existing name',()=>{
 const before=fixture();
 assert.match(describe(before,before,'git switch other','Your local changes would be overwritten by checkout',1).summary,/protect local edits/);
 assert.match(describe(before,before,'git switch other','fatal: invalid reference: other',1).hint,/git branch/);
 assert.match(describe(before,before,'git switch -c main',"fatal: a branch named 'main' already exists",1).summary,/already exists/);
});
test('unresolved native index entries produce file-specific recovery guidance',()=>{
 const before=fixture(),after=clone(before);after.views.you.files['README.md']={working:'conflict markers',staged:null,committed:'A'};
 const result=describe(before,after,'git merge origin/main','CONFLICT',1);assert.match(result.summary,/README.md/);assert.match(result.hint,/Nothing was resolved for you/);
});
test('transport and server failures preserve uncertainty even if the inspected state looks unchanged',()=>{
 const state=fixture();
 for(const requestStatus of [0,500]){const result=describe(state,state,'git commit -m "Update"','request error',1,{requestStatus});assert.match(result.summary,/could not be confirmed/);assert.match(result.hint,/may have run/);assert.doesNotMatch(result.summary,/did not run|No commit was created/);}
 assert.match(describe(state,state,'git reset --hard','No command ran',1,{requestStatus:400}).summary,/did not run/);
 const unknown400=describe(state,state,'git add README.md','Unexpected inspection error',1,{requestStatus:400});assert.doesNotMatch(unknown400.summary,/did not run/);assert.match(unknown400.hint,/git status before retrying/);
 assert.match(describe(state,state,'git status','Wrong token',1,{requestStatus:403}).hint,/Refresh/);
});
