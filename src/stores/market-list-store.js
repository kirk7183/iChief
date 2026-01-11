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
                this.lists[index].name = change.doc.data().name;
                this.lists[index].sharedWith = change.doc.data().sharedWith || [];
                this.lists[index].shareSend = change.doc.data().shareSend || [];
                this.lists[index].sharedFrom = change.doc.data().sharedFrom || null;
                this.lists[index].ownerName = change.doc.data().ownerName || '';
                this.lists[index].ownerEmail = change.doc.data().ownerEmail || '';
                this.lists[index].ownerFirstName = change.doc.data().ownerFirstName || '';
                this.lists[index].ownerLastName = change.doc.data().ownerLastName || '';
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
            
            // Simply update the name field
            await updateDoc(docRef, {
              name: trimmedName
            });
            
            console.log('List name updated successfully');
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
      console.log("fetch item fields for list:", this.selectedList);
      const auth = useAuthStore();
      // Find the list to check if shared
      const list = this.lists.find(l => l.id === this.selectedList);
      const emailToUse = list && list.sharedFrom ? list.sharedFrom : auth.userData.email;
      console.log("emailToUse for items:", emailToUse, "list.sharedFrom:", list?.sharedFrom);
      const colRef = await collection(
        db,
        "market-list",
        emailToUse,
        "lists",
        this.selectedList,
        "items"
      );
      if (colRef){
        onSnapshot(colRef, (colSnapshot) => {
          this.items_fields = [];
          colSnapshot.forEach((each) => {
            const itemData = {
              id: each.id,
              ...each.data()
            };
            console.log("Loading item:", itemData);
            this.items_fields.push(itemData);
          });
          console.log("ITS SERVER!!!!! to sam dobio ..i dalje nema itema u listi", this.items_fields.length);
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
      console.log('generateInviteLink', listId, auth.userData);
      const userId = auth.userData.uid;
      const code = generateUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const listRef = doc(db, "market-list", auth.userData.email, "lists", listId);
      console.log('listRef', listRef);
      const listDoc = await getDoc(listRef);
      console.log('listDoc exists', listDoc.exists());
      if (!listDoc.exists()) return null;

      const shareSend = listDoc.data().shareSend || [];
      shareSend.push({
        code,
        userId: null, // Will be set when accepted
        sentAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      });

      await updateDoc(listRef, { shareSend });

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

      // Find the list with this code
      const colRef = collection(db, "market-list");
      const querySnapshot = await getDocs(colRef);
      let foundList = null;
      let ownerEmail = null;

      for (const userDoc of querySnapshot.docs) {
        const userListsRef = collection(db, "market-list", userDoc.id, "lists");
        const listsSnapshot = await getDocs(userListsRef);
        for (const listDoc of listsSnapshot.docs) {
          const shareSend = listDoc.data().shareSend || [];
          const inviteIndex = shareSend.findIndex(invite => invite.code === code);
          if (inviteIndex !== -1) {
            const invite = shareSend[inviteIndex];
            if (new Date(invite.expiresAt) < new Date()) {
              throw new Error("Link je istekao.");
            }
            if (invite.userId) {
              throw new Error("Link je već iskorišćen.");
            }
            foundList = { id: listDoc.id, data: listDoc.data() };
            ownerEmail = userDoc.id;
            break;
          }
        }
        if (foundList) break;
      }

      if (!foundList) throw new Error("Nevažeći kod. Tražite od vlasnika liste da vam ponovo pošalje link");

      // Get owner info using the dedicated method
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
      // Store user object with email, firstName, lastName for easier access
      sharedWith.push({
        email: auth.userData.email,
        firstName: auth.userData.firstName || 'Korisnik',
        lastName: auth.userData.lastName || ''
      });
      const shareSend = foundList.data.shareSend || [];
      const inviteIndex = shareSend.findIndex(invite => invite.code === code);
      shareSend.splice(inviteIndex, 1); // Remove the used invite

      const listRef = doc(db, "market-list", ownerEmail, "lists", foundList.id);
      await updateDoc(listRef, { sharedWith, shareSend });
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
      } catch (e) {
        console.log('Could not add shared list', e);
      }
      this.selectedList = foundList.id;
      return { listId: foundList.id, ownerEmail, listName: foundList.data.name, ownerInfo };
    },

    async declineInvite(code) {
      const auth = useAuthStore();

      // Find and remove the invite
      const colRef = collection(db, "market-list");
      const querySnapshot = await getDocs(colRef);
      let ownerEmail = null;
      let listId = null;

      for (const userDoc of querySnapshot.docs) {
        const userListsRef = collection(db, "market-list", userDoc.id, "lists");
        const listsSnapshot = await getDocs(userListsRef);
        for (const listDoc of listsSnapshot.docs) {
          const shareSend = listDoc.data().shareSend || [];
          const inviteIndex = shareSend.findIndex(invite => invite.code === code);
          if (inviteIndex !== -1) {
            shareSend.splice(inviteIndex, 1);
            ownerEmail = userDoc.id;
            listId = listDoc.id;
            const listRef = doc(db, "market-list", ownerEmail, "lists", listId);
            await updateDoc(listRef, { shareSend });
            break;
          }
        }
        if (listId) break;
      }

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
        // Remove the list from the user's collection
        await this.removeUserAccess(listId, userEmail);
      }
    },

    async removeUserAccess(listId, userEmail) {
      try {
        const userListRef = doc(db, "market-list", userEmail, "lists", listId);
        await deleteDoc(userListRef);
        console.log('Removed shared list from user', userEmail);
      } catch (err) {
        console.error('Error removing list from user:', err);
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
