// import { ref, computed } from 'vue';
import { defineStore } from "pinia";
import { useMarketListStore } from "@/stores/market-list-store.js";
import router from "@/router/index.js";
import {  auth,  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "@/firebase/firebase.js";

// const market_list = useMarketListStore();

export const useAuthStore = defineStore("auth", {
  state: () => {
    return {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      userData: {
        isLoggedIn: false,
        uid: "empty",
        email: "",
        firstName: "",
        lastName: "",
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
          
          // Parse displayName for firstName and lastName
          if (user.displayName) {
            const nameParts = user.displayName.split(' ');
            this.userData.firstName = nameParts[0] || '';
            this.userData.lastName = nameParts.slice(1).join(' ') || '';
          }
          
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
    async register() {
      try {
        await createUserWithEmailAndPassword(auth, this.email, this.password).then(
          async (response) => {
            // Update user profile with name
            await updateProfile(response.user, {
              displayName: `${this.firstName} ${this.lastName}`
            });
            
            // Set user data
            this.userData.uid = response.user.uid;
            this.userData.email = response.user.email;
            this.userData.firstName = this.firstName;
            this.userData.lastName = this.lastName;
            this.userData.isLoggedIn = true;
            
            // Clear form data
            this.email = "";
            this.password = "";
            this.firstName = "";
            this.lastName = "";
            
            console.log("User registered successfully", response);
            router.push("/");
          }
        );
      } catch (error) {
        console.log("Registration error:", error);
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        throw error; // Re-throw to handle in component
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
    async updateProfile(updateData) {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("No user logged in");

        // If there are changes that require authentication, reauthenticate first
        if (updateData.currentPassword) {
          const credential = EmailAuthProvider.credential(user.email, updateData.currentPassword);
          await reauthenticateWithCredential(user, credential);
        }

        // Update display name if firstName or lastName changed
        const newDisplayName = `${updateData.firstName} ${updateData.lastName}`;
        if (user.displayName !== newDisplayName) {
          await updateProfile(user, {
            displayName: newDisplayName
          });
        }

        // Update email if changed
        if (updateData.newEmail && updateData.newEmail !== user.email) {
          await updateEmail(user, updateData.newEmail);
        }

        // Update local state
        this.userData.firstName = updateData.firstName;
        this.userData.lastName = updateData.lastName;
        if (updateData.newEmail) {
          this.userData.email = updateData.newEmail;
        }

      } catch (error) {
        console.error("Update profile error:", error);
        throw error;
      }
    },
  },
  getters: {
    isLoggedIn() {
      console.log(this.userData.isLoggedIn);
      return this.userData.isLoggedIn;
    },
  },
});
