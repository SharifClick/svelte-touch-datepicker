<script>

  export let selected = 0;
  let position = selected ? -(selected - 1) * 50 : 0 }
  let offset = 0
  let dragging = false;


  let onMouseDown = () => {}

</script>


<style>

</style>


<div class='dragdealer year' on:mouseDown={onMouseDown} on:touchStart={onMouseDown}>
  <ul class='handle'>
    
  </ul>
</div>