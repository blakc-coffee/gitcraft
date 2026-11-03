export const TARGET = '# Community day\nStart: 11:00\n';
export const ACCESS = 'Step-free entrance: north door.\n';
const edit = {id:'edit',title:'Make one small change.',body:'This is a text file for a community event. Change its start time from 10:00 to 11:00. Saving edits changes the file on your computer.',action:'Save my change',kind:'edit',success:'Your file now says 11:00. Next, we’ll choose this change for a Git snapshot.',help:'Type 11:00 in the Start time box, then choose Save my change. You can change it again whenever you need.'};
const prepare = {id:'prepare',title:'Choose what to save.',body:'Git lets you choose which changes belong in your next snapshot. Preparing a file is called staging. Let’s prepare your updated schedule.',action:'Prepare this file',kind:'command',command:'git add schedule.md',meaning:'Prepare the current version of schedule.md for the next snapshot.',success:'Your updated schedule is prepared. It is ready to become a snapshot.',help:'“git” selects Git. “add” prepares a file. “schedule.md” names the file. You can use the button first; memorising this is not required.'};
const commit = {id:'commit',title:'Save your first snapshot.',body:'A commit is a snapshot Git remembers. Give it a short message so you can recognise the change later.',action:'Save a snapshot',kind:'command',command:'git commit -m "Correct start time"',meaning:'Save the prepared change with the message “Correct start time”.',success:'You made a commit. Git now remembers the 11:00 version of your schedule.',help:'“commit” saves the prepared snapshot. “-m” introduces its message. The words in quotes describe your change.'};
export const lessons = {
 staging:{name:'Your first snapshot',steps:[
  {id:'intro',title:'Save your first change.',body:'Git keeps a history of your files. You’ll change this event’s start time and save a version you can return to.',action:'Let’s try it',kind:'intro',help:'You’re working on a practice project. Take your time, repeat any step, and ask for help whenever you need.'},
  edit,prepare,commit,
  {id:'finish',title:'That’s your first commit.',body:'You edited a file, chose what to include, and saved a snapshot. Those three actions are the foundation of everyday Git.',action:'Learn with a teammate',kind:'finish',help:'Saving a file changes the document. Staging chooses content. Committing records that content in Git. We’ll keep practising each idea.'}
 ]},
 collaboration:{name:'Working with Sam',steps:[
  {id:'intro',title:'Let’s work with Sam.',body:'You and Sam each have a copy of the event project. A shared repository is the meeting place where you exchange saved changes.',action:'Start together',kind:'intro',help:'A repository is a project and its Git history. Your copy and Sam’s copy stay independent until you exchange changes.'},
  {...edit,title:'Make your part of the change.'},prepare,
  {...commit,title:'Save your change in Git.',success:'Your 11:00 snapshot is saved in your own copy. It has not been shared yet.'},
  {id:'sam',title:'Sam has a change too.',body:'Sam is adding the step-free entrance details. She’ll save a commit and send it to the shared repository. Sending commits is called pushing.',action:'Let Sam share her change',kind:'teammate',success:'Sam’s change is shared. Your own file has not changed automatically.',help:'A push sends saved commits to the shared repository. It does not rewrite someone else’s working files.'},
  {id:'fetch',title:'Find out what Sam shared.',body:'Your copy still has the old entrance note. Fetch asks the shared repository for new commits, so your Git can learn about Sam’s update.',action:'Get Sam’s update',kind:'command',command:'git fetch origin',meaning:'Get new commits from the shared repository, called origin.',success:'Git has received Sam’s commit. Your file is still unchanged; next, we’ll combine the work.',help:'“origin” is a nickname for the shared repository. Fetch receives commits without changing your current files.'},
  {id:'merge',title:'Bring the changes together.',body:'Now combine Sam’s entrance update with your start-time change. Git calls combining lines of work a merge.',action:'Combine our work',kind:'command',command:'git merge origin/main',meaning:'Combine the shared main branch you just fetched with your own work.',success:'Your copy now has both the 11:00 time and Sam’s step-free entrance details.',help:'“main” names the project’s starting branch, or line of work. “origin/main” is your local record of that shared branch after fetching.'},
  {id:'push',title:'Share the combined version.',body:'Both changes are together in your copy. Send the combined commits to the shared repository so Sam can receive them too.',action:'Share our work',kind:'command',command:'git push',meaning:'Send your saved commits to the shared repository.',success:'The shared repository now includes both contributions. Sam can receive them with fetch and merge too.',help:'Push shares commits. It does not share edits that have only been saved in a file, or prepared without a commit.'},
  {id:'finish',title:'You brought two people’s work together.',body:'You saved your own change, received Sam’s commit, combined the work, and shared the result. Each copy updated through a deliberate action.',action:'Review my first snapshot',kind:'finish',help:'Fetch receives. Merge combines. Push shares. You can revisit any step or explore the real workspaces below.'}
 ]}
};
export function isDone(state,id){
 const files=state.views.you.files;
 switch(id){
  case 'intro':case 'finish':return true;
  case 'edit':return files['schedule.md'].working===TARGET;
  case 'prepare':return files['schedule.md'].staged===TARGET;
  case 'commit':return files['schedule.md'].committed===TARGET;
  case 'sam':return state.events.some(event=>event.command==='Authored teammate update');
  case 'fetch':return isDone(state,'sam')&&state.views.you.tracking===state.views.origin.head;
  case 'merge':return isDone(state,'commit')&&files['accessibility.md'].committed===ACCESS;
  case 'push':return state.complete;
  default:return false;
 }
}
export function restoreStep(storage,state){const value=Number(storage);return Number.isInteger(value)&&value>=0&&value<lessons[state.mission].steps.length?value:0;}
