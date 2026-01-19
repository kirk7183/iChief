// import { ref, computed } from 'vue'
import { defineStore } from "pinia";
import { useAuthStore } from "@/stores/auth-store";
import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
  updateDoc,
  query,
  where,
} from "@/firebase/firebase.js";
import { serverTimestamp } from "@/firebase/firebase.js";
import { writeBatch } from 'firebase/firestore';

// Generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
export const useMarketListStore = defineStore("market-list", {
  state: () => {
    return {
      lists: [], // Now stores: { id: "uuid", name: "Kupovnja" }
      selectedList: "", // Now stores only UUID
      list_fields: [],
      items_fields: [],
      pendingInviteCode: null, // Stores invite code when user is not logged in
      itemsUnsubscribe: null, // Store unsubscribe function for real-time listener
      isEmailMigrationInProgress: false, // Flag to prevent listener updates during email migration
    };
  },

  actions: {
    //recieve as argument a property in state and value
    change_state(state_property, value) {
      this[state_property] = value;
    },

    setPendingInviteCode(code) {
      console.log('Setting pending invite code:', code);
      this.pendingInviteCode = code;
    },

    getPendingInviteCode() {
      console.log('Getting pending invite code:', this.pendingInviteCode);
      return this.pendingInviteCode;
    },

    clearPendingInviteCode() {
      console.log('Clearing pending invite code');
      this.pendingInviteCode = null;
    },

    async getOwnerInfo(ownerEmail) {
      try {
        const userDocRef = doc(db, "users", ownerEmail);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('Found user in /users:', userData);
          return {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || ownerEmail
          };
        }
      } catch (error) {
        console.error('Error getting owner info:', error);
      }
      // Fallback with known users
      const knownUsers = {
        'vasicigorjsp@gmail.com': { firstName: 'Igor', lastName: 'Vasić' },
        'jovicajovic2@gmail.com': { firstName: 'Jovica', lastName: 'Jović' }
      };
      const known = knownUsers[ownerEmail];
      if (known) {
        console.log('Using fallback known user for:', ownerEmail, known);
        return {
          firstName: known.firstName,
          lastName: known.lastName,
          email: ownerEmail
        };
      }
      console.log('No owner info found for:', ownerEmail, 'returning default');
      return {
        firstName: 'Vlasnik',
        lastName: '',
        email: ownerEmail
      };
    },

    async fetchLists() {
      const auth = useAuthStore();
      try {
        const email = await auth.userData.email;
        const colRef = collection(db, "market-list", email, "lists");
        const queryDocSnapshot = await getDocs(colRef);
        this.lists = queryDocSnapshot.docs.map((doc) => {
          return {
            id: doc.id,
            name: doc.data().name,
            sharedWith: doc.data().sharedWith || [],
            shareSend: doc.data().shareSend || [],
            sharedFrom: doc.data().sharedFrom || null
          };
        });
      } catch (error) {
        console.log(error);
      }
    },

    realTimeListeners() {
      const auth = useAuthStore();
      const email = auth.userData.email;
      const colRef = collection(db, "market-list", email, "lists");
      onSnapshot(colRef, (colSnapshot) => {
        colSnapshot.docChanges().forEach(
          (change) => {
            //get index of element in 'lists' if exist
            let index = this.lists.findIndex(list => list.id === change.doc.id);
            // if data comes from server or local when its added
            if (change.type === "added") {
              const source = change.doc.metadata.hasPendingWrites
                ? "Local"
                : "Server";
              if (source === "Server") {
                if (!this.lists.find(list => list.id === change.doc.id)) {
                  console.log("ITS SERVER!!!!!");
                  this.lists.unshift({
                    id: change.doc.id,
                    name: change.doc.data().name,
                    sharedWith: change.doc.data().sharedWith || [],
                    shareSend: change.doc.data().shareSend || [],
                    sharedFrom: change.doc.data().sharedFrom || null,
                    ownerName: change.doc.data().ownerName || '',
                    ownerEmail: change.doc.data().ownerEmail || '',
                    ownerFirstName: change.doc.data().ownerFirstName || '',
                    ownerLastName: change.doc.data().ownerLastName || ''
                  });
                  // If shared list and no owner info, fetch and update
                  if (change.doc.data().sharedFrom && !change.doc.data().ownerFirstName) {
                    this.getOwnerInfo(change.doc.data().sharedFrom).then(ownerInfo => {
                      if (ownerInfo) {
                        // Update the list in store
                        const listIndex = this.lists.findIndex(l => l.id === change.doc.id);
                        if (listIndex !== -1) {
                          this.lists[listIndex].ownerName = `${ownerInfo.firstName} ${ownerInfo.lastName}`;
                          this.lists[listIndex].ownerFirstName = ownerInfo.firstName;
                          this.lists[listIndex].ownerLastName = ownerInfo.lastName;
                          this.lists[listIndex].ownerEmail = ownerInfo.email;
                        }
                        // Update Firestore document
                        const listDocRef = doc(db, "market-list", auth.userData.email, "lists", change.doc.id);
                        updateDoc(listDocRef, {
                          ownerName: `${ownerInfo.firstName} ${ownerInfo.lastName}`,
                          ownerFirstName: ownerInfo.firstName,
                          ownerLastName: ownerInfo.lastName,
                          ownerEmail: ownerInfo.email
                        }).catch(err => console.error('Error updating owner info:', err));
                      }
                    });
                  }
                  this.sortingArray("lists");
                } 
              }
              if (source === "Local") {
                if (!this.lists.find(list => list.id === change.doc.id)) {
                  console.log("ITS LOCAL!!!!!");
                  this.lists.unshift({
                    id: change.doc.id,
                    name: change.doc.data().name,
                    sharedWith: change.doc.data().sharedWith || [],
                    shareSend: change.doc.data().shareSend || [],
                    sharedFrom: change.doc.data().sharedFrom || null
                  });
                  this.sortingArray("lists");
                }
              }
            }
            if (change.type === "modified") {
              if (index !== -1) {
                const oldSharedFrom = this.lists[index].sharedFrom;
                this.lists[index].name = change.doc.data().name;
                this.lists[index].sharedWith = change.doc.data().sharedWith || [];
                this.lists[index].shareSend = change.doc.data().shareSend || [];
                this.lists[index].sharedFrom = change.doc.data().sharedFrom || null;
                this.lists[index].ownerName = change.doc.data().ownerName || '';
                this.lists[index].ownerEmail = change.doc.data().ownerEmail || '';
                this.lists[index].ownerFirstName = change.doc.data().ownerFirstName || '';
                this.lists[index].ownerLastName = change.doc.data().ownerLastName || '';
                
                if (oldSharedFrom !== this.lists[index].sharedFrom) {
                  console.log('[realTimeListeners] List modified - sharedFrom changed from', oldSharedFrom, 'to', this.lists[index].sharedFrom);
                  
                  // If this is the currently selected list and sharedFrom changed, refresh items
                  if (this.selectedList === change.doc.id) {
                    console.log('[realTimeListeners] This is the selected list and sharedFrom changed - refreshing items');
                    this.fetchItemsFields();
                  }
                }
              }
            }
            if (change.type === "removed") {
              if (index !== -1) {
                this.lists.splice(index, 1);
              }
              this.selectedList = "";
            }
          },
          (error) => {
            console.log("onSnapshot error : ", error);
          }
        );
      });
    },

    async createList(newListName) {
      // Check if list name exists
      let nameExist = await this.lists.some((list) => {
        return list.name.toLowerCase() === newListName.toLowerCase();
      });
      
      if (!nameExist) {
        const listId = generateUUID();
        let docData = {
          name: newListName.trim(),
          sharedWith: [],
          shareSend: [],
          timestamp: new Date(),
        };
        const auth = useAuthStore();
        const docRef = doc(
          db,
          "market-list",
          auth.userData.email,
          "lists",
          listId
        );
        await setDoc(docRef, docData).then(() => {
          this.selectedList = listId;
        });
        return { success: true };
      } else {
        return { success: false, message: "Name of list already exists!" };
      }
    },

    async editListName(newListName) {
      if (this.selectedList !== "") {
        if (!newListName || !newListName.trim()) {
          return { success: false, message: 'Naziv liste ne može biti prazan' };
        }
    
        const trimmedName = newListName.trim();
        const nameExist = this.lists.some((list) => list.name.toLowerCase() === trimmedName.toLowerCase());
    
        if (!nameExist) {
          try {
            const auth = useAuthStore();
            const docRef = doc(db, "market-list", auth.userData.email, "lists", this.selectedList);
            
            // Get the list to find who it's shared with
            const listSnap = await getDoc(docRef);
            if (!listSnap.exists()) {
              return { success: false, message: 'Lista više ne postoji' };
            }
            
            const listData = listSnap.data();
            const sharedWith = listData.sharedWith || [];
            
            // Simply update the name field
            await updateDoc(docRef, {
              name: trimmedName
            });
            
            console.log('[editListName] List name updated to:', trimmedName);
            
            // Update list name for all invited users
            if (sharedWith.length > 0) {
              const updatePromises = [];
              
              for (const user of sharedWith) {
                const userEmail = typeof user === 'string' ? user : user.email;
                const userListRef = doc(db, "market-list", userEmail, "lists", this.selectedList);
                
                console.log('[editListName] Updating list name for user:', userEmail);
                updatePromises.push(
                  updateDoc(userListRef, { name: trimmedName }).catch(err => {
                    console.error('[editListName] Error updating list for user', userEmail, ':', err);
                  })
                );
              }
              
              if (updatePromises.length > 0) {
                await Promise.all(updatePromises);
                console.log('[editListName] Updated list name for', sharedWith.length, 'invited users');
              }
            }
            
            return { success: true, message: 'Naziv liste je uspešno promenjen' };
          } catch (error) {
            console.error("Error editing list name:", error);
            return { success: false, message: 'Greška pri promeni naziva liste' };
          }
        } else {
          return { success: false, message: 'Naziv liste već postoji!' };
        }
      } else {
        return { success: false, message: 'Nijedna lista nije izabrana' };
      }
    },

    async copyList(newListName) {
      if (!this.selectedList) {
        return { success: false, message: "Select a list you want to copy" };
      }

      // Check if name exists
      const nameExist = this.lists.some((list) => list.name.toLowerCase() === newListName.toLowerCase());
      if (nameExist) {
        return { success: false, message: "Name of list already exists!" };
      }

      try {
        const auth = useAuthStore();
        const oldDocRef = doc(db, "market-list", auth.userData.email, "lists", this.selectedList);
        const oldSnap = await getDoc(oldDocRef);
        if (!oldSnap.exists()) {
          return { success: false, message: "Original list not found" };
        }

        const copyingDataFields = oldSnap.data();

        // create new list doc
        const newId = generateUUID();
        const newDocRef = doc(db, "market-list", auth.userData.email, "lists", newId);
        await setDoc(newDocRef, { ...copyingDataFields, name: newListName.trim(), timestamp: new Date() });

        // copy items subcollection using batch
        const oldItemsCol = collection(oldDocRef, "items");
        const newItemsCol = collection(newDocRef, "items");
        const documents = await getDocs(oldItemsCol);
        const batch = writeBatch(db);
        documents.forEach((d) => {
          const newItemRef = doc(newItemsCol, d.id);
          batch.set(newItemRef, d.data());
        });
        await batch.commit();

        // refresh lists from server and select new list
        await this.fetchLists();
        this.selectedList = newId;
        // fetch items for the new list
        await this.fetchItemsFields();

        return { success: true, message: `List copied as "${newListName.trim()}"` };
      } catch (error) {
        console.error("Error copying list:", error);
        return { success: false, message: "Error copying list!" };
      }
    },
    
    //for copy sub-collection from old to new document (DEPRECATED - no longer needed with UUID structure)
    async copySubcollections(oldDocRef, newDocRef) {
      console.log('Copying subcollections (deprecated)');
      // This method is no longer needed since we use updateDoc instead of creating new documents
    },

    async deleteList(listId = null, skipConfirm = false) {
      console.log("delete list");
      const listToDelete = listId || this.selectedList;
      
      // Check if list is selected
      if (!listToDelete) {
        return { success: false, message: "Select a list you want to DELETE" };
      }
      
      // Find list index and name
      let index = this.lists.findIndex(list => list.id === listToDelete);
      if (index === -1) {
        return { success: false, message: "List not found" };
      }
      
      const listName = this.lists[index].name;
      // CAPTURE the list object BEFORE we delete it, because the real-time listener
      // will remove it from this.lists once the Firestore delete completes
      const listBeforeDelete = { ...this.lists[index] };
      
      // Ask for confirmation
      if (!skipConfirm) {
        return { success: false, message: 'Confirmation required but not provided' };
      }
      
      try {
        const auth = useAuthStore();
        
        // Delete all items in the list
        const itemsColRef = collection(
          db,
          "market-list",
          auth.userData.email,
          "lists",
          listToDelete,
          "items"
        );
        
        const querySnapshot = await getDocs(itemsColRef);
        
        // Delete each item document
        const deletePromises = querySnapshot.docs.map(docum => deleteDoc(docum.ref));
        await Promise.all(deletePromises);
        console.log("All items deleted");
        
        // Delete the list document itself
        const listDocRef = doc(
          db,
          "market-list",
          auth.userData.email,
          "lists",
          listToDelete,
        );
        
        await deleteDoc(listDocRef);
        console.log('List deleted successfully');
        
        // If this is a shared list, remove the user from the owner's sharedWith array
        // Use the captured list from BEFORE deletion, not this.lists.find()
        console.log('List being deleted:', listBeforeDelete);
        console.log('List.sharedFrom value:', listBeforeDelete?.sharedFrom);
        console.log('Is list shared?', !!(listBeforeDelete && listBeforeDelete.sharedFrom));
        
        if (listBeforeDelete && listBeforeDelete.sharedFrom) {
          const ownerEmail = listBeforeDelete.sharedFrom;
          const userEmail = auth.userData?.email;
          console.log('This is a shared list, owner email:', ownerEmail, 'User email:', userEmail);
          
          if (!userEmail) {
            console.error('User email not available, cannot remove from sharedWith');
            return { success: true, message: `Lista "${listName}" je obrisana, ali mogućno nije pravilno uklonjena iz vlasnikove liste.` };
          }
          
          const ownerListRef = doc(db, "market-list", ownerEmail, "lists", listToDelete);
          console.log('Owner list ref path:', ownerListRef.path);
          try {
            const ownerListDoc = await getDoc(ownerListRef);
            console.log('Owner list doc exists:', ownerListDoc.exists());
            if (ownerListDoc.exists()) {
              const sharedWith = ownerListDoc.data().sharedWith || [];
              console.log('Current sharedWith:', sharedWith, 'User email:', userEmail);
              
              // Handle both string (old format) and object (new format)
              const index = sharedWith.findIndex(item => {
                if (typeof item === 'string') {
                  return item === userEmail;
                } else {
                  return item.email === userEmail;
                }
              });
              
              if (index > -1) {
                sharedWith.splice(index, 1);
                console.log('Updated sharedWith:', sharedWith);
                try {
                  await updateDoc(ownerListRef, { sharedWith });
                  console.log('User removed from sharedWith - updateDoc called successfully');
                  console.log('Updated Firestore - sharedWith is now:', sharedWith);
                } catch (updateErr) {
                  console.error('Error in updateDoc call:', updateErr);
                  throw updateErr;
                }
              } else {
                console.log('User not found in sharedWith array');
              }
            } else {
              console.log('Owner list document does not exist at path:', ownerListRef.path);
            }
          } catch (err) {
            console.error('Error removing user from sharedWith:', err);
          }
        } else if (listBeforeDelete && listBeforeDelete.sharedWith && listBeforeDelete.sharedWith.length > 0) {
          // If this is the owner deleting the list, delete it from ALL shared users' paths
          console.log('Owner deleting a shared list. Need to delete from shared users paths.');
          const userEmail = auth.userData?.email;
          
          if (!userEmail) {
            console.error('User email not available, cannot delete from shared users');
            return { success: true, message: `Lista "${listName}" je obrisana iz vaše liste, ali mogućno nije obrisana iz deljenih kopija.` };
          }
          
          const sharedUsers = listBeforeDelete.sharedWith;
          const deleteSharedPromises = [];
          
          sharedUsers.forEach(user => {
            // Handle both string (old format with email) and object (new format)
            const userEmail = typeof user === 'string' ? user : (user.email || user);
            
            const sharedListRef = doc(db, "market-list", userEmail, "lists", listToDelete);
            
            // Delete all items from shared user's copy
            deleteSharedPromises.push(
              getDocs(collection(db, "market-list", userEmail, "lists", listToDelete, "items"))
                .then(querySnapshot => {
                  const itemDeletePromises = querySnapshot.docs.map(itemDoc => deleteDoc(itemDoc.ref));
                  return Promise.all(itemDeletePromises);
                })
                .then(() => {
                  // Delete the shared list document itself
                  return deleteDoc(sharedListRef);
                })
                .catch(err => console.warn(`Could not delete shared list from user ${userEmail}:`, err))
            );
          });
          
          await Promise.all(deleteSharedPromises);
          console.log('Deleted shared list from all users paths');
        }
        
        return { success: true, message: `Lista "${listName}" je obrisana` };
        
      } catch (error) {
        console.error("Error deleting list:", error);
        return { success: false, message: "Error deleting list!" };
      }
    },
    async fetchListFields() {
      //fetch fields from List name
      // console.log("fetch list fields");
      // const colRef = await collection(
      //   db,
      //   "market-list",
      //   auth.userData.email,
      //   "list-name"
      // );
      //MAYBE I DONT NEED IT, BECAUSE ONLY USER WITH WHO IS SHARED LIST NEED THIS. He needs to see changes. But what if he made changes? do i  need to have onSnapshot for real time refresh?
      // onSnapshot(colRef, (colSnapshot) => {
      //   colSnapshot.docChanges().forEach(
      //     (change) => {
      //       //doc.id document dosent contain number, in this case actually contains a name of list
      //       // if (each.doc.id == this.selectedList) {
      //       //   console.log(each.doc.data());
      //       //   console.log("each.doc.id", each.doc.id);
      //       //   this.list_fields = each.doc.data();
      //       // }
      //       if (change.type === "added") {
      //         console.log("ADDED: ", change.doc.data());
      //         this.lists.push(change.doc.data().name); //NE VALJA
      //         // console.log(doc);
      //       }
      //       if (change.type === "modified") {
      //         console.log("MODIFIED : ", change.doc.data());
      //       }
      //       if (change.type === "removed") {
      //         console.log("REMOVED: ", change.doc.data());
      //         // if (each.doc.id == this.selectedList) {
      //         //   console.log(each.doc.data());
      //         //   console.log("each.doc.id", each.doc.id);
      //         //   this.list_fields = each.doc.data();
      //         // }
      //       }
      //     },
      //     (error) => {
      //       console.log("onSnapshot error : ", error);
      //     }
      //   );
      // });
    },

    async fetchItemsFields() {
      //fetch item fields from selected List name - when  user select list, 
      console.log("[fetchItemsFields] Starting for list:", this.selectedList);
      
      // Skip if email migration is in progress
      if (this.isEmailMigrationInProgress) {
        console.log("[fetchItemsFields] Skipping - email migration in progress");
        return;
      }
      
      const auth = useAuthStore();
      
      // Clean up old listener before setting up new one
      if (this.itemsUnsubscribe) {
        console.log("[fetchItemsFields] Cleaning up old items listener");
        this.itemsUnsubscribe();
        this.itemsUnsubscribe = null;
      }
      
      // Find the list to check if shared
      const list = this.lists.find(l => l.id === this.selectedList);
      console.log("[fetchItemsFields] Found list:", list?.name, "sharedFrom:", list?.sharedFrom);
      
      // For shared lists, items are stored under the OWNER's email (sharedFrom)
      // For own lists, items are stored under current user's email
      const emailToUse = list && list.sharedFrom ? list.sharedFrom : auth.userData.email;
      console.log("[fetchItemsFields] Using email for items:", emailToUse, "(sharedFrom:", list?.sharedFrom, ", currentUser:", auth.userData.email, ")");
      
      // Add a small delay to ensure Firebase has processed the latest changes
      // This helps when email migration just happened
      await new Promise(resolve => setTimeout(resolve, 500));
      const colRef = await collection(
        db,
        "market-list",
        emailToUse,
        "lists",
        this.selectedList,
        "items"
      );
      if (colRef){
        // Store the unsubscribe function so we can clean it up later
        this.itemsUnsubscribe = onSnapshot(colRef, (colSnapshot) => {
          this.items_fields = [];
          colSnapshot.forEach((each) => {
            const itemData = {
              id: each.id,
              ...each.data()
            };
            console.log("[fetchItemsFields] Loading item:", itemData.name || itemData.id);
            this.items_fields.push(itemData);
          });
          console.log("[fetchItemsFields] Successfully loaded", this.items_fields.length, "items from", emailToUse);
        });
      }
    },

    async saveItem(itemData) {
      try {
        if (!this.selectedList) {
          return { success: false, message: 'Please select a list first' };
        }
        const auth = useAuthStore();
        const list = this.lists.find(l => l.id === this.selectedList);
        // Items are stored under owner's email (or current user's if owner)
        const emailToUse = list && list.sharedFrom ? list.sharedFrom : auth.userData.email;
        const itemsColRef = collection(
          db,
          "market-list",
          emailToUse,
          "lists",
          this.selectedList,
          "items"
        );
        
        await addDoc(itemsColRef, itemData);
        console.log("Item saved successfully");
        return { success: true };
      } catch (error) {
        console.error("Error saving item:", error);
        return { success: false, message: "Error saving item!" };
      }
    },

    async updateItemCompletion(itemId, completed) {
      try {
        if (!this.selectedList) {
          return { success: false, message: 'Please select a list first' };
        }
        const auth = useAuthStore();
        const list = this.lists.find(l => l.id === this.selectedList);
        // Items are stored under owner's email (or current user's if owner)
        const emailToUse = list && list.sharedFrom ? list.sharedFrom : auth.userData.email;
        const itemDocRef = doc(
          db,
          "market-list",
          emailToUse,
          "lists",
          this.selectedList,
          "items",
          itemId
        );
        const updatedByName = `${auth.userData.firstName || ''} ${auth.userData.lastName || ''}`.trim() || auth.userData.email;
        await updateDoc(itemDocRef, { 
          completed: completed,
          updatedBy: updatedByName,
          updatedAt: serverTimestamp()
        });
        console.log('Item completion updated', itemId, completed);
        return { success: true };
      } catch (error) {
        console.error('Error updating item completion:', error);
        return { success: false, message: 'Error updating item completion' };
      }
    },

    // Update multiple fields of an item (used for editing)
    async updateItem(itemId, fields) {
      try {
        if (!this.selectedList) {
          return { success: false, message: 'Please select a list first' };
        }
        const auth = useAuthStore();
        const list = this.lists.find(l => l.id === this.selectedList);
        // Items are stored under owner's email (or current user's if owner)
        const emailToUse = list && list.sharedFrom ? list.sharedFrom : auth.userData.email;
        const itemDocRef = doc(
          db,
          "market-list",
          emailToUse,
          "lists",
          this.selectedList,
          "items",
          itemId
        );
        // add metadata
        const updatedByName = `${auth.userData.firstName || ''} ${auth.userData.lastName || ''}`.trim() || auth.userData.email;
        const payload = {
          ...fields,
          updatedBy: updatedByName,
          updatedAt: serverTimestamp(),
        };
        await updateDoc(itemDocRef, payload);
        console.log('Item updated', itemId, payload);
        return { success: true };
      } catch (error) {
        console.error('Error updating item:', error);
        return { success: false, message: 'Error updating item' };
      }
    },

    async deleteItem(itemOrId, skipConfirm = false) {
      try {
        // Check if list is selected
        if (!this.selectedList) {
          return { success: false, message: "Please select a list first" };
        }

        const auth = useAuthStore();
        const list = this.lists.find(l => l.id === this.selectedList);
        // Items are stored under owner's email (or current user's if owner)
        const emailToUse = list && list.sharedFrom ? list.sharedFrom : auth.userData.email;

        // Determine itemId: accept either id string or full item object
        let itemId = null;
        if (typeof itemOrId === "string") {
          itemId = itemOrId;
        } else if (typeof itemOrId === "object" && itemOrId !== null) {
          // Try to use provided id
          if (itemOrId.id) {
            itemId = itemOrId.id;
          } else {
            // Find the document by matching fields (name + timestamp fallback)
            const itemsColRef = collection(
              db,
              "market-list",
              emailToUse,
              "lists",
              this.selectedList,
              "items"
            );
            const querySnapshot = await getDocs(itemsColRef);
            const found = querySnapshot.docs.find((d) => {
              const data = d.data();
              if (itemOrId.name && data.name !== itemOrId.name) return false;
              // compare timestamps if present
              if (data.timestamp && itemOrId.timestamp && data.timestamp.seconds && itemOrId.timestamp.seconds) {
                return data.timestamp.seconds === itemOrId.timestamp.seconds;
              }
              // fallback compare some fields
              return (
                data.info === itemOrId.info &&
                data.buyer === itemOrId.buyer &&
                String(data.amount) === String(itemOrId.amount)
              );
            });
            if (found) itemId = found.id;
          }
        }

        if (!itemId) {
          return { success: false, message: "Invalid item ID (could not locate document)" };
        }

        // Ask for confirmation
        if (!skipConfirm) {
          return { success: false, message: 'Confirmation required but not provided' };
        }

        const itemDocRef = doc(
          db,
          "market-list",
          emailToUse,
          "lists",
          this.selectedList,
          "items",
          itemId
        );

        await deleteDoc(itemDocRef);
        console.log("Item deleted successfully");
        return { success: true };
      } catch (error) {
        console.error("Error deleting item:", error);
        return { success: false, message: "Error deleting item: " + error.message };
      }
    },
    sortingArray(arrayName) {
      // Sort lists by name
      if (arrayName === "lists") {
        this[arrayName].sort((a, b) => a.name.localeCompare(b.name));
      } else {
        this[arrayName].sort();
      }
    },

    // Sharing functions
    async generateInviteLink(listId) {
      const auth = useAuthStore();
      const userId = auth.userData.uid;
      const code = generateUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const listRef = doc(db, "market-list", auth.userData.email, "lists", listId);
      const listDoc = await getDoc(listRef);
      if (!listDoc.exists()) return null;

      // ✅ Pronađi imena osoba iz sharedWith niza - sada sa UID-ima i statusom
      let sharedWithNames = [];
      const sharedWith = listDoc.data().sharedWith || [];
      if (sharedWith.length > 0) {
        // Pronađi imena i UID-ove iz sharedWith niza
        sharedWithNames = sharedWith.map(user => {
          if (typeof user === 'object' && user.email) {
            return {
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
              email: user.email,
              uid: user.uid || null, // Koristi postojeći UID ako je dostupan
              accepted: user.accepted || false // Koristi postojeći status ako je dostupan
            };
          }
          return {
            name: user,
            email: user,
            uid: null,
            accepted: false
          };
        });
      }

      // 1. Sačuva invite kod u odvojenoj "invites" kolekciji za brže pronalaženje
      const inviteRef = doc(db, "invites", code);
      
      try {
        await setDoc(inviteRef, {
          code: code,
          ownerEmail: auth.userData.email,
          ownerName: `${auth.userData.firstName} ${auth.userData.lastName}`,
          listId: listId,
          listName: listDoc.data().name,
          sharedWithNames: sharedWithNames,
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          sentAt: new Date().toISOString()
        });
      } catch (error) {
        // Error saving to invites - will use shareSend fallback
      }

      // 2. Dodaj kod i u shareSend niz liste (za backward compatibility ako trebalo)
      const shareSend = listDoc.data().shareSend || [];
      shareSend.push({
        code,
        sentAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      });

      try {
        await updateDoc(listRef, { shareSend });
      } catch (error) {
        // Error updating shareSend
      }

      const inviteUrl = `${window.location.origin}/invite?code=${code}`;
      try {
        await navigator.clipboard.writeText(inviteUrl);
      } catch (err) {
        // Fallback: show alert with URL
        alert(`Link je generisan: ${inviteUrl}. Kopirajte ga ručno.`);
      }
      return inviteUrl;
    },

    async acceptInvite(code) {
      const auth = useAuthStore();
      const userId = auth.userData.uid;
      
      // Očisti kod od whitespace-a i specijalnih karaktera
      const cleanCode = (code || '').trim();

      // OPTIMIZED: Direktno čitaj invite iz "invites/{code}" umesto 2000 read-a
      const inviteRef = doc(db, "invites", cleanCode);
      
      let inviteSnap = await getDoc(inviteRef);

      // Ako nije pronađen kao ID, pokušaj da pronađeš po polju "code"
      if (!inviteSnap.exists()) {
        const invitesRef = collection(db, "invites");
        const q = query(invitesRef, where("code", "==", cleanCode));
        const querySnap = await getDocs(q);
        
        if (!querySnap.empty) {
          inviteSnap = querySnap.docs[0];
        }
      }

      // Fallback: Ako nije pronađen u invites kolekciji, pretražuj shareSend nizove svake liste
      if (!inviteSnap.exists()) {
        try {
          const listsRef = collection(db, "market-list");
          const allListsSnap = await getDocs(listsRef);
          
          // Provjeri sve liste
          for (const userListsSnapshot of allListsSnap.docs) {
            const userEmail = userListsSnapshot.id;
            const userListsCollRef = collection(db, "market-list", userEmail, "lists");
            const userListsSnap = await getDocs(userListsCollRef);
            
            for (const listDoc of userListsSnap.docs) {
              const listData = listDoc.data();
              const shareSend = listData.shareSend || [];
              
              // Pronađi kod u shareSend nizu
              const foundInvite = shareSend.find(invite => invite.code === cleanCode);
              if (foundInvite) {
                // Kreiraj invite objekat sa potrebnim poljima
                inviteSnap = {
                  exists: () => true,
                  data: () => ({
                    code: cleanCode,
                    ownerEmail: userEmail,
                    listId: listDoc.id,
                    listName: listData.name,
                    sharedWithNames: listData.sharedWithNames || [],
                    expiresAt: foundInvite.expiresAt,
                    sentAt: foundInvite.sentAt
                  })
                };
                break;
              }
            }
            
            if (inviteSnap.exists && inviteSnap.exists()) break;
          }
        } catch (error) {
          // Fallback search failed
        }
      }

      if (!inviteSnap.exists()) {
        throw new Error("Nevažeći kod. Tražite od vlasnika liste da vam ponovo pošalje link");
      }

      const inviteData = inviteSnap.data();
      
      // Provjeri da li je link istekao
      if (new Date(inviteData.expiresAt) < new Date()) {
        throw new Error("Link je istekao.");
      }

      // Proveri da li je korisnik već prihvatio
      const sharedWithNames = inviteData.sharedWithNames || [];
      const userEntry = sharedWithNames.find(entry => 
        (typeof entry === 'object' ? entry.email === auth.userData.email : entry === auth.userData.email)
      );
      
      if (userEntry && typeof userEntry === 'object' && userEntry.accepted) {
        throw new Error("Link je već iskorišćen.");
      }

      const ownerEmail = inviteData.ownerEmail;
      const listId = inviteData.listId;
      const listName = inviteData.listName;

      // Preuzmi podatke o listi vlasnika
      const ownerListRef = doc(db, "market-list", ownerEmail, "lists", listId);
      const ownerListSnap = await getDoc(ownerListRef);

      if (!ownerListSnap.exists()) {
        throw new Error("Lista više ne postoji");
      }

      const foundList = { id: listId, data: ownerListSnap.data() };

      // Get owner info
      const ownerInfo = await this.getOwnerInfo(ownerEmail);
      console.log('Owner info retrieved:', ownerInfo);
      
      if (!ownerInfo || !ownerInfo.firstName || !ownerInfo.lastName) {
        console.warn('Missing owner info, ownerInfo:', ownerInfo);
      }

      const sharedWith = foundList.data.sharedWith || [];
      // Check if already shared - handle both string (old format) and object (new format)
      const alreadyShared = sharedWith.some(item => {
        if (typeof item === 'string') return item === auth.userData.email;
        return item.email === auth.userData.email;
      });
      
      if (alreadyShared) {
        // Already shared, just select the list
        this.selectedList = foundList.id;
        return { alreadyShared: true, listId: foundList.id, ownerInfo };
      }

      // Add to sharedWith, remove from shareSend
      // Store user object with email, firstName, lastName, uid and accepted status for easier access
      sharedWith.push({
        email: auth.userData.email,
        firstName: auth.userData.firstName || 'Korisnik',
        lastName: auth.userData.lastName || '',
        uid: userId,
        accepted: true
      });
      const shareSend = foundList.data.shareSend || [];
      const inviteIndex = shareSend.findIndex(invite => invite.code === code);
      shareSend.splice(inviteIndex, 1); // Remove the used invite

      // Ažurira vlasnikovu listu
      await updateDoc(ownerListRef, { sharedWith, shareSend });
      
      // Ažurira invite zapis - označi da je korisnik prihvatio
      const updatedSharedWithNames = sharedWithNames.map(entry => {
        if (typeof entry === 'object' && entry.email === auth.userData.email) {
          return {
            ...entry,
            uid: userId,
            accepted: true
          };
        }
        return entry;
      });
      await updateDoc(inviteRef, { sharedWithNames: updatedSharedWithNames });
      console.log(`Invite ${code} marked as accepted by user ${userId}`);

      // Also add the list to the user's own collection for display
      try {
        const userListRef = doc(db, "market-list", auth.userData.email, "lists", foundList.id);
        console.log('Adding shared list to user collection', userListRef.path, 'with sharedFrom:', ownerEmail);
        await setDoc(userListRef, {
          name: foundList.data.name,
          sharedFrom: ownerEmail, // Mark as shared - we'll load sharedWith from owner when needed
          ownerFirstName: ownerInfo.firstName,
          ownerLastName: ownerInfo.lastName,
          ownerEmail: ownerInfo.email,
          ownerName: `${ownerInfo.firstName} ${ownerInfo.lastName}` // Keep for backward compatibility
        });
        console.log('Shared list added with sharedFrom =', ownerEmail);
        
        // Sinhronizuj sve stavke vlasnika za ovog korisnika
        try {
          const ownerItemsRef = collection(db, "market-list", ownerEmail, "lists", foundList.id, "items");
          const ownerItemsSnap = await getDocs(ownerItemsRef);
          
          const itemSyncPromises = [];
          ownerItemsSnap.docs.forEach(itemDoc => {
            const itemData = itemDoc.data();
            // Note: Items are stored under owner's email, not under shared user's email
            // The application uses sharedFrom to know where to fetch items from
            // So we don't need to copy items - they're accessible via sharedFrom reference
            console.log('Item accessible via sharedFrom:', itemDoc.id);
          });
          
          console.log(`Synced ${ownerItemsSnap.size} items for shared list`);
        } catch (syncErr) {
          console.warn('Could not sync items for shared list:', syncErr);
        }
      } catch (e) {
        console.log('Could not add shared list', e);
      }
      this.selectedList = foundList.id;
      return { listId: foundList.id, ownerEmail, listName: foundList.data.name, ownerInfo };
    },

    async declineInvite(code) {
      const auth = useAuthStore();

      // OPTIMIZED: Direktno čitaj invite iz "invites/{code}" umesto 2000 read-a
      const inviteRef = doc(db, "invites", code);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) {
        throw new Error("Nevažeći kod");
      }

      const inviteData = inviteSnap.data();
      const ownerEmail = inviteData.ownerEmail;
      const listId = inviteData.listId;

      // Remove invite from shareSend array u vlasnikovoj listi
      const listRef = doc(db, "market-list", ownerEmail, "lists", listId);
      const listSnap = await getDoc(listRef);

      if (listSnap.exists()) {
        const shareSend = listSnap.data().shareSend || [];
        const inviteIndex = shareSend.findIndex(invite => invite.code === code);
        if (inviteIndex !== -1) {
          shareSend.splice(inviteIndex, 1);
          await updateDoc(listRef, { shareSend });
        }
      }

      // Obriši invite iz "invites" kolekcije
      await deleteDoc(inviteRef);
      console.log(`Invite ${code} declined by user ${auth.userData.email}`);

      // Send message to owner (for now, just log; later implement notification)
      console.log(`Korisnik ${auth.userData.firstName} ${auth.userData.lastName} (${auth.userData.email}) je odbio poziv za listu ${listId}.`);
    },

    async removeSharedUser(listId, userId) {
      const auth = useAuthStore();
      const listRef = doc(db, "market-list", auth.userData.email, "lists", listId);
      const listDoc = await getDoc(listRef);
      if (!listDoc.exists()) return;

      // Get user email from uid
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", userId));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return;
      const userEmail = querySnapshot.docs[0].id;

      const sharedWith = listDoc.data().sharedWith || [];
      
      // Handle both string (old format) and object (new format)
      const index = sharedWith.findIndex(item => {
        if (typeof item === 'string') {
          return item === userEmail;
        } else {
          return item.email === userEmail;
        }
      });
      
      if (index > -1) {
        sharedWith.splice(index, 1);
        await updateDoc(listRef, { sharedWith });
        // Remove the list from the user's collection and clean up invites
        await this.removeUserAccess(listId, userEmail, userId);
      }
    },

    async removeUserAccess(listId, userEmail, userId) {
      try {
        // Step 1: Remove the list from user's collection
        const userListRef = doc(db, "market-list", userEmail, "lists", listId);
        await deleteDoc(userListRef);
        console.log('Removed shared list from user', userEmail);

        // Step 2: Clean up invites for this list and user
        // Find all invites for this list where user is in sharedWithNames with uid matching
        const invitesRef = collection(db, "invites");
        const inviteQuery = query(
          invitesRef,
          where("listId", "==", listId)
        );
        const inviteSnapshot = await getDocs(inviteQuery);
        
        // Delete invites where this user's entry has the matching uid
        for (const inviteDoc of inviteSnapshot.docs) {
          const inviteData = inviteDoc.data();
          const sharedWithNames = inviteData.sharedWithNames || [];
          
          // Check if this user is in the sharedWithNames with matching uid
          const userEntryIndex = sharedWithNames.findIndex(entry => 
            typeof entry === 'object' && entry.uid === userId
          );
          
          if (userEntryIndex > -1) {
            // Remove this user's entry from sharedWithNames
            const updatedSharedWithNames = sharedWithNames.filter((_, index) => index !== userEntryIndex);
            
            // If no one else is accepted, delete the invite; otherwise update it
            const hasOthersAccepted = updatedSharedWithNames.some(entry => 
              typeof entry === 'object' && entry.accepted
            );
            
            if (updatedSharedWithNames.length === 0 || !hasOthersAccepted) {
              await deleteDoc(inviteDoc.ref);
              console.log('Deleted invite:', inviteDoc.id);
            } else {
              await updateDoc(inviteDoc.ref, { sharedWithNames: updatedSharedWithNames });
              console.log('Updated invite:', inviteDoc.id);
            }
          }
        }
      } catch (err) {
        console.error('Error removing user access:', err);
      }
    },

    getPendingInvites() {
      const auth = useAuthStore();
      const userId = auth.userData.uid;
      const invites = [];

      // This would need to query all lists where shareSend has userId, but for simplicity, assume we fetch all and filter
      // In real app, better to have a separate collection for invites
      // For now, mock or adjust
      return invites; // Placeholder
    }
  },

  getters: {},
  // const count = ref(0)
  // const doubleCount = computed(() => count.value * 2)
  // function increment() {
  //   count.value++
  // }

  // return { count, doubleCount, increment }
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'market-list-store',
        storage: localStorage,
        paths: ['lists', 'selectedList'] // Ne čuvaj items_fields jer se menja dinamički
      }
    ]
  },
});
