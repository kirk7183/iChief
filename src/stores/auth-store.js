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
      // Indicates the initial Firebase auth check completed
      authReady: false,
      // internal promise/resolver for waiting consumers
      _authReadyPromise: null,
      _authReadyResolve: null,
    };
  },
  actions: {
    init() {
      // make init idempotent: if already set up, do nothing
      if (this._authReadyPromise) return;

      this._authReadyPromise = new Promise((resolve) => {
        this._authReadyResolve = resolve;
      });

      onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log("USER AUTH STORE, ", user);
          this.userData.uid = user.uid;
          this.userData.email = user.email;
          this.userData.isLoggedIn = true;
          // Only redirect to Home if currently on the Login page.
          const currentRouteName =
            router && router.currentRoute && router.currentRoute.value
              ? router.currentRoute.value.name
              : null;
          if (currentRouteName === "Login") {
            router.replace({ name: "Home" });
          }
        } else {
          console.log("IZLOGOVAN SI");
          this.userData = { isLoggedIn: false, uid: "empty", email: "" };
        }

        this.authReady = true;
        if (this._authReadyResolve) {
          this._authReadyResolve();
          this._authReadyResolve = null;
        }
      });
    },
    // Returns a promise that resolves once the initial auth state is known.
    waitForAuth() {
      // If promise already exists and is not resolved, return it
      if (this._authReadyPromise) return this._authReadyPromise;
      
      // If authReady is already true (listener already resolved once), return resolved promise
      if (this.authReady) {
        return Promise.resolve();
      }
      
      // Otherwise, call init() to set up listener and return the promise
      this.init();
      return this._authReadyPromise;
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
        // Reset auth-ready promise so next login re-initializes properly
        this._authReadyPromise = null;
        this._authReadyResolve = null;
        this.authReady = false;
        // Redirect to login page
        router.push("/login");
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
