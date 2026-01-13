<template>
  <div v-if="loader.isLoading || loader.isInitializing" class="loader-overlay">
    <div class="loader-spinner">
      <div class="spinner"></div>
      <p>Učitavanje...</p>
    </div>
  </div>
</template>

<script setup>
import { useLoaderStore } from "@/stores/loader-store.js";

const loader = useLoaderStore();
</script>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;

// ======== LOADER ========
.loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loader-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-lg;

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    color: white;
    font-size: $fs-base;
    font-weight: $fw-semibold;
    margin: 0;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
