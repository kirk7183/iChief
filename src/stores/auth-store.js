// import { ref, computed } from 'vue';
import { defineStore } from "pinia";
import { useMarketListStore } from "@/stores/market-list-store.js";
import router from "@/router/index.js";
import {  auth,  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
} from "@/firebase/firebase.js";

// const market_list = useMarketListStore();

export const useAuthStore = defineStore("auth", {
  state: () => {
    return {
      email: "",
      password: "",
      userData: {
        isLoggedIn: false,
        uid: "empty",
        email: "",
      },
    };
  },
  actions: {
    init() {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log("USER AUTH STORE, ", user);
          this.userData.uid = user.uid;
          this.userData.email = user.email;
          this.userData.isLoggedIn = true;
          //ako si logovan i ukucas custom /login on ce odmah da te vrati na HOME zato sto ima v-model za username i password. U auth-store ce prvo da ocita prazne podatke iz inputa iz login-page.vue, pa ce onAuthStateChanged iz Init() koji se poziva iz app.vue da reaguje zbog promene podataka(proverice da li je korisnik logovan), pa ce opet da ocita logovanog korisnika i da pozove komandu ispod za redirect
          router.replace({ name: "Home" });
        } else {
          console.log("IZLOGOVAN SI");
          this.userData = {};
        }
      });
    },
    async login() {
      try {
        await signInWithEmailAndPassword(auth, this.email, this.password).then(
          (response) => {
            //set data
            this.userData.uid = response.user.uid;
            this.userData.email = response.user.email;
            this.userData.isLoggedIn = true;
            //clear data
            this.email = "";
            this.password = "";
            console.log("response", response);
            router.push("/");
          }
        );
      } catch (error) {
        console.log("not registred");
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
      }
    },
    async logout() {
      await signOut(auth).then(() => {
        const market_list = useMarketListStore();
        //empty lists when logout
        market_list.change_state("lists", []);
        market_list.change_state("selectedList", "");
        market_list.change_state("list_fields", []);
        market_list.change_state("items_fields", []);
      });
    },
  },
  getters: {
    isLoggedIn() {
      console.log(this.userData.isLoggedIn);
      return this.userData.isLoggedIn;
    },
  },
});
