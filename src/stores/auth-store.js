// import { ref, computed } from 'vue';
import { defineStore } from "pinia";
import { useMarketListStore } from "@/stores/market-list-store.js";
import { useLoaderStore } from "@/stores/loader-store.js";
import router from "@/router/index.js";
import {  auth,  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  db,
  getDoc,
  setDoc,
  doc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  collectionGroup,
  query,
  where,
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
          async (response) => {
            //set data
            this.userData.uid = response.user.uid;
            this.userData.email = response.user.email;
            this.userData.isLoggedIn = true;
            
            // Try to get name from Firebase Auth displayName
            if (response.user.displayName) {
              const [firstName, ...lastNameParts] = response.user.displayName.split(' ');
              this.userData.firstName = firstName;
              this.userData.lastName = lastNameParts.join(' ');
            }
            
            // Ensure user profile exists in Firestore
            const userDocRef = doc(db, "users", response.user.email);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) {
              // Create user document if it doesn't exist
              await setDoc(userDocRef, {
                firstName: this.userData.firstName || response.user.displayName?.split(' ')[0] || 'User',
                lastName: this.userData.lastName || '',
                email: response.user.email,
                uid: response.user.uid
              });
              console.log('Created missing user profile for:', response.user.email);
            } else {
              // Load from existing document
              const userData = userDocSnap.data();
              this.userData.firstName = userData.firstName;
              this.userData.lastName = userData.lastName;
            }
            
            //clear data
            this.email = "";
            this.password = "";
            console.log("response", response);
            console.log("Current route:", router.currentRoute.value.path);
            // Don't redirect here - let the component handle it with redirect parameter
          }
        );
      } catch (error) {
        console.log("not registred");
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        
        // Throw specific error messages
        if (errorCode === 'auth/user-not-found') {
          throw new Error('Korisnik sa ovom email adresom ne postoji. Molimo registrujte se.');
        } else if (errorCode === 'auth/wrong-password') {
          throw new Error('Pogrešna lozinka. Molimo pokušajte ponovo.');
        } else if (errorCode === 'auth/invalid-email') {
          throw new Error('Email adresa je pogrešna');
        } else if (errorCode === 'auth/user-disabled') {
          throw new Error('Nalog je deaktiviran. Kontaktirajte podršku.');
        } else {
          throw new Error(errorMessage || 'Greška pri prijavi. Pokušajte ponovo.');
        }
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
            
            // Save to users collection
            const userEmail = response.user.email || this.email;
            console.log('Saving user to Firestore with email key:', userEmail);
            console.log('User firstName:', this.firstName, 'lastName:', this.lastName);
            await setDoc(doc(db, "users", userEmail), {
              firstName: this.firstName,
              lastName: this.lastName,
              email: userEmail,
              uid: response.user.uid
            });
            console.log('User saved to Firestore successfully for:', userEmail);
            
            // Clear form data
            this.email = "";
            this.password = "";
            this.firstName = "";
            this.lastName = "";
            
            console.log("User registered successfully", response);
            console.log("Current route:", router.currentRoute.value.path);
            // Don't redirect here - let the component handle it with redirect parameter
          }
        );
      } catch (error) {
        console.log("Registration error:", error);
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        
        // Throw specific error messages
        if (errorCode === 'auth/email-already-in-use') {
          throw new Error('Nalog sa ovim emailom već postoji');
        } else if (errorCode === 'auth/weak-password') {
          throw new Error('Lozinka mora biti duža od 6 karaktera');
        } else if (errorCode === 'auth/invalid-email') {
          throw new Error('Email adresa je pogrešna');
        } else {
          throw new Error(errorMessage || 'Greška pri registraciji. Pokušajte ponovo.');
        }
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
      const loaderStore = useLoaderStore();
      loaderStore.startLoading();
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
          const oldEmail = user.email;
          const newEmail = updateData.newEmail;
          
          await updateEmail(user, newEmail);
          
          // Update all references in Firebase
          await this.updateEmailReferencesInFirebase(oldEmail, newEmail);
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
      } finally {
        loaderStore.stopLoading();
      }
    },

    async updateEmailReferencesInFirebase(oldEmail, newEmail) {
      try {
        // 1. Copy user document from old email to new email (3 calls)
        const oldUserDocRef = doc(db, "users", oldEmail);
        const oldUserDocSnap = await getDoc(oldUserDocRef);
        
        if (oldUserDocSnap.exists()) {
          const userData = oldUserDocSnap.data();
          userData.email = newEmail; // Update email field
          const newUserDocRef = doc(db, "users", newEmail);
          await setDoc(newUserDocRef, userData);
          console.log(`Created new user document: ${newEmail}`);
          
          await deleteDoc(oldUserDocRef);
          console.log(`Deleted old user document: ${oldEmail}`);
        }
        
        // 2. Get all lists from old email path and copy with items (1 call)
        const oldListsRef = collection(db, "market-list", oldEmail, "lists");
        const oldListsSnap = await getDocs(oldListsRef);
        
        const allItemsPromises = [];
        const itemsByListId = {}; // Store items for later deletion
        
        // Copy lists and collect items in parallel (N + N calls for lists + items)
        for (const listDoc of oldListsSnap.docs) {
          const listData = listDoc.data();
          const listId = listDoc.id;
          
          // Update sharedWith if it contains old email
          if (listData.sharedWith && listData.sharedWith.length > 0) {
            listData.sharedWith = listData.sharedWith.map(user => {
              if (typeof user === 'string' && user === oldEmail) {
                return newEmail;
              } else if (typeof user === 'object' && user.email === oldEmail) {
                return { ...user, email: newEmail };
              }
              return user;
            });
          }
          
          // Copy list
          const newListRef = doc(db, "market-list", newEmail, "lists", listId);
          allItemsPromises.push(setDoc(newListRef, listData));
          
          // Get items
          const oldItemsRef = collection(db, "market-list", oldEmail, "lists", listId, "items");
          allItemsPromises.push(
            getDocs(oldItemsRef).then(snap => {
              itemsByListId[listId] = snap.docs;
              return snap.docs;
            })
          );
        }
        
        await Promise.all(allItemsPromises);
        console.log(`Copied ${oldListsSnap.size} lists to new email path`);
        
        // 3. Copy items (only 1 more parallel batch, no extra reads)
        const itemCopyPromises = [];
        Object.entries(itemsByListId).forEach(([listId, itemDocs]) => {
          itemDocs.forEach(oldItemDoc => {
            const itemData = oldItemDoc.data();
            // Update updatedBy if it matches old email
            if (itemData.updatedBy === oldEmail) {
              itemData.updatedBy = newEmail;
            }
            
            const newItemRef = doc(db, "market-list", newEmail, "lists", listId, "items", oldItemDoc.id);
            itemCopyPromises.push(setDoc(newItemRef, itemData));
          });
        });
        
        await Promise.all(itemCopyPromises);
        console.log(`Copied all items to new email path`);
        
        // 4. Update all lists where sharedWith contains old email
        try {
          const allListsSnap = await getDocs(collectionGroup(db, "lists"));
          
          const sharedWithUpdatePromises = [];
          allListsSnap.docs.forEach(listDoc => {
            const listData = listDoc.data();
            if (listData.sharedWith && Array.isArray(listData.sharedWith)) {
              const hasOldEmail = listData.sharedWith.some(user => 
                (typeof user === 'object' && user.email === oldEmail) ||
                (typeof user === 'string' && user === oldEmail)
              );
              
              if (hasOldEmail) {
                const newSharedWith = listData.sharedWith.map(user => {
                  if (typeof user === 'string' && user === oldEmail) {
                    return newEmail;
                  } else if (typeof user === 'object' && user.email === oldEmail) {
                    return { ...user, email: newEmail };
                  }
                  return user;
                });
                
                sharedWithUpdatePromises.push(updateDoc(listDoc.ref, { sharedWith: newSharedWith }));
              }
            }
          });
          
          await Promise.all(sharedWithUpdatePromises);
          console.log(`Updated ${sharedWithUpdatePromises.length} lists with sharedWith references`);
        } catch (error) {
          console.warn("Could not update sharedWith references:", error);
        }
        
        // 5. Update all lists where sharedFrom points to old email (1 call)
        try {
          const q = query(collectionGroup(db, "lists"), where("sharedFrom", "==", oldEmail));
          const sharedListsSnap = await getDocs(q);
          
          const sharedFromUpdatePromises = sharedListsSnap.docs.map(listDoc =>
            updateDoc(listDoc.ref, { sharedFrom: newEmail })
          );
          
          await Promise.all(sharedFromUpdatePromises);
          console.log(`Updated ${sharedListsSnap.size} shared lists with new owner email`);
        } catch (error) {
          console.warn("Could not update sharedFrom references:", error);
        }
        
        // 6. Delete entire old market-list folder (use cached items)
        const deletePromises = [];
        Object.entries(itemsByListId).forEach(([listId, itemDocs]) => {
          // Delete all items
          itemDocs.forEach(oldItemDoc => {
            deletePromises.push(deleteDoc(oldItemDoc.ref));
          });
          
          // Delete the list document
          deletePromises.push(deleteDoc(doc(db, "market-list", oldEmail, "lists", listId)));
        });
        
        await Promise.all(deletePromises);
        console.log(`Deleted old market-list folder for ${oldEmail}`);
        
        console.log(`Email migration completed from ${oldEmail} to ${newEmail}`);
      } catch (error) {
        console.error("Error updating email references:", error);
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
