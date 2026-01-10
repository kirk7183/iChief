<template>
  <market-list-crud />
</template>
<script setup>
  import marketListCrud from "../components/market-list/market-list-crud.vue";
  import { onMounted } from "vue";

  // Ensure page is at top when component mounts
  onMounted(() => {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  });
</script>

<style scoped>
</style>