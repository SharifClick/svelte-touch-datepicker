<script>

  import { afterUpdate } from 'svelte';
  
  export let selected = 0;
  export let data = 0;

  let position = selected ? -(selected - 1) * 50 : 0;
  let offset = 0;
  let dragging = false;

  let itemWrapper, previousY;

  export let onDateChange = () => {};
  export let type;

  let itemPosition;
 

  afterUpdate(() => {
		let selectedPosition = -(selected - 1) * 50
    
    if (!dragging && position !== selectedPosition) {
        position: selectedPosition
    }
   itemPosition = `
      will-change: 'transform';
      transition: transform ${Math.abs(offset) / 100 + 0.1}s;
      transform: translateY(${position}px)
    `;
    console.log('afterupdate')
  });

  let onMouseDown = (event) => {
    previousY = event.touches ? event.touches[0].clientY : event.clientY;
    dragging = true;
    
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('touchmove', onMouseMove)
    document.addEventListener('touchend', onMouseUp)
  }

   let onMouseMove = (event) => {
    let clientY = event.touches ? event.touches[0].clientY : event.clientY;

    offset = clientY - previousY
    
    let maxPosition = -data.length * 50
    let _position = position + offset
    
    position = Math.max(maxPosition, Math.min(50, _position))

    previousY = event.touches ? event.touches[0].clientY : event.clientY;

    itemWrapper.style.cssText = itemPosition;
  }

  let onMouseUp = () => {
    // calculate closeset snap
    let maxPosition = -(data.length - 1) * 50;
    let rounderPosition = Math.round((position + offset * 5) / 50) * 50;
    let finalPosition = Math.max(maxPosition, Math.min(0, rounderPosition));
    
    dragging = false;
    position = finalPosition;
    
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.removeEventListener('touchmove', onMouseMove)
    document.removeEventListener('touchend', onMouseUp)
    
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

.item-container:before,
.item-container:after {
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

.item-container:before {
  top: -51px;
}

.item-container:after {
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