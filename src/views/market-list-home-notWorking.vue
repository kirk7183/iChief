<template>
  <div>
    <h1>Market List</h1>
    <form @submit.prevent="addItem">
      <label for="name">Item name</label>
      <input type="text" v-model="name" id="name" required />
      <br />
      <label for="amount">Amount</label>
      <input type="number" v-model="amount" id="amount" />
      <br />
      <label for="unit">Unit</label>
      <select v-model="unit" id="unit" required>
        <option v-for="(oneUnit, index) in unitList" :key="index">
          {{ oneUnit }}
        </option>
      </select>
      <br />
      <label for="buyer">Buyer</label>
      <input type="text" v-model="buyer" id="buyer" />
      <br />

      <label for="info">Info</label>
      <input type="text" v-model="info" />
      <br />
      <br />
      <button type="submit">Add Item</button>
    </form>
    <hr />
    <div v-if="lists.length === 0">
      <!-- Display a message or a prompt for the user to create a new list -->
      <button @click="createList">Create New List</button>
      <br />
      <br />
    </div>
    <div v-else>
      <label for="list">Select List</label>
      <select v-model="selectedList" id="list">
        <option v-for="list in lists" :key="list">
          {{ list }}
        </option>
      </select>
      <button @click="editListName">Edit List Name</button>
      <button @click="deleteList(selectedList)">Delete List</button>
      <button @click="createList">Create New List</button>
      <br />
      <br />
    </div>

    <ul>
      <div v-for="item in items" :key="item.id">
        <!--If its not NEW made document where we put 'name: "" ' just to create document in fb -->
        <li v-if="item.name !== ''">
          {{ item.name }},{{ item.amount }},{{ item.unit }},{{ item.buyer }},
          {{ item.info }}, {{ item.completed }}
          <button @click="deleteItem(item.id)">Delete</button>
          <button @click="editItem(item.id)">Edit</button>
          <br />
          <label v-if="item.buyer">Buyer: {{ item.buyer }}</label>
        </li>
      </div>
    </ul>
  </div>
