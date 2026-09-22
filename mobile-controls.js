/* Touch controls for the existing metre-based scene. */
(()=>{
 const compact=matchMedia('(max-width:900px)'),touchDevice=matchMedia('(pointer:coarse)').matches||compact.matches;
 const main=host.closest('main'),bar=document.createElement('div');bar.className='viewer-controls';bar.setAttribute('aria-label','3D 조작');
 bar.innerHTML='<button data-gesture="rotate" aria-pressed="true">회전</button><button data-gesture="pan" aria-pressed="false">이동</button><button data-zoom="in" aria-label="3D 확대">＋</button><button data-zoom="out" aria-label="3D 축소">−</button><button data-reset>초기화</button><button class="expand" aria-expanded="false">크게 보기</button><button class="overview">평면 보기</button><button class="quick-names" aria-pressed="true" aria-label="구역 이름 표시">이름</button><p class="gesture-help" aria-live="polite"></p>';
 main.append(bar);
 const hint=bar.querySelector('.gesture-help');let mode='rotate',expanded=false,returnFocus=null,savedY=0;
 function setMode(next){mode=next;controls.touches.ONE=next==='pan'?T.TOUCH.PAN:T.TOUCH.ROTATE;controls.mouseButtons.LEFT=next==='pan'?T.MOUSE.PAN:T.MOUSE.ROTATE;bar.querySelectorAll('[data-gesture]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gesture===next)));hint.textContent=touchDevice?'한 손가락: '+(next==='pan'?'이동':'회전')+' · 두 손가락: 확대·축소·이동':'드래그: '+(next==='pan'?'이동':'회전')+' · 휠: 확대·축소';}
 controls.touches.TWO=T.TOUCH.DOLLY_PAN;controls.rotateSpeed=touchDevice?.42:.8;controls.panSpeed=touchDevice?.65:1;controls.zoomSpeed=.75;controls.dampingFactor=.13;controls.screenSpacePanning=false;controls.minPolarAngle=.04;
 controls.minDistance=8;controls.maxDistance=320;
 // Keep the orbit centre on the event area, so a stray drag cannot lose the scene.
 const targetMin=new T.Vector3(-45,0,-16),targetMax=new T.Vector3(45,4,17);
 controls.addEventListener('change',()=>{const before=controls.target.clone();controls.target.clamp(targetMin,targetMax);camera.position.add(controls.target.clone().sub(before));});
 if(touchDevice){renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));renderer.shadowMap.enabled=false;}
 // Combine identical furniture parts, preserving each parent visibility switch.
 function batch(group){
  for(const child of [...group.children])if(child.isGroup)batch(child);
  const batches=new Map();
  for(const m of group.children){if(!m.isMesh||m.isInstancedMesh||m.geometry.type!=='BoxGeometry'||Array.isArray(m.material))continue;const key=JSON.stringify(m.geometry.parameters)+'|'+m.material.uuid+'|'+m.castShadow+'|'+m.receiveShadow;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(m);}
  for(const list of batches.values()){if(list.length<3)continue;const first=list[0],mesh=new T.InstancedMesh(first.geometry,first.material,list.length);mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;list.forEach((m,i)=>{m.updateMatrix();mesh.setMatrixAt(i,m.matrix);group.remove(m);});mesh.computeBoundingSphere();group.add(mesh);}
 }
 batch(scene);
 function resetView(){setMode('rotate');preset('all');if(compact.matches){const factor=Math.max(1,Math.min(3.6,1.5/(host.clientWidth/host.clientHeight)));camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();}}
 bar.querySelectorAll('[data-gesture]').forEach(b=>b.onclick=()=>setMode(b.dataset.gesture));
 bar.querySelectorAll('[data-zoom]').forEach(b=>b.onclick=()=>{const offset=camera.position.clone().sub(controls.target),distance=T.MathUtils.clamp(offset.length()*(b.dataset.zoom==='in'?.8:1.25),controls.minDistance,controls.maxDistance);offset.setLength(distance);camera.position.copy(controls.target).add(offset);controls.update();});
 bar.querySelector('[data-reset]').onclick=resetView;
 bar.querySelector('.overview').onclick=()=>{preset('top');if(compact.matches){camera.position.sub(controls.target).multiplyScalar(Math.max(1,Math.min(3.6,1.5/(host.clientWidth/host.clientHeight)))).add(controls.target);controls.update();}setMode('pan');};
 const quickNames=bar.querySelector('.quick-names');quickNames.onclick=()=>{document.getElementById('label-hide').click();quickNames.setAttribute('aria-pressed',String(names.visible));};document.getElementById('names').addEventListener('change',()=>quickNames.setAttribute('aria-pressed',String(names.visible)));
 document.getElementById('label-hide').addEventListener('click',()=>quickNames.setAttribute('aria-pressed',String(names.visible)));
 document.querySelector('[data-view=all]').onclick=resetView;document.querySelector('[data-view=top]').onclick=()=>bar.querySelector('.overview').click();
 const expand=bar.querySelector('.expand');
 function setExpanded(value){const oldAspect=host.clientWidth/host.clientHeight;expanded=value;if(value){savedY=scrollY;returnFocus=document.activeElement;}document.body.classList.toggle('model-expanded',value);expand.textContent=value?'크게 보기 닫기':'크게 보기';expand.setAttribute('aria-expanded',String(value));if(value)expand.focus({preventScroll:true});else{window.scrollTo(0,savedY);returnFocus?.focus({preventScroll:true});}requestAnimationFrame(()=>{resize();const nextAspect=host.clientWidth/host.clientHeight;camera.position.sub(controls.target).multiplyScalar(oldAspect/nextAspect).add(controls.target);controls.update();});}
 expand.onclick=()=>setExpanded(!expanded);
 document.addEventListener('keydown',e=>{if(expanded&&e.key==='Escape')setExpanded(false);if(expanded&&e.key==='Tab'){const buttons=[...main.querySelectorAll('button')].filter(b=>b.offsetParent!==null);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 addEventListener('hashchange',()=>{if(expanded&&location.hash!=='#model')setExpanded(false);});
 new ResizeObserver(()=>resize()).observe(host);
 host.querySelector('.badge').textContent='현장 실측을 반영한 배치 계획 · 미실측 지형은 개념 표현';
 setMode('rotate');if(touchDevice){let saved=null;try{saved=localStorage.getItem('gm-label-size');}catch{}if(!saved)changeLabel(60);}resetView();
})();
