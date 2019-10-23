<script>

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
  const YEARS = new Array(201).fill(1900).map((value, index) => value + index);

  let date = new Date();

  resetDate = () => {
    date = new Date();
  }

  dateChanged = (type, changedData) => {
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

    // onDateChange(newDate)
  }
  
</script>

<style>
.center {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  font: 16px 'Roboto', sans-serif;
  -webkit-transform: scale(1.3);
          transform: scale(1.3);
}
.center .date {
  font-size: 30px;
  font-weight: 300;
}
.center .date-picker {
  display: flex;
  padding: 50px 20px;
  margin: 30px 0;
  overflow: hidden;
}
.center .day,
.center .month,
.center .year {
  position: relative;
  height: 50px;
  margin: 0 10px;
  border-top: 1px solid #0522f3;
  border-bottom: 1px solid #0522f3;
  border-radius: 0;
}
.center .day:before,
.center .month:before,
.center .year:before,
.center .day:after,
.center .month:after,
.center .year:after {
  content: '';
  position: absolute;
  left: 0;
  width: 80px;
  height: 50px;
  background-color: #fff;
  opacity: 0.8;
  pointer-events: none;
  z-index: 1;
}
.center .day:before,
.center .month:before,
.center .year:before {
  top: -51px;
}
.center .day:after,
.center .month:after,
.center .year:after {
  bottom: -51px;
}
.center .day li,
.center .month li,
.center .year li {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 50px;
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
}
.center .reset {
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
.center .reset:active {
  -webkit-transform: scale(0.95);
          transform: scale(0.95);
}

  
</style>

