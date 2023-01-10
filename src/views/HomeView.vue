<template>
  <div>
    <h1>Welcome to the Cooking Book!</h1>
    <div v-if="Object.keys(userData).length">
      <p>You are logged in as: {{ userData.email }}</p>
      <button @click="handleLogOut()">Log Out</button>
    </div>
    <div v-else>
      <button @click="toLoginPage()">Login</button>
    </div>
    <hr />
    <div v-if="Object.keys(userData).length">
      <!-- <router-link to="/cooking-book">Cooking Book</router-link> -->
      <br />
      <!-- <router-link to="/market-list-home">Market List Home</router-link> -->
      <router-link to="/market-list">Market List</router-link>
      <br />
      <!-- <router-link to="/food-in-fridge">Food in Fridge</router-link> -->
    </div>
  </div>
</template>


<script setup>
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth-store";
import router from "@/router/index.js";
// import { useRouter } from "@/router/index.js";
// const router = useRouter();
const authStore = useAuthStore();
const handleLogOut = async () => {
  authStore.logout();
};
const toLoginPage = () => {
  router.push({ path: "/login" });
};
const { userData } = storeToRefs(authStore);
</script>
<style scoped></style>;
