<script>

  import { afterUpdate } from 'svelte';
  
  export let selected = 0;
  export let data = 0;

  let position = selected ? -(selected - 1) * 50 : 0;
  let offset = 0;
  let dragging = false;

  let itemWrapper, previousY;

  let itemPosition = `
      will-change: 'transform';
      transition: transform ${Math.abs(offset) / 100 + 0.1}s;
      transform: translateY(${position}px)
  `;
 

  afterUpdate(() => {
		let selectedPosition = -(selected - 1) * 50
    
    if (!dragging && position !== selectedPosition) {
        position: selectedPosition
    }

    itemWrapper.style.cssText = itemPosition;
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
    
    // this.props.onDateChange(this.props.type, -finalPosition / 50)
  }
  

</script>


<style>

</style>


<div class='year' on:mousedown={onMouseDown} on:touchstart={onMouseDown}>
  <ul bind:this={itemWrapper} >
   {#each data as item }
     <li>{item}</li>
   {/each}
  </ul>
</div>