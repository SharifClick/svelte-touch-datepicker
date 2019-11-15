<script>
  import { afterUpdate} from 'svelte';
  import {DatePicker, TimePicker}  from "../src/index.js";

  export let mode = 'time';

  let date = new Date();
  let visible = false;
  let inputDate;

  afterUpdate(() => {
	  
  });

  function toggle(){
    visible = !visible
  }

  $: _date = date.toLocaleDateString("en-US");
  $: _inputdate = new Date(inputDate);





</script>

<style>
  .container{
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
    <p on:click={toggle}>{_date}</p>
    <input type="text" readonly value={_date} on:focus={toggle}>
    <DatePicker bind:date bind:visible/>
  </div>
</div>

