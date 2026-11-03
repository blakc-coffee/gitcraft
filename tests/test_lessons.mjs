import test from 'node:test';
import assert from 'node:assert/strict';
import {isDone,restoreStep,lessons,TARGET,ACCESS} from '../gitcraft/web/lessons.mjs';
const fixture=()=>({mission:'staging',complete:false,events:[],views:{you:{tracking:'base',files:{'schedule.md':{working:TARGET,staged:'Start: 10:00\n',committed:'Start: 10:00\n'},'accessibility.md':{committed:'Pending\n'}}},origin:{head:'sam'}}});
test('editing a file cannot mark staging or committing complete',()=>{
 const state=fixture();assert.equal(isDone(state,'edit'),true);assert.equal(isDone(state,'prepare'),false);assert.equal(isDone(state,'commit'),false);
});
test('prepared content alone cannot mark a snapshot saved',()=>{
 const state=fixture();state.views.you.files['schedule.md'].staged=TARGET;assert.equal(isDone(state,'prepare'),true);assert.equal(isDone(state,'commit'),false);
});
test('fetch requires communication and does not imply integration or sharing',()=>{
 const state=fixture();state.mission='collaboration';state.events.push({command:'Authored teammate update'});
 assert.equal(isDone(state,'fetch'),false);state.views.you.tracking='sam';assert.equal(isDone(state,'fetch'),true);assert.equal(isDone(state,'merge'),false);assert.equal(isDone(state,'push'),false);
 state.views.you.files['schedule.md'].committed=TARGET;state.views.you.files['accessibility.md'].committed=ACCESS;
 assert.equal(isDone(state,'merge'),true);assert.equal(isDone(state,'push'),false);state.complete=true;assert.equal(isDone(state,'push'),true);
});
test('invalid stored progress returns safely to the lesson beginning',()=>{
 const state=fixture();for(const value of [-1,99,'bad',undefined,2.5])assert.equal(restoreStep(value,state),0);assert.equal(restoreStep('3',state),3);
});
test('every practical step introduces its command or action and provides help',()=>{
 for(const course of Object.values(lessons))for(const step of course.steps){assert.ok(step.body);assert.ok(step.help);assert.ok(step.action);if(step.kind==='command'){assert.ok(step.command.startsWith('git '));assert.ok(step.meaning);}}
});
