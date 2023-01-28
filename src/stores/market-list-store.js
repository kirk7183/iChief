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
    //recieve as argument a propertu in state and value
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
          return doc.id;
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
                  console.log("ITS SERVER!!!!!");
                  this.lists.unshift(change.doc.id);
                  this.sortingArray("lists");
                }
              }
              if (source === "Local") {
                if (this.lists.indexOf(change.doc.id) === -1) {
                  console.log("ITS LOCAL!!!!!");
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
      // Go trough array using .some and show, lower case them and check if there is same name exist in FB as user entered. Return true or false
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
          // alert('New list with name "' + newListName + '" is made !');
        });
      } else {
        alert("Name of list already exists!");
      }
    },

    async editListName() {
      if (this.selectedList != "") {
        // Display a form for the user to edit the list name
        const newListName = prompt("Enter the new list name");
        if (!newListName) {
          return;
        }
        // Go trough array using .some and show, lower case them and check if there is same name exist in FireBase as user entered. Return true or false
        let nameExist = await this.lists.some((list) => {
          return list.toLowerCase() === newListName.toLowerCase();
        });
        // If not true (if it false), it means that there is no same name in Firestore as client entered in prompt
        //then  make document with new name, copy all fields in old document and paste them in document with new name
        if (!nameExist) {
          const auth = useAuthStore();
          const oldDocRef = doc(
            db,
            "market-list",
            auth.userData.email,
            "list-name",
            this.selectedList
          );
          // make copy of old data()
          const myDoc = await getDoc(oldDocRef);
          //if old data exist make new document and insert field object with old data
          if (myDoc.exists()) {
            const copyingData = myDoc.data();
            const newDocRef = doc(
              db,
              "market-list",
              auth.userData.email,
              "list-name",
              newListName
            );
            console.log("COPYING DATA: ", copyingData);
            //make new document with name client entered and insert in it the old data
            await setDoc(newDocRef, { ...copyingData, name: newListName }).then(
              () => {
                alert(
                  'List name changed from "' +
                    this.selectedList +
                    '" to "' +
                    newListName +
                    '"'
                );
                //delete old document with field object data after new document with new name is made
                this.deleteList(this.selectedList).then(() => {
                  //DONT FORGET THAT THIS IS NOT 'modified' in 'realTimeListeners', its making NEW and copying old data in it(with some changes) and then delete old data.
                  //Main reaason for this is that we CANNOT CHANGE name (title) of 'documents' in Firebase.

                  //insert new list name locally
                  // this.lists.push(newListName);

                  //after old selectedList is deleted, we enter new list name we just made to selectedList
                  this.selectedList = newListName;
                  //because we have 'watch' on selectedList variable it will automaticly empty it when we delete document list from selectedList
                  //after that this.list is empty so we need to fill it with old data
                  this.list_fields = [{ ...copyingData }];
                });
              }
            );
          }
        } else {
          alert("Name of list already exists!");
        }
      } else {
        alert("select list you want to EDIT");
      }
    },
    async deleteList() {
      console.log("delete list");
      let index = this.lists.indexOf(this.selectedList);
      let selected = this.selectedList;
      //if selectedList name (string) exist in 'lists' array
      if (index !== -1) {
        const auth = useAuthStore();
        const myDocRef = doc(
          db,
          "market-list",
          auth.userData.email,
          "list-name",
          this.selectedList
        );
        //delete that selectedList in Firebase and then this.realTimeListeners will in "removed" and remove 'list' in 'lists' and empty state for 'selectedList'.
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
      //fetch fields from List name
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
      //MAYBE I DONT NEED IT, BECAUSE ONLY USER WITH WHO IS SHARED LIST NEED THIS. He needs to see changes. But what if he made changes? do i  need to have onSnapshot for real time refresh?
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
