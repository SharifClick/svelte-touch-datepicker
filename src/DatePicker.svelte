<script>
  
  import { ItemWheel } from './index.js';

    import { afterUpdate } from 'svelte';

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
  const YEARS = new Array(201).fill(1900).map((value, index) => value + index);
  const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


  let date = new Date();

  let resetDate = () => {
    date = new Date();
  }


  $: DAYS = new Array( new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() ).fill(1).map((value, index) => value + index)

  let dateChanged = (event) => {

    let {type, changedData} = event.detail;
    let newDate
    
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
.date {
  font-size: 30px;
  font-weight: 300;
}
.date-picker {
  display: flex;
  padding: 50px 20px;
  margin: 30px 0;
  overflow: hidden;
}

.reset {
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
.reset:active {
  -webkit-transform: scale(0.95);
          transform: scale(0.95);
}

  
</style>


<div class='date'>{ date.getDate() } { MONTHS[date.getMonth()] } { date.getFullYear() }</div>
<p>{ WEEKDAY[date.getDay()] }</p>
  <div class='date-picker'>
      <ItemWheel type='day' data={DAYS} selected={date.getDate()} on:dateChange={dateChanged} }/>
      <ItemWheel type='month' data={MONTHS} selected={date.getMonth() + 1} on:dateChange={dateChanged}/>
      <ItemWheel type='year' data={YEARS} selected={date.getYear() + 1} on:dateChange={dateChanged}/>
  </div>
<button class='reset' on:click={resetDate}>Reset Date</button>

