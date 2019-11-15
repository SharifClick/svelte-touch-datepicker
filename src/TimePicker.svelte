<script>
  import Switcher from './Switcher.svelte';

  let m = 1;
  const HOURS = new Array(12).fill(1).map((v, i) => v + i);
  const MINUTES = new Array(59).fill(1).map((v, i) => v + i);
  const MERIDIEM = ['AM', 'PM'];


  export let date = new Date();
  export let visible = false;

  let resetDate = (event) => {
    event.stopPropagation()
    date = new Date();
  }

  let dateChanged = (event) => {

    let {type, changedData} = event.detail;
    let newDate = new Date();

    if (type === 'hours'){

      newDate.setHours(changedData + 13);
      newDate.setMinutes(date.getMinutes())

    } else if (type === 'minutes'){

      newDate.setHours(date.getHours())
      newDate.setMinutes(changedData + 1)

    } else if (type === 'meridiem'){

      newDate.setHours(date.getHours())
      newDate.setMinutes(date.getMinutes())
      m = changedData
    }

    date = newDate;
  }
</script>

<style>
.touch-date {
  font-size: 30px;
  font-weight: 300;
}

.touch-date-popup{
 position: absolute;
  top: 0;
  height: 100vh;
  width: 100vw;
  background: rgba(0, 0, 0, 0.3);
}
.touch-date-popup > div{
    background: white;
    margin-top: 30vh;
    width: 80%;
    margin-left: 7%;
    border-radius: 10px;
    padding: 10px;
}
.touch-date-wrapper{
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  font: 20px 'Roboto', sans-serif;
}

.touch-date-picker {
  display: flex;
  padding: 50px 20px;
  margin: 30px 0;
  overflow: hidden;
}

.touch-date-reset > button {
  width: 100px;
  height: 30px;
  border-radius: 15px;
  border: none;
  outline: none;
  color: #fff;
  background-color: #2466fb;
  box-shadow: 0 1px 10px -2px #2466fb;
  font-weight: 300;
}
.touch-date-reset:active {
  -webkit-transform: scale(0.95);
          transform: scale(0.95);
}

</style>


{#if visible}
  <div class="touch-date-popup" >
    <div>
      <div class="touch-date-wrapper">
          <div class='touch-date'>{ date.getHours() - 12 }:{ date.getMinutes() } { MERIDIEM[m] }</div>
          <div class='touch-date-picker'>
            <Switcher type='hours' data={HOURS} selected={date.getHours() - 12 } on:dateChange={dateChanged} }/>
            <Switcher type='minutes' data={MINUTES} selected={date.getMinutes() } on:dateChange={dateChanged}/>
            <Switcher type='meridiem' data={MERIDIEM} selected={m+1} on:dateChange={dateChanged}/>
          </div>
        <div class='touch-date-reset'>
          <button on:click={resetDate}>Reset</button>
          <button on:click={() => {visible = !visible}}>Ok</button>
        </div>
      </div>
    </div>
  </div>
{/if}

