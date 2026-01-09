<template>
  <div>
    <form @submit.prevent="handleRegister()">
      <label for="email">Email</label>
      <input type="email" v-model="authStore.email" id="email" required />
      <br />
      <label for="password">Password</label>
      <input
        type="password"
        v-model="authStore.password"
        id="password"
        required
      />
      <br />
      <button type="submit">Register</button>
    </form>
  </div>

  <button @click="toLoginPage">Back to Log In</button>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "vue-router";
import { auth, createUserWithEmailAndPassword } from "@/firebase/firebase.js";

const authStore = useAuthStore();
const router = useRouter();

const handleRegister = async () => {
  try {
    await createUserWithEmailAndPassword(auth, authStore.email, authStore.password).then(
      (response) => {
        console.log("User registered successfully", response);
        authStore.email = "";
        authStore.password = "";
        router.push("/");
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    const errorCode = error.code;
    const errorMessage = error.message;
    alert(`Error: ${errorCode} - ${errorMessage}`);
  }
};

const toLoginPage = () => {
  router.push("/login");
};
</script>
