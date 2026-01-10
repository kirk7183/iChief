<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>

<script setup>
import { onMounted } from "vue";

// Ensure page is at top when component mounts
onMounted(() => {
  window.scrollTo(0, 0);
});
</script>

<style>
</style>
