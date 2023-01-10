<template>
  <div>
    <form @submit.prevent="handleLogin()">
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
      <button type="submit">Log In</button>
    </form>
  </div>

  <button @click="toRegisterPage">Register</button>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth-store";
const authStore = useAuthStore();
const handleLogin = async () => {
  // console.log("login page handleLogin");
  authStore.login();
};
// import { auth, signInWithEmailAndPassword } from "@/firebase/firebase.js";
// export default {
//   data() {
//     return {
//       email: "",
//       password: "",
//     };
//   },
//   methods: {
//     async login() {
//       try {
//         console.log("trying");
//         await signInWithEmailAndPassword(auth, this.email, this.password).then(
//           (response) => {
//             console.log("response", response);
//             this.$router.push("/");
//           }
//         );
//       } catch (error) {
//         console.log("not registred");
//         const errorCode = error.code;
//         const errorMessage = error.message;
//         console.log(errorCode, errorMessage);
//       }
//     },
//     toRegisterPage() {
//       this.$router.push("/register");
//     },
//   },
// };
</script>