</template>
<script>
import {
  db,
  // auth,
  getDoc,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  collection,
  //   collectionGroup,
  // query,
  //   orderBy,
  onSnapshot,
} from "@/firebase/firebase.js";
export default {
  data() {
    return {
      buyer: "",
      name: "",
      amount: 1,
      unit: "quantity",
      unitList: ["gr", "kg", "ml", "l", "quantity", "m", "cm"],
      info: "",
      completed: false,
      timestamp: Date,
      lists: [],
      selectedList: "",
      items: [],
      userData: {
        uid: "empty",
        email: "",
      },
    };
  },
  // created() {
  // this.getUserData();
  // this.fetchLists();
  // },
  watch: {
    // selectedList() {
    //   if (this.selectedList !== "") {
    //     // Fetch the items for the newly selected list
    //     this.fetchItems();
    //   }
    //   //when is this.selectedList empty (deleted or not selected)
    //   else {
    //     this.items = [];
    //   }
    // },
  },
  methods: {
    // getUserData() {
    //   auth.onAuthStateChanged((user) => {
    //     if (user) {
    //       // The user object has basic properties such as display name, email, etc.
    //       // const displayName = user.displayName;
    //       this.userData.email = auth.currentUser.email;
    //       // const photoURL = user.photoURL;
    //       // const emailVerified = user.emailVerified;
    //       // The user's ID, unique to the Firebase project. Do NOT use
    //       // this value to authenticate with your backend server, if
    //       // you have one. Use User.getToken() instead.
    //       this.userData.uid = user.uid;
    //     } else {
    //       // this.$router.push("/");
    //     }
    //   });
    // },
    async addItem() {
      //   const listRef = collection("lists").doc(this.selectedList);
      //   const itemsRef = listRef.collection("items");
      //   const itemRef = itemsRef.doc();
      //   await itemRef.set({
      //     name: this.name,
      //     unit: this.unit,
      //     buyer: this.buyer,
      //   });
      //   this.name = "";
      //   this.unit = "";
      //   this.buyer = "";
    },
    async deleteItem(itemId) {
      //   const listRef = collection("market-list").doc(this.selectedList);
      //   const itemsRef = listRef.collection("items");
      //   const itemRef = itemsRef.doc(itemId);
      //   await itemRef.delete();
      console.log(itemId);
    },
    // async editItem(itemId) {
    //   const listRef = collection("lists").doc(this.selectedList);
    //   const itemsRef = listRef.collection("items");
    //   const itemRef = itemsRef.doc(itemId);
    //   // Display a form for the user to edit the item
    //   // Save the edited item data to the database using the update method
    //   // Update the item in the local items array
    //   console.log(itemRef, "item ref");
    // },
    async fetchLists() {
      // const q = collection(db, "market-list");
      // const querySnapshot = await getDocs(q);
      // console.log(q);
      // console.log(querySnapshot);
      // querySnapshot.docs.map((d) => console.log(d));
      const colRef = await collection(
        db,
        "market-list",
        this.userData.email,
        "list-name"
      );
      // select collection and doc
      // const colRef = collection(
      //   db,
      //   "market-list",
      //   this.userData.email,
      //   this.selectedList
      // );
      // const myQuery = query(colRef);
      // const docRef = doc(db, "market-list", this.userData.email);
      // console.log(docRef);
      const docSnap = await getDocs(colRef);

      this.lists = docSnap.docs.map((doc) => {
        return doc.id;
        // console.log(doc);
      });
      // docSnap.forEach((myDoc) => {
      //   console.log(myDoc.id, " >= ", myDoc.data());
      // });
    },

    async fetchItems() {
      const colRef = await collection(
        db,
        "market-list",
        this.userData.email,
        "list-name"
      );
      //MAYBE I DONT NEED IT, BECAUSE ONLY USER WITH WHO IS SHARED LIST NEED THIS. He needs to see changes. But what if he made changes? do i  need to have onSnapshot for real time refresh?
      onSnapshot(colRef, (colSnapshot) => {
        colSnapshot.docChanges().forEach((each) => {
          //id document dosent contain number, actually contains a name of list
          if (each.doc.id == this.selectedList) {
            this.items = [
              {
                name: each.doc.data().name,
                amount: each.doc.data().amount,
                unit: each.doc.data().unit,
                buyer: each.doc.data().buyer,
                info: each.doc.data().info,
                completed: each.doc.data().completed,
                timestamp: each.doc.data().timestamp,
              },
            ];
          }
        });
      });
    },

    async createList() {
      // Display a form for the user to enter the list name
      const newListName = prompt("Enter the market list name");
      if (!newListName) {
        return;
      }
      // Go trough array using .some and show, lower case them and check if there is same name exist in FB as user entered. Return true or false
      let exist = await this.lists.some((list) => {
        return list.toLowerCase() === newListName.toLowerCase();
      });
      // If not true (if it false), it means that there is no the same name in FB as client entered in prompt
      //then make document with new name, and insert field object "name:""
      if (!exist) {
        // Create new data field
        let docData = {
          name: newListName,
          sharedWith: [], //send and confirmed
          shareSend: [], //send but not confirmed
          timestamp: new Date(),
        };
        // select collection and doc
        const docRef = doc(
          db,
          "market-list",
          this.userData.email,
          "list-name",
          newListName
        );

        //make new document
        //setDoc (can change data and make new if there is none existing)
        await setDoc(docRef, docData).then(() => {
          //update3 local list of documents
          this.lists.push(newListName);
          //setup new document name as selectedList
          this.selectedList = newListName;
          alert('New list with name "' + newListName + '" is made !');
        });
      } else {
        alert("Name of list already exists!");
      }
    },
    async editListName() {
      if (this.selectedList != "") {
        //   // Display a form for the user to edit the list name
        const newListName = prompt("Enter the new list name");
        if (!newListName) {
          return;
        }
        // Go trough array using .some and show, lower case them and check if there is same name exist in FB as user entered. Return true or false
        let exist = await this.lists.some((list) => {
          return list.toLowerCase() === newListName.toLowerCase();
        });
        // If not true (if it false), it means that there is no same name in FB as client entered in prompt
        //then  make document with new name, copy all fields in old document and paste them in document with new name
        if (!exist) {
          const oldDocRef = doc(
            db,
            "market-list",
            this.userData.email,
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
              this.userData.email,
              "list-name",
              newListName
            );
            //make new document with name client entered and insert old data
            await setDoc(newDocRef, { ...copyingData }).then(() => {
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
                //after old selectedList is deleted we enter list name we just made
                this.selectedList = newListName;
                //because we have 'watch' on selectedList variable it will automaticly empty it when we delete document list from selectedList
                //after that this.list is empty so we need to fill it with old data
                this.items = [{ ...copyingData }];
              });
            });
          }
        } else {
          alert("Name of list already exists!");
        }
      } else {
        alert("select list you want to see");
      }
    },
    async deleteList(selectedList) {
      let index = this.lists.indexOf(selectedList);
      //if selectedList name (string) exist in 'list in lists' array
      if (index !== -1) {
        const myDocRef = doc(
          db,
          "market-list",
          this.userData.email,
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
  },
};
</script>