// import { ref, computed } from 'vue'
import { defineStore } from "pinia";
import { useAuthStore } from "@/stores/auth-store.js";
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
const auth = useAuthStore();
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
    async createList(newListName) {
      // Go trough array using .some and show, lower case them and check if there is same name exist in FB as user entered. Return true or false
      let nameExist = await this.lists.some((list) => {
        return list.toLowerCase() === newListName.toLowerCase();
      }); // If not true (if it false), it means that there is no the same name in FB as client entered in prompt
      //then make document with new name, and insert field object "name:""
      if (!nameExist) {
        // Create new data field
        let docData = {
          name: newListName,
          sharedWith: [], //send and confirmed
          shareSend: [], //send but not confirmed
          timestamp: new Date(),
        };
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
          //update local list of documents
          this.lists.push(newListName);
          //setup new document name as selectedList
          this.selectedList = newListName;
          alert('New list with name "' + newListName + '" is made !');
        });
      } else {
        alert("Name of list already exists!");
      }
    },

    async fetchLists() {
      const asd = auth.userData.email;
      const querySnapshot = await getDocs(
        collection(db, "market-list", asd, "list-name")
      );
      console.log("querySnapshot", querySnapshot);
      this.lists = querySnapshot.docs.map((doc) => {
        return doc.id;
        // console.log(doc);
      });
      // querySnapshot.forEach((doc) => {
      //   console.log(doc.id);
      //  this.list()
      //   // this.lists = () => {
      //   //   return doc.id;
      //   // };
      // });
      // console.log("start fetchLists");
      // let colRef = collection(
      // db,
      // "market-list",
      // auth.userData.email,
      // "list-name"
      // );

      // const colRef = await collection(
      //   db,
      //   "market-list",
      //   auth.userData.email,
      //   "list-name"
      // );

      // console.log("nesto");
      // async () => {
      //   await getDocs(colRef).then((response) => {
      //     this.lists = () =>
      //       response.docs.map((doc) => {
      //         console.log("docs.map", doc.id);
      //         return doc.id;
      //       });
      //   });
      // };
      // console.log("colcRef", colRef);
      // let docSnap = await getDocs(colRef);
      // // console.log("docSnap inside", getDocs);
      // for (const doc of docSnap.docs) {
      //   console.log(doc);
      //   this.list.push(doc.id);

      // this.lists = docSnap.docs.map((doc) => {
      //   console.log("docs.map", doc.id);
      //   return doc.id;
      // });
      // docSnap();
      // }
      // console.log(docSnap);
      // this.lists = async () =>
      //   docSnap.docs.map((doc) => {
      //     console.log("docs.map", doc.id);
      //     return doc.id;
      //   });
    },
    async editListName() {
      if (this.selectedList != "") {
        //   // Display a form for the user to edit the list name
        const newListName = prompt("Enter the new list name");
        if (!newListName) {
          return;
        }
        // Go trough array using .some and show, lower case them and check if there is same name exist in FB as user entered. Return true or false
        let nameExist = await this.lists.some((list) => {
          return list.toLowerCase() === newListName.toLowerCase();
        });
        // If not true (if it false), it means that there is no same name in Firestore as client entered in prompt
        //then  make document with new name, copy all fields in old document and paste them in document with new name
        if (!nameExist) {
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
                  //insert new list name locally
                  this.lists.push(newListName);
                  //after old selectedList is deleted, we enter new list name we just made to selectedList
                  this.selectedList = newListName;
                  //because we have 'watch' on selectedList variable it will automaticly empty it when we delete document list from selectedList
                  //after that this.list is empty so we need to fill it with old data
                  this.items_fields = [{ ...copyingData }];
                });
              }
            );
          }
        } else {
          alert("Name of list already exists!");
        }
      } else {
        alert("select list you want to see");
      }
    },
    async deleteList() {
      console.log("delete list");
      let index = this.lists.indexOf(this.selectedList);
      //if selectedList name (string) exist in 'lists' array
      if (index !== -1) {
        const myDocRef = doc(
          db,
          "market-list",
          auth.userData.email,
          "list-name",
          this.selectedList
        );
        //delete that selectedList in FB and remove it from 'lists. When its deleted, setup selectedList to be empty
        await deleteDoc(myDocRef).then(() => {
          alert('list "' + this.selectedList + '" has been deleted');
          this.lists.splice(index, 1);
          this.selectedList = "";
        });
      }
    },
    async fetchListFields() {
      //fetch fields from List name
      console.log("fetch list fields");
      const colRef = await collection(
        db,
        "market-list",
        auth.userData.email,
        "list-name"
      );
      //MAYBE I DONT NEED IT, BECAUSE ONLY USER WITH WHO IS SHARED LIST NEED THIS. He needs to see changes. But what if he made changes? do i  need to have onSnapshot for real time refresh?
      onSnapshot(colRef, (colSnapshot) => {
        colSnapshot.docChanges().forEach(
          (change) => {
            //doc.id document dosent contain number, in this case actually contains a name of list
            // if (each.doc.id == this.selectedList) {
            //   console.log(each.doc.data());
            //   console.log("each.doc.id", each.doc.id);
            //   this.list_fields = each.doc.data();
            // }
            if (change.type === "added") {
              console.log("ADDED: ", change.doc.data());
              this.lists.push(change.doc.data().name); //NE VALJA
              // console.log(doc);
            }
            if (change.type === "modified") {
              console.log("MODIFIED : ", change.doc.data());
            }
            if (change.type === "removed") {
              console.log("REMOVED: ", change.doc.data());
              // if (each.doc.id == this.selectedList) {
              //   console.log(each.doc.data());
              //   console.log("each.doc.id", each.doc.id);
              //   this.list_fields = each.doc.data();
              // }
            }
          },
          (error) => {
            console.log("onSnapshot error : ", error);
          }
        );
      });
    },
    async fetchItemsFields() {
      //fetch fields from List name
      console.log("fetch item fields");
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
