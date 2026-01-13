import { defineStore } from "pinia";
import { ref } from "vue";

export const useLoaderStore = defineStore("loader", () => {
  const isLoading = ref(false);
  const isInitializing = ref(true); // True na početku dok se auth provera ne završi

  const startLoading = () => {
    isLoading.value = true;
  };

  const stopLoading = () => {
    isLoading.value = false;
  };

  const setInitializing = (value) => {
    isInitializing.value = value;
  };

  return {
    isLoading,
    isInitializing,
    startLoading,
    stopLoading,
    setInitializing,
  };
});
