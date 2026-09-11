// Render private local drawings; generated sheets are deliberately gitignored.
import { existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const source=fileURLToPath(new URL('../../blueprint.pdf',import.meta.url));
const target=fileURLToPath(new URL('../public/local-references/',import.meta.url));
if(existsSync(source)){
  mkdirSync(target,{recursive:true});
  const result=spawnSync('pdftoppm',['-f','1','-l','3','-scale-to','3000','-png',source,target+'sheet'],{stdio:'inherit'});
  if(result.error||result.status!==0){console.error('Unable to render local reference sheets. Install Poppler and run npm run references.');process.exitCode=1;}
  // Crop only surrounding page furniture, retaining the plan and its dimension chains.
  // Original full-sheet images are also available in the comparison pane.
  for(const [index,[x,y,w,h]] of [[590,25,1900,1780],[615,25,1760,1550],[830,165,1500,1150]].entries()){
    const page=String(index+1);
    const crop=spawnSync('pdftoppm',['-f',page,'-l',page,'-singlefile','-scale-to','3000','-x',String(x),'-y',String(y),'-W',String(w),'-H',String(h),'-png',source,target+'plan-'+page],{stdio:'inherit'});
    if(crop.error||crop.status!==0)process.exitCode=1;
  }
}else console.log('No local blueprint.pdf found; the comparison view will show instructions.');
