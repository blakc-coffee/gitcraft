// Bound both the request and response body. A timeout never implies rollback.
export async function requestJSON(url, options={}, {timeout=20000, fetcher=fetch}={}) {
 const controller=new AbortController();
 let timer;
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Request timed out; outcome unknown.'));},timeout);});
 try {
  return await Promise.race([(async()=>{const response=await fetcher(url,{...options,signal:controller.signal});return {response,result:await response.json()};})(),deadline]);
 } finally {clearTimeout(timer);}
}
