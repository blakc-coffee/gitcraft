const previews={
 workspace:{src:'/assets/workspace.jpg',alt:'GitCraft workspace showing bookshop notes beside real git diff --staged output.',caption:'Edit a small project, run real Git commands, and inspect exactly what you staged.'},
 collaboration:{src:'/assets/collaboration.jpg',alt:'GitCraft comparison showing separate local, remembered and shared branch positions.',caption:'Compare your copy, Sam’s copy, and Shared. Publishing does not update someone else’s working files.'},
 commands:{src:'/assets/commands.jpg',alt:'GitCraft command reference explaining git add, its effects, and an example.',caption:'Look up what a command changes, then put an example in your terminal. You decide when to run it.'}
};
const motion=matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('[data-home-preview]').forEach(button=>button.addEventListener('click',()=>{
 const preview=previews[button.dataset.homePreview],image=document.getElementById('home-preview-image');
 if(button.getAttribute('aria-pressed')==='true')return;
 document.querySelectorAll('[data-home-preview]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 image.src=preview.src;image.alt=preview.alt;document.getElementById('home-preview-caption').textContent=preview.caption;
 if(!motion.matches)image.animate([{opacity:.65,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.16,1,.3,1)'});
}));
// Content is visible without motion or JavaScript. Animate once on entry only.
const animated=new WeakSet();
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting||animated.has(entry.target))continue;animated.add(entry.target);observer.unobserve(entry.target);if(!motion.matches)entry.target.animate([{opacity:.72,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});}}, {threshold:.12});
 document.querySelectorAll('[data-home-reveal]').forEach(element=>observer.observe(element));
 motion.addEventListener('change',()=>{if(motion.matches)for(const animation of document.getElementById('landing').getAnimations({subtree:true}))animation.cancel();});
}
