<script>
  import DatePicker  from "../src/index.js";
 

</script>

<style>
  .container, .is-stack{
    height: 100%;
    width: 100%;
  }

  * {
    box-sizing: border-box;
  }
  body {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  .center {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    font: 20px 'Roboto', sans-serif;
  }
  
</style>

<div class="container" >
  <div class="center">
    <DatePicker />
  </div>
</div>

