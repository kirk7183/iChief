<template>
  <select v-model="selectedList" id="list">
    <option value="">-- Select a list --</option>
    <option v-for="list in lists" :key="list.id" :value="list.id">
      {{ list.name }}
    </option>
  </select>
  <button @click="createListBtn">Create New List</button>
  <button @click="editListNameBtn('edit')">Edit List Name</button>
  <button @click="copyListBtn">Copy List</button>
  <button @click="deleteListBtn">Delete List</button>


  <ul>
    <div v-for="(singleItem, index) in items_fields" :key="index">
      <!-- <div v-for="(value, key, indexS) in singleObject" :key="indexS"> -->
      <!--If its not NEW made document where we put 'name: "" ' just to create document in FireBase -->
      <!-- <li v-if="item.name !== ''"> -->
      <li>
        <div class="list_wrapper">
          <div class="name">name: {{ singleItem.name }}</div>
          <div class="amount">
            amount: {{ singleItem.amount }} {{ singleItem.unit }}
          </div>
          <div class="buyer">buyer: {{ singleItem.buyer }}</div>
          <div class="info"> info: {{ singleItem.info }}</div>
          <div class="completed">
            <label>
              <input type="checkbox" :checked="singleItem.completed" @change="toggleCompleted(singleItem, $event)" />
              Završeno
            </label>
          </div>
          <div class="timestamp">Datum: {{ formatDate(singleItem.timestamp) }}</div>
          <div class="updated">
            <div v-if="singleItem.updatedBy || singleItem.updatedAt">
              <small>Izmenio: {{ singleItem.updatedBy ? singleItem.updatedBy : '—' }}
              &nbsp;|&nbsp; {{ singleItem.updatedAt ? formatDate(singleItem.updatedAt) : '' }}</small>
            </div>
          </div>
        </div>
        <!-- object {{ object }},index {{ index }} key {{ key }},value {{ value }},
          index5 {{ index5 }} -->
        <!-- {{ singleItem.name }},{{ singleItem.amount }},{{ singleItem.unit }},{{
          singleItem.buyer
        }}, {{ singleItem.info }},
        {{ singleItem.completed }} -->
        <button @click="editItem(singleItem.id)">Edit</button>
        <button @click="debugDelete(singleItem)">Delete</button>
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
  import { onMounted } from "vue";
  import { useAuthStore } from "@/stores/auth-store";
  const auth = useAuthStore();

  /* HOOKS */
  onMounted(async () => {
    // Wait for initial auth state so we have user's email for DB paths
    if (auth && typeof auth.waitForAuth === "function") {
      try {
        await auth.waitForAuth();
      } catch (e) {
        console.warn("waitForAuth failed", e);
      }
    }
    // Now safe to fetch lists and attach realtime listeners
    market_list.fetchLists();
    market_list.realTimeListeners();
    // If a list is already selected (persisted), fetch its items
    if (market_list.selectedList) {
      market_list.fetchItemsFields();
    }
  });
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
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('sr-RS', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

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
  const copyListBtn = async () => {
    if (!market_list.selectedList) {
      alert('Select a list to copy');
      return;
    }
    const current = market_list.lists.find(l => l.id === market_list.selectedList);
    const confirmCopy = window.confirm(`Copy list "${current ? current.name : ''}"?`);
    if (!confirmCopy) return;
    const newName = prompt('Enter name for the new copied list');
    if (!newName) return;
    await market_list.copyList(newName);
  };
  const deleteItem = (itemId) => {
    market_list.deleteItem(itemId);
  };
  const debugDelete = (item) => {
    console.log("Full item object:", item);
    console.log("Item ID:", item.id);
    console.log("Selected list:", market_list.selectedList);
    market_list.deleteItem(item);
  };
  const editItem = (itemId) => {
    console.log("Edit item:", itemId);
    // TODO: Implement edit functionality
  };
  const toggleCompleted = async (item, ev) => {
    const checked = ev.target.checked;
    try {
      await market_list.updateItemCompletion(item.id, checked);
    } catch (e) {
      console.error('Error toggling completion', e);
      // Optionally revert checkbox UI if needed
      alert('Greška pri promeni statusa itema');
    }
  };
</script>

<style scoped></style>