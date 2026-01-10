<template>
  <div class="add-item-card card">
    <div class="form-header">
      <h3>Dodaj Novu Stavku</h3>
      <button @click="emit('cancel')" class="close-btn" title="Zatvori">×</button>
    </div>
    
    <form @submit.prevent="saveItem" class="add-item-form">
      <div class="form-group">
        <label for="name">Šta trebate kupiti? *</label>
        <input 
          v-model="nameInput" 
          type="text" 
          id="name"
          placeholder="npr. Mleko, Hleb, Parametre..."
          required
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="amount">Količina *</label>
          <input 
            v-model="amountInput" 
            type="number"
            id="amount"
            placeholder="npr. 2"
            required
          />
        </div>

        <div class="form-group">
          <label for="unit">Jedinica mere *</label>
          <select id="unit" v-model="unitSelect">
            <option v-for="unit in UNITS" :value="unit" :key="unit">
              {{ unit }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="buyer">Ko će kupiti? (opciono)</label>
        <input 
          v-model="buyerInput" 
          type="text" 
          id="buyer"
          placeholder="Vaše ime ili 'Sam/Sama'"
        />
      </div>

      <div class="form-group">
        <label for="info">Napomena (opciono)</label>
        <input 
          v-model="infoInput" 
          type="text" 
          id="info"
          placeholder="npr. Bez mleka, bez glutena..."
        />
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">
          ➕ Dodaj na Listu
        </button>
        <button type="button" @click="emit('cancel')" class="btn btn-outline">
          Otkaži
        </button>
      </div>
    </form>
  </div>

  <!-- INFO MESSAGE MODAL -->
  <div v-if="showInfoMessageModal" class="info-message-modal-overlay" @click="showInfoMessageModal = false">
    <div class="info-message-modal" @click.stop>
      <div class="modal-header">
        <h3>Obaveštenje</h3>
      </div>
      <div class="modal-body">
        <p>{{ infoMessage }}</p>
      </div>
      <div class="modal-footer">
        <button @click="showInfoMessageModal = false" class="btn btn-primary">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useMarketListStore } from "@/stores/market-list-store.js";

const emit = defineEmits(['item-added', 'cancel']);

const nameInput = ref("");
const amountInput = ref("");
const unitSelect = ref("Kom/Kesa");
const infoInput = ref("");
const buyerInput = ref("");

// Modal state
const showInfoMessageModal = ref(false);
const infoMessage = ref("");

import { UNITS } from "@/constants/units.js";

const market_list = useMarketListStore();

const saveItem = async () => {
  if (!nameInput.value.trim()) {
    showInfoMessage("Unesite naziv stavke!");
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

  try {
    await market_list.saveItem(itemData);
    clearForm();
    emit('item-added');
  } catch (error) {
    console.error("Greška pri dodavanju stavke:", error);
    showInfoMessage("Greška pri dodavanju stavke!");
  }
};

const showInfoMessage = (message) => {
  infoMessage.value = message;
  showInfoMessageModal.value = true;
};

const clearForm = () => {
  nameInput.value = "";
  amountInput.value = "";
  unitSelect.value = "Kom/Kesa";
  infoInput.value = "";
  buyerInput.value = "";
};
</script>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.add-item-card {
  background: linear-gradient(135deg, $bg-surface 0%, rgba($secondary, 0.05) 100%);
  border-left: 4px solid $secondary;

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $space-lg;

    h3 {
      color: $secondary;
      margin: 0;
    }

    .close-btn {
      @include reset-button;
      font-size: 24px;
      color: $text-secondary;
      cursor: pointer;
      padding: $space-xs;
      border-radius: $radius-md;
      transition: all $transition-fast;

      &:hover {
        background-color: $bg-primary;
        color: $text-primary;
      }
    }
  }
}

.add-item-form {
  display: flex;
  flex-direction: column;
  gap: $space-lg;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-lg;

  @include md {
    grid-template-columns: 1fr 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $space-sm;

  label {
    font-weight: $fw-semibold;
    color: $text-primary;
    font-size: $fs-sm;
  }

  input,
  select {
    padding: $space-sm $space-md;
    border: 2px solid $border-color;
    border-radius: $radius-md;
    font-size: $fs-base;
    font-family: inherit;
    transition: all $transition-fast;

    &:focus {
      border-color: $secondary;
      box-shadow: 0 0 0 3px rgba($secondary, 0.1);
      outline: none;
    }

    &::placeholder {
      color: $text-tertiary;
    }
  }

  select {
    cursor: pointer;
    background-color: $bg-surface;
    color: $text-primary;
  }
}

// Modal styles
.info-message-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.info-message-modal {
  background: $bg-surface;
  border-radius: $radius-lg;
  box-shadow: $shadow-lg;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;

  .modal-header {
    padding: $space-lg;
    border-bottom: 1px solid $border-color;
    text-align: center;

    h3 {
      margin: 0;
      color: $text-primary;
      font-size: $fs-lg;
      font-weight: $fw-semibold;
    }
  }

  .modal-body {
    padding: $space-lg;

    p {
      margin: 0;
      color: $text-primary;
      font-size: $fs-base;
      line-height: 1.5;
      text-align: center;
    }
  }

  .modal-footer {
    padding: $space-lg;
    border-top: 1px solid $border-color;
    text-align: center;

    .btn {
      min-width: 80px;
    }
  }
}

.form-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-md;
  margin-top: $space-lg;
  padding-top: $space-lg;
  border-top: 1px solid $border-color;

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>