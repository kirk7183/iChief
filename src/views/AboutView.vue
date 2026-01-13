<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useLoaderStore } from "@/stores/loader-store";

const loaderStore = useLoaderStore();

// Ensure page is at top when component mounts
onMounted(() => {
  window.scrollTo(0, 0);
  loaderStore.setInitializing(false);
});
</script>

<style>
</style>
