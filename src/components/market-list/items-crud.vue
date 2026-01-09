<template>
  <label for="name">What you need to buy / to do?</label>
  <input v-model="nameInput" type="text" id="name" />
  <label for="amount">Amount?</label>
  <input v-model="amountInput" type="text" id="amount" />
  <label for="unit">Unit?</label>
  <select id="unit" v-model="unitSelect">
    <option v-for="(unit, key) in unitList" :value="unit" :key="key">
      {{ unit }}
    </option>
  </select>
  <label for="info">More informations? Napomena</label>
  <input v-model="infoInput" type="text" id="info" />
  <label for="buyer">Who will buy it (leave empty if its you)</label>
  <input v-model="buyerInput" type="text" id="buyer" />
  <button @click="saveItem">Snimi</button>
</template>

<script setup>
/* IMPORTS
 */
import { ref, reactive } from "vue";
import { useMarketListStore } from "@/stores/market-list-store.js";
/*REFS
 */
const nameInput = ref("");
const amountInput = ref("");
const unitSelect = ref("Kom/Piece");
const infoInput = ref("");
const buyerInput = ref("");

const unitList = reactive([
  "Kom/Piece",
  "Kg",
  "Litar",
  "Meter",
  "Spoon",
  "Tablespoon",
]);

const market_list = useMarketListStore();

/* HOOKS
 */

/* METHODS
 */
const saveItem = async () => {
  if (!nameInput.value.trim()) {
    alert("Please enter an item name");
    return;
  }

  const itemData = {
    name: nameInput.value,
    amount: amountInput.value,
    unit: unitSelect.value,
    info: infoInput.value,
    buyer: buyerInput.value,
    completed: false,
    timestamp: new Date(),
  };

  await market_list.saveItem(itemData);
  
  // Clear inputs after saving
  nameInput.value = "";
  amountInput.value = "";
  unitSelect.value = "Kom/Piece";
  infoInput.value = "";
  buyerInput.value = "";
};
</script>
<style scoped>
input,
select {
  display: block;
  margin: 5px 0;
}
</style>