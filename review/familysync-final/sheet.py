import sys,glob,os
from PIL import Image
src,out,cols,w=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4])
fs=sorted(glob.glob(src+'/*.png')+glob.glob(src+'/*.jpg'))
ims=[Image.open(f).convert('RGB') for f in fs]
ims=[i.resize((w,int(i.height*w/i.width))) for i in ims]
h=max(i.height for i in ims);rows=(len(ims)+cols-1)//cols
S=Image.new('RGB',(cols*w+(cols+1)*8,rows*h+(rows+1)*8),(40,40,40))
for n,i in enumerate(ims):S.paste(i,(8+(n%cols)*(w+8),8+(n//cols)*(h+8)))
S.save(out,quality=82)
