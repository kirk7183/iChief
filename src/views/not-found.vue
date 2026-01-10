<template>
  <div>THIS PAGE DONT EXIST</div>
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