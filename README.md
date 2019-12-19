# Native like date-picker for Svelte
 
[![NPM version](https://img.shields.io/npm/v/svelte-touch-datepicker.svg?style=flat)](https://www.npmjs.com/package/svelte-touch-datepicker) [![NPM downloads](https://img.shields.io/npm/dm/svelte-touch-datepicker.svg?style=flat)](https://www.npmjs.com/package/svelte-touch-datepicker)


[View the demo.](https://sharifclick.github.io/svelte-touch-datepicker/)

## Installation

```bash
npm i svelte-touch-datepicker
```

## Usage

```html
<script>
  import DatePicker  from "svelte-touch-datepicker";

  let date = new Date();
  $: _date = date.toLocaleDateString("en-US");

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
    <p>Date: {_date}</p>
    <DatePicker bind:date />
  </div>
</div>

```


## Default css custom properties

```css

  :root{
    --svtd-popup-bg-color: white;
    --svtd-popup-color: black;
    --svtd-popup-radius: 10px;
    --svtd-font-size: 20px;
    --svtd-button-color: black;
    --svtd-button-bg-color: transparent;
    --svtd-border: 1px solid grey;
    --svtd-button-box-shadow: none;
    --svtd-bar-color: grey;
  }
```