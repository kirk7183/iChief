<template>
  <select v-model="selectedList" id="list">
    <option v-for="list in lists" :key="list">
      {{ list }}
    </option>
  </select>
  <button @click="createListBtn">Create New List</button>
  <button @click="editListNameBtn('edit')">Edit List Name</button>
  <button @click="editListNameBtn('makeCopy')">Copy List</button>
  <button @click="deleteListBtn">Delete List</button>


  <ul>
    <div v-for="(singleItem, index) in items_fields" :key="index">
      <!-- <div v-for="(value, key, indexS) in singleObject" :key="indexS"> -->
      <!--If its not NEW made document where we put 'name: "" ' just to create document in FireBase -->
      <!-- <li v-if="item.name !== ''"> -->
      <li>
        <div class="list_wrapper">
          <div class="buyer">buyer: {{ singleItem.buyer }}</div>
          <div class="name">name: {{ singleItem.name }}</div>
          <div class="amount">
            amount:{{ singleItem.amount }}: {{ singleItem.unit }}
          </div>
          <div class="info"> info: {{ singleItem.info }}</div>
          <div class="completed">completed: {{ singleItem.completed }}</div>
          <div class="timestamp">{{ singleItem.timestamp }}</div>
        </div>
        <!-- object {{ object }},index {{ index }} key {{ key }},value {{ value }},
          index5 {{ index5 }} -->
        <!-- {{ singleItem.name }},{{ singleItem.amount }},{{ singleItem.unit }},{{
          singleItem.buyer
        }}, {{ singleItem.info }},
        {{ singleItem.completed }} -->
        <button @click="editItem(singleItem.id)">Edit</button>
        <button @click="deleteItem(singleItem.id)">Delete</button>
        <br />
        <!-- <label v-if="singleItem.buyer">Buyer: {{ singleItem.buyer }}</label> -->
      </li>
    </div>
    <!-- </div> -->
  </ul>
  <!-- IMPORT COMPONENT -->
  <Items-Crud />
</template>

<script setup>
  /* IMPORTS
   */
  import { useMarketListStore } from "@/stores/market-list-store.js";
  import { watch } from "vue";
  import { storeToRefs } from "pinia";
  import ItemsCrud from "@/components/market-list/items-crud.vue";
  const market_list = useMarketListStore();
  const { selectedList, items_fields, lists } = storeToRefs(market_list);

  /* HOOKS
   */
  market_list.fetchLists();
  market_list.realTimeListeners();
  // onBeforeMount(() => market_list.fetchLists());
  // onActivated(async () => {
  //   await market_list.fetchLists();
  // });
  // onMounted(async () => {
  // await market_list.fetchLists();
  // market_list.realTimeListeners();
  // });
  // onMounted(() => {
  //   console.log("MARKET_LIST ", market_list);
  //   market_list.fetchLists();
  //   // market_list.realTimeListeners();
  // });
  watch(
    //detects if selectedList is changed and get items from newly selectedList
    () => market_list.selectedList,
    () => {
      if (market_list.selectedList !== "") {
        // Fetch the list fields and items fields for the newly selected list
        // market_list.fetchListFields();
        market_list.fetchItemsFields();
      }
      //when is this.selectedList empty (deleted or not selected)
      else {
        market_list.change_state("list_fields", []);
        market_list.change_state("items_fields", []);
      }
    }
  );
  // watch(
  //   () => auth.userData.email,
  //   () => {
  //     {
  //       if (auth.userData.email !== null || auth.userData.email !== undefined) {
  //         console.log("nije prazno", auth.userData.email);
  //         market_list.fetchLists();
  //         // market_list.realTimeListeners();
  //       } else {
  //         //namestiti da isprazni "lists"
  //         // market_list.change_state("lists", []);
  //         console.log("PRAZNO JE");
  //       }
  //     }
  //   }
  // );

  /* METHODS
   */
  const createListBtn = async () => {
    // Display a form for the user to enter the list name
    const newListName = prompt("Enter the market list name");
    if (!newListName) {
      return;
    }
    market_list.createList(newListName);
  };
  const editListNameBtn = () => {
    market_list.editListName();
  };
  const deleteListBtn = () => { // no need for argument, it will take from selectedList
    market_list.deleteList();
  };
</script>

<style scoped></style>