<template>
  <select v-model="selectedList" id="list">
    <option v-for="list in lists" :key="list">
      {{ list }}
    </option>
  </select>
  <button @click="createList">Create New List</button>
  <button @click="editListName">Edit List Name</button>
  <button @click="deleteList">Delete List</button>

  <ul>
    <div v-for="(singleItem, index) in items_fields" :key="index">
      <!-- <div v-for="(value, key, indexS) in singleObject" :key="indexS"> -->
      <!--If its not NEW made document where we put 'name: "" ' just to create document in fb -->
      <!-- <li v-if="item.name !== ''"> -->
      <li>
        <div class="list_wrapper">
          <div class="first_row">buyer: {{ singleItem.buyer }}</div>
          <div class="second_row">name: {{ singleItem.name }}</div>
          <div class="third_row">
            amount:{{ singleItem.amount }}: {{ singleItem.unit }} | info
          </div>
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
</template>

<script setup>
/* IMPORTS
 */
import { useMarketListStore } from "@/stores/market-list-store.js";
import { onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
const market_list = useMarketListStore();
const { selectedList, items_fields, lists } = storeToRefs(market_list);

/* HOOKS
 */
// onBeforeMount(() => market_list.fetchLists());
// onActivated(async () => {
//   await market_list.fetchLists();
// });
onMounted(async () => {
  await market_list.fetchLists();
});
watch(
  () => market_list.selectedList,
  () => {
    if (market_list.selectedList !== "") {
      // Fetch the items for the newly selected list
      market_list.fetchListFields();
      market_list.fetchItemsFields();
    }
    //when is this.selectedList empty (deleted or not selected)
    else {
      // market_list.items = [];
      market_list.change_state("list_fields", []);
      market_list.change_state("items_fields", []);
    }
  }
);

/* METHODS
 */
const createList = async () => {
  // Display a form for the user to enter the list name
  const newListName = prompt("Enter the market list name");
  if (!newListName) {
    return;
  }
  market_list.createList(newListName);
};
const editListName = () => {
  market_list.editListName();
};
const deleteList = () => {
  market_list.deleteList();
};
</script>

<style scoped>
</style>