<script>

  import { afterUpdate, onMount } from 'svelte';
  
  export let selected;
  export let data = 0;

  let position = selected ? -(selected - 1) * 50 : 0;

  
  let offset = 0;
  let dragging = false;

  let itemWrapper, previousY;

  export let onDateChange = () => {};
  export let type;

  onMount(() => {
		
   setPosition()
  });

  

  afterUpdate(() => {
		let selectedPosition = -(selected - 1) * 50
    
    if (!dragging && position !== selectedPosition) {
        position: selectedPosition
    }
    console.log('afterupdate')
    // itemWrapper.scrollTop = 200
  });


  function setPosition(){
     let itemPosition = `
      will-change: 'transform';
      transition: transform ${Math.abs(offset) / 100 + 0.1}s;
      transform: translateY(${position}px)
    `;
    itemWrapper.style.cssText = itemPosition;
  }

  let onMouseDown = (event) => {
    previousY = event.touches ? event.touches[0].clientY : event.clientY;
    dragging = true;
    
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchmove', onMouseMove)
    window.addEventListener('touchend', onMouseUp)
  }

   let onMouseMove = (event) => {
    let clientY = event.touches ? event.touches[0].clientY : event.clientY;

    offset = clientY - previousY

    let maxPosition = -data.length * 50
    let _position = position + offset
   
    position = Math.max(maxPosition, Math.min(50, _position))

    previousY = event.touches ? event.touches[0].clientY : event.clientY;


    setPosition();
  }

  let onMouseUp = () => {
    // calculate closeset snap
    let maxPosition = -(data.length - 1) * 50;
    let rounderPosition = Math.round((position + offset * 5) / 50) * 50;
    let finalPosition = Math.max(maxPosition, Math.min(0, rounderPosition));
    
    dragging = false;
    position = finalPosition;
    
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('touchmove', onMouseMove)
    window.removeEventListener('touchend', onMouseUp)
    
    onDateChange(type, -finalPosition / 50)
  }
  

</script>


<style>
 .item-wrapper {
  position: relative;
  height: 50px;
  margin: 0 10px;
  border-top: 1px solid #0522f3;
  border-bottom: 1px solid #0522f3;
  border-radius: 0;
}
.item-container {
  margin: 0;
  padding: 0;
}

.item-wrapper:before,
.item-wrapper:after {
  content: '';
  position: absolute;
  left: 0;
  width: 80px;
  height: 50px;
  background-color: #fff;
  opacity: 0.8;
  pointer-events: none;
  z-index: 1;
}

.item-wrapper:before {
  top: -51px;
}

.item-wrapper:after {
  bottom: -51px;
}

.item-container li {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 50px;
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
}
</style>


<div class='item-wrapper' on:mousedown={onMouseDown} on:touchstart={onMouseDown}>
  <ul bind:this={itemWrapper} class="item-container">
   {#each data as item }
     <li>{item}</li>
   {/each}
  </ul>
</div>