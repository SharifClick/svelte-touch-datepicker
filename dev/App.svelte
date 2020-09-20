<script>
  import DatePicker  from "../src/index.js";


  let date = new Date();
  $: _date = date.toLocaleDateString("en-US");


  function dateChanged(event) {
    console.log(event.detail)
  }

  function confirmDate(event) {
    console.log(event.detail)
  }


</script>

<style>

  /* :root{
    --svtd-bar-color: #0522f3;
    --svtd-button-color: white;
    --svtd-button-bg-color: #2466fb;
    --svtd-border: none;
    --svtd-button-box-shadow:0 1px 10px -2px #2466fb;
  }   */


  .container{
    height: 100%;
    width: 100%;
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
    <p>Date: {_date}</p>
    <DatePicker bind:date on:dateChange={dateChanged} on:confirmDate={confirmDate}/>
  </div>
</div>

