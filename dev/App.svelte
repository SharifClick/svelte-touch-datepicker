<script>
  import { afterUpdate} from 'svelte';
  import {DatePicker, TimePicker}  from "../src/index.js";

  export let mode = 'time';

  let date = new Date();
  let time = new Date();
  let visible = false;
  let visibleTime = false;
  let inputDate;

  afterUpdate(() => {
	  
  });

  function toggle(){
    visible = !visible
  }
   function toggleTime(){
    visibleTime = !visibleTime
  }

  $: _date = date.toLocaleDateString("en-US");
  // $: _time = time.toLocaleTimeString("en-US");
  $: _inputdate = new Date(inputDate);





</script>

<style>
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
    <p on:click={toggle}>{_date}</p>
    <input type="text" readonly value={_date} on:focus={toggle}>
    <DatePicker bind:date bind:visible/>

    <hr>
    <p on:click={toggle}>{time}</p>
    
    <TimePicker bind:time/>
  </div>
</div>

