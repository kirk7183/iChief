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
} from "@/firebase/firebase.js";
import { writeBatch } from 'firebase/firestore';
// const auth = useAuthStore();
export const useMarketListStore = defineStore("market-list", {
  state: () => {
    return {
      lists: [],
      selectedList: "",
      list_fields: [],
      items_fields: [],
    };
  },

  actions: {
    //recieve as argument a property in state and value
    change_state(state_property, value) {
      this[state_property] = value;
    },

    async fetchLists() {
      const auth = useAuthStore();
      try {
        const email = await auth.userData.email;
        const colRef = collection(db, "market-list", email, "list-name");
        const queryDocSnapshot = await getDocs(colRef);
        this.lists = queryDocSnapshot.docs.map((doc) => {
        return doc.id;  //list of documents (ex. grocery shop)
        });
        // this.sortingArray("lists");
      } catch (error) {
        console.log(error);
      }
    },

    realTimeListeners() {
      const auth = useAuthStore();
      const email = auth.userData.email;
      const colRef = collection(db, "market-list", email, "list-name");
      onSnapshot(colRef, (colSnapshot) => {
        colSnapshot.docChanges().forEach(
          (change) => {
            //get index of element in 'lists' if exist
            let index = this.lists.indexOf(change.doc.id);
            // if data comes from server or local when its added
            if (change.type === "added") {
              const source = change.doc.metadata.hasPendingWrites
                ? "Local"
                : "Server";
              // if data comes from server
              if (source === "Server") {
                // if there is no document with that id in array "lists"
                if (this.lists.indexOf(change.doc.id) === -1) {
                  console.log("ITS SERVER!!!!!"); //valjda ako neko drugi doda nesto a ja sam na toj listi
                  this.lists.unshift(change.doc.id);
                  this.sortingArray("lists");
                } 
              }
              if (source === "Local") {
                if (this.lists.indexOf(change.doc.id) === -1) {
                  console.log("ITS LOCAL!!!!!"); //ako ja dodam nesto na nekoj listi nesto
                  this.lists.unshift(change.doc.id);
                  this.sortingArray("lists");
                }
              }
            }
            if (change.type === "modified") {
              // console.log("doc id: ", change.doc.id);
              // console.log("change:  ", change);
              // this.lists.push(change.doc.id);
              // this.selectedList = change.doc.id;
            }
            if (change.type === "removed") {
              this.lists.splice(index, 1);
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
      // Go trough array using .some and show, lower case them and check if there is same name exist in Firebase as user entered. Return true or false
      let nameExist = await this.lists.some((list) => {
        return list.toLowerCase() === newListName.toLowerCase();
      });
      // If not true (if it false), it means that there is no the same name in FireBase as client entered in prompt
      //then make document with new name, and insert field object "name:""
      if (!nameExist) {
        // Create new data field
        let docData = {
          name: newListName.trim(),
          sharedWith: [], //send and confirmed
          shareSend: [], //send but not confirmed
          timestamp: new Date(),
        };
        const auth = useAuthStore();
        // select collection and set new doc name
        const docRef = doc(
          db,
          "market-list",
          auth.userData.email,
          "list-name",
          newListName
        );
        //make new document
        //setDoc (can change data and make new if there is none existing)
        await setDoc(docRef, docData).then(() => {
          this.selectedList = newListName;
          //NOTHING - 'realTimeListeners' will do the rest
        });
      } else {
        alert("Name of list already exists!");
      }
    },

    async editListName(arg) {
      if (this.selectedList !== "") {
        const newListName = prompt("Enter the new list name");
        if (!newListName) {
          return;
        }
    
        const nameExist = this.lists.some((list) => list.toLowerCase() === newListName.toLowerCase());
    
        if (!nameExist) {
          try {
            const auth = useAuthStore(); // Assuming you have an auth store for user authentication
            const oldDocRef = await doc(db, "market-list", auth.userData.email, "list-name", this.selectedList);
            const myOldDocData = await getDoc(oldDocRef);
    
            if (myOldDocData.exists()) {
              const copyingDataFields = myOldDocData.data(); //old doument fields
              const newDocRef = doc(db, "market-list", auth.userData.email, "list-name", newListName);
    
              await setDoc(newDocRef, { ...copyingDataFields, name: newListName });
              console.log('setDoc');

              await this.copySubcollections(oldDocRef, newDocRef);
              console.log('this.copySubcollections');
              
              if (arg === 'edit'){
                await this.deleteList(); // Using an action to delete the old list after copying
                console.log('this.deleteList');
              }
    
              this.selectedList = newListName; // Using an action to set the selected list to the new name
              console.log('this.selectedList');
    
              this.list_fields = [{ ...copyingDataFields }]; // Using an action to set the list fields
              console.log('this.list_fields');
    
              alert('List name changed successfully');
            }
          } catch (error) {
            console.error("Error editing list name:", error);
          }
        } else {
          alert("Name of list already exists!");
        }
      } else {
        alert("Select a list you want to edit");
      }
    },
    
    //for copy sub-collection from old to new document
    async copySubcollections(oldDocRef, newDocRef) {
      console.log('before old collection');
      const oldCollectionRef = collection(oldDocRef, 'items');
      console.log('before new collection');
      const newCollectionRef = collection(newDocRef, 'items');
      console.log('after new collection', newCollectionRef);
    
      console.log('before documents');
      const documents = await getDocs(oldCollectionRef);
    
      console.log('before batch');
      // Use batch writes for better performance
      const batch = writeBatch(db);
    
      console.log('before forEach');
      documents.forEach((singledoc) => {
        console.log('doc.id', singledoc.id);
        console.log('doc', singledoc);
        const docId = singledoc.id
        const data = singledoc.data();
        console.log('data', data);
        const newDocRefWithId = doc(newCollectionRef, docId);
        console.log('before batch.set');
        batch.set(newDocRefWithId, data);
        console.log('after batch.set');
      });
    
      console.log('before return');
      // Commit the batch write
      return batch.commit();
    },

    async deleteList() {
      console.log("delete list");
      let index = this.lists.indexOf(this.selectedList); //get index of 'selectedList' in array 'lists'
      let selected = this.selectedList;
      //if selectedList name (string) exist in 'lists' array
      if (index !== -1) {
        const auth = useAuthStore();
        
        const myColRef = await collection(
          db,
          "market-list",
          auth.userData.email,
          "list-name",
          this.selectedList,
          "items"
        );
        console.log('myColRef', myColRef);
        //delete collection documents (ex. MOHfdwtzHckeLB1841K3 random ID) and then there is no need to delete 
        //collection (ex. items) that contain that documents, because Firebase automaticly delete collection if there 
        //is no documents in it. 
        console.log("before querySnapshot");
        const querySnapshot = await getDocs(myColRef);
        // Delete each document in the collection
        querySnapshot.forEach(async (docum) => {
          await deleteDoc(docum.ref);
        });
       
        //delete document (ex. Grocery shopping, fishing etc.)
        //delete that selectedList in Firebase and then this.realTimeListeners will in "removed" and remove 'list' in 'lists' and empty state for 'selectedList'.
        const myDocRef = await doc(
          db,
          "market-list",
          auth.userData.email,
          "list-name",
          this.selectedList,
        );
        console.log("before await deleteDoc(myDocRef)");
        await deleteDoc(myDocRef).then(() => {
          alert('list "' + selected + '" has been deleted');
        });
      } else {
        alert("select list you want to DELETE");
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
      console.log("fetch item fields");
      const auth = useAuthStore();
      const colRef = await collection(
        db,
        "market-list",
        auth.userData.email,
        "list-name",
        this.selectedList,
        "items"
      );
      //MAYBE I DONT NEED IT, BECAUSE ONLY USER WITH WHO IS SHARED LIST NEED THIS. He needs to see changes. 
      //But what if he made changes? do i  need to have onSnapshot for real time refresh?
      if (colRef){
        onSnapshot(colRef, (colSnapshot) => {
          this.items_fields = [];
          colSnapshot.docChanges().forEach((each) => {
            //doc.id document dosent contain number, in this case actually contains a name of list
            // if (each.doc.id == this.selectedList) {
            console.log("each.doc.id", each.doc);
            console.log(each.doc.data());
            this.items_fields.push(each.doc.data());
            // }
          });
        });
      }
    },
    sortingArray(arrayName) {
      //accept name of array in "data" and then sort array to be "1,2,3,4,5,6,7,8,9,10,11,12" instead "12,11,10,1,2,3..."
      // let array = this[arrayName];
      // array.sort(function (a, b) {
      //   return a - b;
      // });
      // this.lists = array;

      this[arrayName].sort();

      // this[arrayName].sort(function (a, b) {
      //   if (a.match(/^\d+$/) && b.match(/^\d+$/)) {
      //     return a - b;
      //   } else {
      //     return a > b ? 1 : -1;
      //   }
      // });
      // this[arrayName].sort(function (a, b) {
      //   if (a.match(/^\d+$/) && !b.match(/^\d+$/)) {
      //     return -1;
      //   } else if (!a.match(/^\d+$/) && b.match(/^\d+$/)) {
      //     return 1;
      //   } else {
      //     return a > b ? 1 : -1;
      //   }
      // });

      // let array = await this[data].sort(function (a, b) {
      //   return a - b;
      // });
      // this.lists = array;
      // this.lists.sort((a, b) => a - b);
      // console.log(array);
      // console.log("ARRAY NAME: ", arrayName);
      // let array = [...this[arrayName]];
      // console.log("array after spread..: ", array);
      // array.sort(function (a, b) {
      //   return a - b;
      // });
      // console.log("array after sort", array);
      // this[arrayName] = array;
      // console.log("array after set to this.lists ", this[arrayName]);
      // console.log("SORTING DONE!");
    },
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
  },
});
