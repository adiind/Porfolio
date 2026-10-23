// Use the artwork's alpha silhouette for pointer targets, including in static mode.
const hulls=new Map();
function convexHull(points){
 const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
 points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const lower=[],upper=[];
 for(const p of points){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p)}
 for(const p of [...points].reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p)}
 return lower.slice(0,-1).concat(upper.slice(0,-1));
}
async function silhouette(url){
 if(!hulls.has(url))hulls.set(url,(async()=>{
  const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');
  const factor=200/Math.max(img.width,img.height);canvas.width=Math.ceil(img.width*factor);canvas.height=Math.ceil(img.height*factor);
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,canvas.width,canvas.height);const {data}=ctx.getImageData(0,0,canvas.width,canvas.height),points=[];
  for(let y=0;y<canvas.height;y+=2)for(let x=0;x<canvas.width;x+=2)if(data[(y*canvas.width+x)*4+3]>80)points.push([x/canvas.width-.5,y/canvas.height-.5]);
  return{ratio:img.width/img.height,points:convexHull(points)};
 })());return hulls.get(url);
}
export function fitHitShape(button,url,angle,hero=false){
 silhouette(url).then(({ratio,points})=>{
  if(!button.isConnected)return;const w=button.clientWidth,h=button.clientHeight;
  const artW=Math.min(w*(hero?1:.84),h*(hero?1:.80)*ratio),artH=artW/ratio;
  const rad=-angle*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad);
  button.querySelector('.sticker-hit').style.clipPath=`polygon(${points.map(([x,y])=>`${50+(x*artW*c-y*artH*s)/w*100}% ${50+(x*artW*s+y*artH*c)/h*100}%`).join(',')})`;
 }).catch(()=>{}); // The default inset ellipse remains usable if an image fails to decode.
}
