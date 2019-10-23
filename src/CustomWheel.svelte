<script>

  export let selected = 0;
  let position = selected ? -(selected - 1) * 50 : 0 }
  let offset = 0
  let dragging = false;

  let itemWrapper;

  let itemPosition = `
      will-change: 'transform';
      transition: transform ${Math.abs(offset) / 100 + 0.1}s;
      transform: translateY(${position}px)
  `


  let onMouseDown = () => {}

</script>


<style>

</style>


<div class='year' on:mouseDown={onMouseDown} on:touchStart={onMouseDown}>
  <ul bind:this={itemWrapper}>
    
  </ul>
</div>