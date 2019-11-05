<script>
  
  import DateSwitcher from './DateSwitcher.svelte';

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
  const YEARS = new Array(201).fill(1900).map((v, i) => v + i);
  const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  export let mode = 'time';

  const HOURS = new Array(24).fill(1).map((v, i) => v + i);
  const MINUTES = new Array(60).fill(1).map((v, i) => v + i);

  const MERIDIEM = ['am', 'pm'];


  $: DAYS = new Array( new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() ).fill(1).map((v, i) => v + i)

  export let date = new Date();
  export let visible = false;

  let resetDate = (event) => {
    event.stopPropagation()
    date = new Date();
  }

  let dateChanged = (event) => {

    let {type, changedData} = event.detail;
    let newDate;
    
    if (type === 'day') {
    
      newDate = new Date(date.getFullYear(), date.getMonth(), changedData + 1)
    
    } else if (type === 'month') {
      
      let maxDayInSelectedMonth = new Date(date.getFullYear(), changedData + 1, 0).getDate()
      let day = Math.min(date.getDate(), maxDayInSelectedMonth)
      
      newDate = new Date(date.getFullYear(), changedData, day)
    
    } else if (type === 'year') {
      
      let maxDayInSelectedMonth = new Date(1900 + changedData, date.getMonth() + 1, 0).getDate()
      let day = Math.min(date.getDate(), maxDayInSelectedMonth)
      newDate = new Date(1900 + changedData, date.getMonth(), day)
    
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
  <div class="touch-date-popup" on:click={() => {visible = !visible}}>
    <div>
      <div class="touch-date-wrapper">
        {#if mode == 'date'}
          <div class='touch-date'>{ date.getDate() } { MONTHS[date.getMonth()] } { date.getFullYear() }</div>
          <p>{ WEEKDAY[date.getDay()] }</p>
          <div class='touch-date-picker'>
            <DateSwitcher type='day' data={DAYS} selected={date.getDate()} on:dateChange={dateChanged} }/>
            <DateSwitcher type='month' data={MONTHS} selected={date.getMonth() + 1} on:dateChange={dateChanged}/>
            <DateSwitcher type='year' data={YEARS} selected={date.getYear() + 1} on:dateChange={dateChanged}/>
          </div>
        {/if}

        {#if mode == 'time'}
          <div class='touch-date'>{ date.getDate() } { MONTHS[date.getMonth()] } { date.getFullYear() }</div>
          <p>{ WEEKDAY[date.getDay()] }</p>
          <div class='touch-date-picker'>
            <DateSwitcher type='hours' data={HOURS} selected={date.getHours()} on:dateChange={dateChanged} }/>
            <DateSwitcher type='minutes' data={MINUTES} selected={date.getMinutes() + 1} on:dateChange={dateChanged}/>
            <DateSwitcher type='year' data={MERIDIEM} selected={'am'} on:dateChange={dateChanged}/>
          </div>
        {/if}
        <div class='touch-date-reset'>
          <button on:click={resetDate}>Reset</button>
          <button on:click={() => {visible = !visible}}>Ok</button>
        </div>
      </div>
    </div>
  </div>
{/if}

