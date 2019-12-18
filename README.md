# svelte-touch-datepicker
Native like date-picker for Svelte (beta release v1.0.0)


[View the demo.](https://sharifclick.github.io/svelte-touch-datepicker/)

## Installation

```bash
npm i svelte-touch-datepicker
```

## Usage

```html
<script>
  import {DatePicker}  from "svelte-touch-datepicker";

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
    --svtd-button-color: white;
    --svtd-button-bg-color: #2466fb;
    --svtd-border: none;
    --svtd-button-box-shadow: 0 1px 10px -2px #2466fb;
    --svtd-bar-color: #0522f3;
  }
```

# simple theme
```css
  :root{
    --svtd-bar-color: #0522f3;
    --svtd-button-color: white;
    --svtd-button-bg-color: #2466fb;
    --svtd-border: none;
    --svtd-button-box-shadow:0 1px 10px -2px #2466fb;
  }
```