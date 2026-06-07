<template>
  <router-view />
</template>

<style>
@font-face {
  font-family: 'Quantico';
  src: url('/fonts/Quantico-Regular.ttf') format('truetype');
}
@font-face {
  font-family: 'Quantico-Italic';
  src: url('/fonts/Quantico-Italic.ttf') format('truetype');
}

body {
  margin: 0;
  font-family: 'Quantico', sans-serif;
  background: linear-gradient(135deg, #141e30 0%, #243b55 100%);
  color: #e0e0e0;
  min-height: 100vh;
}
</style>
