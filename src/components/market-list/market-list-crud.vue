<template>
  <div class="market-list-container">
    <!-- HEADER SALIST SELEKTOROM -->
    <div class="market-list-header card">
      <div class="header-content">
        <h1>Moje Kupovne Liste</h1>
        <div class="select-wrapper">
          <label for="list">Izaberite listu:</label>
          <div class="select-container">
            <select v-model="selectedList" id="list" class="list-select">
              <option value="">-- Odaberite listu --</option>
              <option v-for="list in lists" :key="list.id" :value="list.id">
                {{ list.name }}
              </option>
            </select>
            <button @click.stop="showMenu = !showMenu" class="menu-btn" title="Opcije liste">⋮</button>
            <div v-if="showMenu" ref="dropdownRef" class="menu-dropdown">
              <button @click="createListBtn" class="btn btn-primary">
                ➕ Nova Lista
              </button>
              <button @click="editListNameBtn" class="btn btn-secondary" :disabled="!selectedList">
                ✏️ Uredi Naziv
              </button>
              <button @click="copyListBtn" class="btn btn-outline" :disabled="!selectedList">
                📋 Kopiraj Listu
              </button>
              <button @click="deleteListBtn" class="btn btn-ghost" :disabled="!selectedList">
                🗑️ Obriši Listu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ADD ITEM BUTTON -->
    <div v-if="selectedList" class="add-item-button">
      <button @click="showAddForm = true" class="btn btn-success">
        ➕ Dodaj Stavku
      </button>
    </div>

    <!-- ADD ITEM FORM -->
    <div v-if="showAddForm" class="add-item-section">
      <Items-Crud @item-added="showAddForm = false" @cancel="showAddForm = false" />
    </div>

    <!-- STAVKE -->
    <div v-if="filteredItems.length > 0" class="items-section">
      <h2>Stavke na listi</h2>
      <div class="items-grid">
        <div v-for="(singleItem, index) in filteredItems" :key="index" class="item-card card">
          <!-- CHECKBOX AT TOP LEFT -->
          <div class="item-header">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                :checked="singleItem.completed"
                @change="toggleCompleted(singleItem, $event)"
                class="item-checkbox"
              />
              <span v-if="singleItem.completed" class="item-status completed">Završeno</span>
              <span v-else class="item-status pending">Na listi</span>
            </label>
            <div class="item-actions">
              <button @click="startEdit(singleItem)" class="btn-icon" title="Uredi">✏️</button>
              <button @click="debugDelete(singleItem)" class="btn-icon" title="Obriši">🗑️</button>
              <button @click="toggleExpanded(singleItem.id)" class="btn-icon" :title="expandedItems.has(singleItem.id) ? 'Prikaži sve' : 'Sakrij sve'">
                {{ expandedItems.has(singleItem.id) ? '▼' : '▲' }}
              </button>
            </div>
          </div>

          <!-- ITEM CONTENT -->
          <div class="item-content">
            <template v-if="editingId === singleItem.id">
              <div class="form-group">
                <label>Naziv</label>
                <input v-model="editForm.name" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Količina</label>
                  <input v-model="editForm.amount" type="number" />
                </div>
                <div class="form-group">
                  <label>Jedinica</label>
                    <select v-model="editForm.unit">
                      <option v-for="unit in UNITS" :key="unit" :value="unit">{{ unit }}</option>
                    </select>
                </div>
              </div>
              <div class="form-group">
                <label>Kupac</label>
                <input v-model="editForm.buyer" />
              </div>
              <div class="form-group">
                <label>Napomena</label>
                <input v-model="editForm.info" />
              </div>
              <div class="form-actions">
                <button class="btn btn-primary" @click.prevent="saveEdit(singleItem.id)">Sačuvaj</button>
                <button class="btn btn-outline" @click.prevent="cancelEdit">Otkaži</button>
              </div>
            </template>
            <template v-else>
              <div class="item-header-row">
                <h3 class="item-name">{{ singleItem.name }}</h3>
                <span v-if="expandedItems.has(singleItem.id)" class="item-quantity">{{ singleItem.amount }} {{ singleItem.unit }}</span>
              </div>
              <small v-if="expandedItems.has(singleItem.id) && singleItem.buyer" class="item-buyer">{{ singleItem.buyer }}</small>
              <button v-if="expandedItems.has(singleItem.id) && singleItem.info" @click="showInfoModal = true; selectedInfo = singleItem.info" class="btn-info" title="Prikaži napomenu">i</button>
              
              <div v-if="!expandedItems.has(singleItem.id)" class="item-details">
                <div class="detail-row">
                  <span class="label">Količina:</span>
                  <span class="value">{{ singleItem.amount }} {{ singleItem.unit }}</span>
                </div>
                
                <div class="detail-row" v-if="singleItem.buyer">
                  <span class="label">Kupac:</span>
                  <span class="value">{{ singleItem.buyer }}</span>
                </div>
                
                <div class="detail-row" v-if="singleItem.info">
                  <span class="label">Napomena:</span>
                  <span class="value">{{ singleItem.info }}</span>
                </div>
              </div>

              <!-- METADATA -->
              <div v-if="!expandedItems.has(singleItem.id)" class="item-metadata">
                <div class="meta-item">
                  <small class="meta-label meta-added">Dodata:</small>
                  <small class="meta-value">{{ formatDate(singleItem.timestamp) }}</small>
                </div>
                
                <div class="meta-item" v-if="singleItem.updatedAt">
                  <small class="meta-label meta-updated">Izmenjena:</small>
                  <small class="meta-value">{{ formatDate(singleItem.updatedAt) }}</small>
                </div>
                
                <div class="meta-item" v-if="singleItem.updatedBy">
                  <small class="meta-label meta-user">Izmenio:</small>
                  <small class="meta-value">{{ singleItem.updatedBy }}</small>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- PRAZAN ITEMS PLACEHOLDER -->
    <div v-else class="empty-state card">
      <p v-if="!selectedList">Izaberite kupovnu listu da vidite stavke</p>
      <p v-else-if="currentFilter === 'all'">Kliknite "Dodaj Stavku" iznad, da dodate novu stavku!</p>
      <p v-else>Nema stavki za filter "{{ filterText }}", ali možete dodati novu stavku klikom iznad na "Dodaj Stavku".</p>
    </div>

    <!-- INFO MODAL -->
    <div v-if="showInfoModal" class="info-modal-overlay" @click="showInfoModal = false">
      <div class="info-modal" @click.stop>
        <div class="modal-header">
          <span class="info-icon">ℹ️</span>
          <h4>Napomena</h4>
        </div>
        <div class="modal-body">
          <p>{{ selectedInfo }}</p>
        </div>
        <div class="modal-footer">
          <button @click="showInfoModal = false" class="btn btn-primary">OK</button>
        </div>
      </div>
    </div>

    <!-- CONFIRMATION MODAL -->
    <div v-if="showConfirmModal" class="confirm-modal-overlay" @click="cancelConfirm">
      <div class="confirm-modal" @click.stop>
        <div class="modal-header">
          <span class="warning-icon">⚠️</span>
          <h4>{{ confirmTitle }}</h4>
        </div>
        <div class="modal-body">
          <p>{{ confirmMessage }}</p>
        </div>
        <div class="modal-footer">
          <button @click="cancelConfirm" class="btn btn-secondary">Otkaži</button>
          <button @click="confirmAction" class="btn btn-error">{{ confirmButtonText }}</button>
        </div>
      </div>
    </div>

    <!-- EDIT LIST NAME MODAL -->
    <div v-if="showEditNameModal" class="edit-name-modal-overlay" @click="cancelEditName">
      <div class="edit-name-modal" @click.stop>
        <div class="modal-header">
          <span class="edit-icon">✏️</span>
          <h4>Uredi naziv liste</h4>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveNewListName" class="edit-name-form">
            <div class="form-group">
              <label for="newListName">Novi naziv liste:</label>
              <input
                v-model="newListName"
                type="text"
                id="newListName"
                placeholder="Unesite novi naziv liste"
                required
                autofocus
              />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="cancelEditName" class="btn btn-secondary">Otkaži</button>
          <button @click="saveNewListName" class="btn btn-primary" :disabled="!newListName.trim()">Sačuvaj</button>
        </div>
      </div>
    </div>

    <!-- COPY LIST NAME MODAL -->
    <div v-if="showCopyNameModal" class="copy-name-modal-overlay" @click="cancelCopyName">
      <div class="copy-name-modal" @click.stop>
        <div class="modal-header">
          <span class="copy-icon">📋</span>
          <h4>Kopiranje liste</h4>
        </div>
        <div class="modal-body">
          <p>Trenutna lista: <strong>{{ copySourceName }}</strong></p>
          <form @submit.prevent="executeCopyList" class="copy-name-form">
            <div class="form-group">
              <label for="copyListName">Naziv nove kopije:</label>
              <input
                v-model="copyListName"
                type="text"
                id="copyListName"
                placeholder="Unesite naziv nove kopije"
                required
                autofocus
              />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="cancelCopyName" class="btn btn-secondary">Otkaži</button>
          <button @click="executeCopyList" class="btn btn-primary" :disabled="!copyListName.trim()">Kopiraj</button>
        </div>
      </div>
    </div>

    <!-- CREATE NEW LIST MODAL -->
    <div v-if="showCreateListModal" class="create-list-modal-overlay" @click="cancelCreateList">
      <div class="create-list-modal" @click.stop>
        <div class="modal-header">
          <span class="create-icon">➕</span>
          <h4>Kreiranje nove liste</h4>
        </div>
        <div class="modal-body">
          <form @submit.prevent="executeCreateList" class="create-list-form">
            <div class="form-group">
              <label for="createListName">Naziv nove liste:</label>
              <input
                v-model="createListName"
                type="text"
                id="createListName"
                placeholder="Unesite naziv nove liste"
                required
                autofocus
              />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="cancelCreateList" class="btn btn-secondary">Otkaži</button>
          <button @click="executeCreateList" class="btn btn-primary" :disabled="!createListName.trim()">Kreiraj</button>
        </div>
      </div>
    </div>

    <!-- INFO MESSAGE MODAL -->
    <div v-if="showInfoMessageModal" class="info-message-modal-overlay" @click="closeInfoMessageModal">
      <div class="info-message-modal" @click.stop>
        <div class="modal-header">
          <span class="info-message-icon">ℹ️</span>
          <h4>Informacija</h4>
        </div>
        <div class="modal-body">
          <p>{{ infoMessage }}</p>
        </div>
        <div class="modal-footer">
          <button @click="closeInfoMessageModal" class="btn btn-primary">OK</button>
        </div>
      </div>
    </div>

    <!-- FILTERS SECTION -->
    <div v-if="selectedList" class="filters-section">
      <div class="filter-buttons">
        <button ref="allBtn" @click="currentFilter = 'all'" :class="currentFilter === 'all' ? 'btn active' : 'btn'">Sve</button>
        <button ref="pendingBtn" @click="currentFilter = 'pending'" :class="currentFilter === 'pending' ? 'btn active' : 'btn'">Na listi</button>
        <button ref="completedBtn" @click="currentFilter = 'completed'" :class="currentFilter === 'completed' ? 'btn active' : 'btn'">Završeno</button>
      </div>
      <div class="delete-completed">
        <button @click="deleteCompleted" class="btn btn-error">Obriši završene</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { UNITS } from "@/constants/units.js";
import { useMarketListStore } from "@/stores/market-list-store.js";
import { watch } from "vue";
import { storeToRefs } from "pinia";
import ItemsCrud from "@/components/market-list/items-crud.vue";
import { onMounted, onUnmounted, ref, reactive, computed, nextTick } from "vue";
import { useAuthStore } from "@/stores/auth-store";

const market_list = useMarketListStore();
const { selectedList, items_fields, lists } = storeToRefs(market_list);
const auth = useAuthStore();

// Editing state
const editingId = ref("");
const showAddForm = ref(false);
const expandedItems = ref(new Set());
const showMenu = ref(false);
const showInfoModal = ref(false);

// Watch for changes in items_fields and set all items to expanded (hidden details)
watch(items_fields, () => {
  expandedItems.value.clear();
  items_fields.value.forEach(item => {
    expandedItems.value.add(item.id);
  });
});
const selectedInfo = ref("");
const showConfirmModal = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
const confirmButtonText = ref("Potvrdi");
const confirmCallback = ref(null);
const showEditNameModal = ref(false);
const newListName = ref("");
const showCopyNameModal = ref(false);
const copyListName = ref("");
const copySourceName = ref("");
const showCreateListModal = ref(false);
const createListName = ref("");
const showInfoMessageModal = ref(false);
const infoMessage = ref("");
const currentFilter = ref('all');
const dropdownRef = ref(null);
const allBtn = ref(null);
const pendingBtn = ref(null);
const completedBtn = ref(null);

const closeMenu = () => {
  showMenu.value = false;
};

// Confirmation modal functions
const showConfirm = (title, message, buttonText = "Potvrdi", callback) => {
  confirmTitle.value = title;
  confirmMessage.value = message;
  confirmButtonText.value = buttonText;
  confirmCallback.value = callback;
  showConfirmModal.value = true;
};

const confirmAction = () => {
  if (confirmCallback.value) {
    confirmCallback.value();
  }
  showConfirmModal.value = false;
};

const cancelConfirm = () => {
  showConfirmModal.value = false;
  confirmCallback.value = null;
};

// Edit name modal functions
const showEditNameModalFunc = () => {
  if (!market_list.selectedList) {
    showInfoMessage('Izaberite listu za uređivanje');
    return;
  }
  const current = market_list.lists.find(l => l.id === market_list.selectedList);
  newListName.value = current ? current.name : '';
  showEditNameModal.value = true;
};

const cancelEditName = () => {
  showEditNameModal.value = false;
  newListName.value = '';
};

const saveNewListName = async () => {
  const trimmedName = newListName.value.trim();
  if (!trimmedName) {
    showInfoMessage('Naziv liste ne može biti prazan');
    return;
  }

  try {
    const result = await market_list.editListName(trimmedName);
    if (result.success) {
      showEditNameModal.value = false;
      newListName.value = '';
      showInfoMessage(result.message);
    } else {
      showInfoMessage(result.message);
    }
  } catch (error) {
    console.error("Error editing list name:", error);
    showInfoMessage("Greška pri uređivanju naziva liste");
  }
};

// Copy name modal functions
const showCopyNameModalFunc = (sourceName) => {
  copySourceName.value = sourceName;
  copyListName.value = `${sourceName} (kopija)`;
  showCopyNameModal.value = true;
};

const cancelCopyName = () => {
  showCopyNameModal.value = false;
  copyListName.value = '';
  copySourceName.value = '';
};

const executeCopyList = async () => {
  const trimmedName = copyListName.value.trim();
  if (!trimmedName) {
    showInfoMessage('Naziv kopije ne može biti prazan');
    return;
  }

  try {
    const result = await market_list.copyList(trimmedName);
    if (result.success) {
      showCopyNameModal.value = false;
      copyListName.value = '';
      copySourceName.value = '';
      showInfoMessage(result.message);
    } else {
      showInfoMessage(result.message);
    }
  } catch (error) {
    console.error("Error copying list:", error);
    showInfoMessage("Greška pri kopiranju liste");
  }
};

// Create list modal functions
const showCreateListModalFunc = () => {
  createListName.value = '';
  showCreateListModal.value = true;
};

const cancelCreateList = () => {
  showCreateListModal.value = false;
  createListName.value = '';
};

const executeCreateList = async () => {
  const trimmedName = createListName.value.trim();
  if (!trimmedName) {
    showInfoMessage('Naziv liste ne može biti prazan');
    return;
  }

  try {
    const result = await market_list.createList(trimmedName);
    if (result.success) {
      showCreateListModal.value = false;
      createListName.value = '';
    } else {
      showInfoMessage(result.message || "Greška pri kreiranju liste");
    }
  } catch (error) {
    console.error("Error creating list:", error);
    showInfoMessage("Greška pri kreiranju liste");
  }
};

// Info message modal functions
const showInfoMessage = (message) => {
  infoMessage.value = message;
  showInfoMessageModal.value = true;
};

const closeInfoMessageModal = () => {
  showInfoMessageModal.value = false;
  infoMessage.value = '';
};

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeMenu();
  }
};
const editForm = reactive({
  name: "",
  amount: "",
  unit: "Kom/Kesa",
  buyer: "",
  info: "",
});

// Filtered items
const filteredItems = computed(() => {
  switch (currentFilter.value) {
    case 'pending':
      return items_fields.value.filter(item => !item.completed);
    case 'completed':
      return items_fields.value.filter(item => item.completed);
    default:
      return items_fields.value;
  }
});

// Filter text for display
const filterText = computed(() => {
  switch (currentFilter.value) {
    case 'pending':
      return 'Na listi';
    case 'completed':
      return 'Završeno';
    default:
      return 'Sve';
  }
});

const startEdit = (item) => {
  editingId.value = item.id;
  editForm.name = item.name || "";
  editForm.amount = item.amount || "";
  editForm.unit = item.unit || "Kom/Kesa";
  editForm.buyer = item.buyer || "";
  editForm.info = item.info || "";
};

const cancelEdit = () => {
  editingId.value = "";
};

const saveEdit = async (itemId) => {
  if (!editForm.name || !editForm.name.trim()) {
    showInfoMessage('Unesite naziv stavke');
    return;
  }
  if (!editForm.amount || editForm.amount <= 0) {
    showInfoMessage('Unesite količinu (mora biti veća od 0)');
    return;
  }
  if (!editForm.unit || !editForm.unit.trim()) {
    showInfoMessage('Izaberite jedinicu mere');
    return;
  }
  const payload = {
    name: editForm.name,
    amount: editForm.amount,
    unit: editForm.unit,
    buyer: editForm.buyer,
    info: editForm.info,
  };
  try {
    await market_list.updateItem(itemId, payload);
    editingId.value = "";
  } catch (e) {
    console.error('Error saving edit', e);
    showInfoMessage('Greška pri čuvanju izmene');
  }
};

onMounted(async () => {
  if (auth && typeof auth.waitForAuth === "function") {
    try {
      await auth.waitForAuth();
    } catch (e) {
      console.warn("waitForAuth failed", e);
    }
  }
  market_list.fetchLists();
  market_list.realTimeListeners();
  if (market_list.selectedList) {
    market_list.fetchItemsFields();
  }
  document.addEventListener('click', handleClickOutside);
  
  // Removed focus on mount to prevent unwanted scrolling to bottom
  // Focus will still work when user interacts with filter buttons

  // Set custom validation messages for required fields
  const setCustomValidationMessages = () => {
    const requiredInputs = document.querySelectorAll('input[required]');
    requiredInputs.forEach(input => {
      input.addEventListener('invalid', (e) => {
        if (e.target.validity.valueMissing) {
          e.target.setCustomValidity('Popunite obavezno polje');
        }
      });
      input.addEventListener('input', (e) => {
        if (e.target.validity.valid) {
          e.target.setCustomValidity('');
        }
      });
    });
  };

  // Use nextTick to ensure DOM is updated
  nextTick(() => {
    setCustomValidationMessages();
  });
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

watch(
  () => market_list.selectedList,
  () => {
    currentFilter.value = 'all';
    if (market_list.selectedList !== "") {
      market_list.fetchItemsFields();
    } else {
      market_list.change_state("list_fields", []);
      market_list.change_state("items_fields", []);
    }
  }
);

// Focus active button when filter changes
watch(currentFilter, (newFilter) => {
  if (newFilter === 'all' && allBtn.value) {
    allBtn.value.focus();
  } else if (newFilter === 'pending' && pendingBtn.value) {
    pendingBtn.value.focus();
  } else if (newFilter === 'completed' && completedBtn.value) {
    completedBtn.value.focus();
  }
});

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('sr-RS', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const toggleExpanded = (id) => {
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id);
  } else {
    expandedItems.value.add(id);
  }
};

const createListBtn = async () => {
  showCreateListModalFunc();
};

const editListNameBtn = () => {
  showEditNameModalFunc();
};

const deleteListBtn = () => {
  if (!market_list.selectedList) {
    showInfoMessage('Izaberite listu za brisanje');
    return;
  }
  const current = market_list.lists.find(l => l.id === market_list.selectedList);
  showConfirm(
    'Brisanje liste',
    `Da li ste sigurni da želite da obrišete listu "${current ? current.name : ''}" i sve stavke u njoj?`,
    'Obriši',
    async () => {
      const result = await market_list.deleteList(null, true);
      if (result.success) {
        showInfoMessage(result.message);
      } else {
        showInfoMessage(result.message);
      }
    }
  );
};

const copyListBtn = async () => {
  if (!market_list.selectedList) {
    showInfoMessage('Izaberite listu za kopiranje');
    return;
  }
  const current = market_list.lists.find(l => l.id === market_list.selectedList);
  showConfirm(
    'Kopiranje liste',
    `Kopirati listu "${current ? current.name : ''}"?`,
    'Kopiraj',
    () => {
      showCopyNameModalFunc(current ? current.name : '');
    }
  );
};

const deleteCompleted = async () => {
  const completedItems = items_fields.value.filter(item => item.completed);
  if (completedItems.length === 0) {
    showInfoMessage('Nema završenih stavki za brisanje');
    return;
  }
  showConfirm(
    'Brisanje završenih stavki',
    `Da li želite da obrišete ${completedItems.length} završenih stavki?`,
    'Obriši',
    async () => {
      for (const item of completedItems) {
        await market_list.deleteItem(item, true);
      }
    }
  );
};

const debugDelete = (item) => {
  console.log("Full item object:", item);
  console.log("Item ID:", item.id);
  console.log("Selected list:", market_list.selectedList);
  showConfirm(
    'Brisanje stavke',
    `Da li ste sigurni da želite da obrišete stavku "${item.name}"?`,
    'Obriši',
    () => {
      market_list.deleteItem(item, true);
    }
  );
};

const editItem = (itemId) => {
  const it = market_list.items_fields.find(i => i.id === itemId);
  if (it) startEdit(it);
};

const toggleCompleted = async (item, ev) => {
  const checked = ev.target.checked;
  try {
    await market_list.updateItemCompletion(item.id, checked);
  } catch (e) {
    console.error('Error toggling completion', e);
    showInfoMessage('Greška pri promeni statusa itema');
  }
};
</script>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;
@use "sass:color";

.market-list-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: $space-lg;

  @include md {
    padding: $space-2xl;
  }
}

// ======== HEADER ========
.market-list-header {
  margin-bottom: $space-2xl;
  background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
  color: white;

  h1 {
    color: white;
    margin-bottom: $space-lg;
  }

  .header-content {
    display: flex;
    flex-direction: column;
    gap: $space-lg;

    @include md {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
    }
  }

  .select-wrapper {
    display: flex;
    flex-direction: column;
    gap: $space-sm;
    flex: 1;

    @include md {
      max-width: 300px;
    }

    label {
      color: rgba(255, 255, 255, 0.9);
      font-weight: $fw-semibold;
      font-size: $fs-sm;
    }

    .list-select {
      padding: $space-sm $space-md $space-sm $space-sm;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: $radius-md;
      background-color: rgba(255, 255, 255, 0.95);
      color: $text-primary;
      font-size: $fs-base;
      font-weight: $fw-medium;
      cursor: pointer;
      transition: all $transition-base;
      width: 100%;

      &:hover {
        border-color: rgba(255, 255, 255, 0.6);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      &:focus {
        outline: none;
        border-color: white;
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
      }
    }

    .select-container {
      display: flex;
      align-items: center;
      gap: $space-sm;
      position: relative;

      .menu-btn {
        @include reset-button;
        padding: $space-sm;
        font-size: 18px;
        color: rgba(255, 255, 255, 0.9);
        cursor: pointer;
        border-radius: $radius-md;
        transition: all $transition-fast;

        &:hover {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
        }
      }

      .menu-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background-color: $bg-surface;
        border: 1px solid $border-color;
        border-radius: $radius-md;
        box-shadow: $shadow-lg;
        padding: $space-md;
        display: flex;
        flex-direction: column;
        gap: $space-sm;
        z-index: 10;
        min-width: 200px;

        .btn {
          width: 100%;
          justify-content: flex-start;
          font-size: $fs-sm;
        }
      }
    }
  }
}

// ======== ADD ITEM BUTTON ========
.add-item-button {
  margin-bottom: $space-lg;
  text-align: center;

  .btn {
    display: inline-flex;
  }
}

// ======== ITEMS SECTION ========
.items-section {
  margin-bottom: $space-2xl;

  h2 {
    margin-bottom: $space-lg;
    color: $text-primary;
    font-size: $fs-lg;

    @include md {
      font-size: $fs-xl;
    }
  }
}

.items-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-lg;

  @include md {
    grid-template-columns: repeat(2, 1fr);
  }

  @include lg {
    grid-template-columns: repeat(3, 1fr);
  }
}

// ======== ITEM CARD ========
.item-card {
  display: flex;
  flex-direction: column;
  transition: all $transition-base;
  padding: $space-lg;

  &:hover {
    box-shadow: $shadow-lg;
    transform: translateY(-4px);
  }

  .item-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: $space-md;
    padding-bottom: $space-md;
    border-bottom: 2px solid $border-color;

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: $space-sm;
      cursor: pointer;
      user-select: none;

      .item-checkbox {
        width: 24px;
        height: 24px;
        cursor: pointer;
        accent-color: $primary;
        transition: all $transition-fast;

        &:hover {
          transform: scale(1.1);
        }

        &:checked {
          // accent-color: $success;
        }
      }

      .item-status {
        font-weight: $fw-semibold;
        font-size: $fs-sm;

        &.completed {
          color: $success;
        }

        &.pending {
          color: $warning;
        }
      }
    }

    .item-actions {
      display: flex;
      gap: $space-sm;

      .btn-icon {
        @include reset-button;
        padding: $space-xs;
        font-size: 18px;
        cursor: pointer;
        transition: all $transition-fast;
        border-radius: $radius-md;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;

        &:hover {
          background-color: $bg-primary;
          transform: scale(1.15);
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }
  }

  .item-content {
    flex: 1;

    .item-name {
      color: $text-primary;
      margin-bottom: $space-md;
      word-break: break-word;
    }

    .item-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .item-quantity {
        color: $text-secondary;
        font-size: $fs-sm;
        font-weight: $fw-semibold;
      }
    }

    .item-buyer {
      color: $text-secondary;
      font-size: $fs-xs;
      border: 1px solid $text-secondary;
      border-radius: $radius-sm;
      padding: $space-xs $space-sm;
      display: inline-block;
      margin-top: $space-xs;
      margin-right: $space-sm;
    }

    .btn-info {
      @include reset-button;
      color: $text-secondary;
      font-size: $fs-sm;
      font-weight: $fw-semibold;
      border: 1px solid $text-secondary;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all $transition-fast;
      margin-top: $space-xs;

      &:hover {
        background-color: $text-secondary;
        color: $bg-primary;
      }
    }

    .item-details {
      margin-bottom: $space-lg;
      background-color: $bg-primary;
      padding: $space-md;
      border-radius: $radius-md;

      .detail-row {
        display: flex;
        justify-content: space-between;
        gap: $space-md;
        margin-bottom: $space-sm;
        font-size: $fs-sm;

        &:last-child {
          margin-bottom: 0;
        }

        .label {
          font-weight: $fw-semibold;
          color: $text-secondary;
          flex-shrink: 0;
        }

        .value {
          color: $text-primary;
          text-align: right;
          word-break: break-word;
        }
      }
    }
  }

  .item-metadata {
    border-top: 1px solid $border-color;
    padding-top: $space-md;
    display: grid;
    grid-template-columns: 1fr;
    gap: $space-sm;

    @include md {
      grid-template-columns: repeat(2, 1fr);
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: $space-xs;

      .meta-label {
        color: $text-secondary;
        font-weight: $fw-semibold;
        font-size: $fs-xs;
        text-transform: uppercase;

        &.meta-added {
          color: $success;
        }

        &.meta-updated {
          color: $warning;
        }

        &.meta-user {
          color: $primary;
        }
      }

      .meta-value {
        color: $text-primary;
        font-size: $fs-sm;
      }
    }
  }
}

// ======== EMPTY STATE ========
.empty-state {
  text-align: center;
  padding: $space-3xl $space-lg;
  background: linear-gradient(135deg, $bg-primary 0%, $bg-surface 100%);
  border: 2px dashed $border-color;
  color: $text-secondary;
  font-size: $fs-base;

  p {
    margin: 0;
  }
}

// ======== ADD ITEM SECTION ========
.add-item-section {
  margin-top: $space-2xl;
}

// ======== FORM ACTIONS ========
.form-actions {
  display: flex;
  justify-content: space-between;
  gap: $space-md;
  margin-top: $space-lg;
  padding-top: $space-lg;
  border-top: 1px solid $border-color;

  .btn {
    flex: 1;
    justify-content: center;
  }
}

// ======== INFO MODAL ========
.info-modal-overlay {
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

.info-modal {
  background-color: $bg-surface;
  border-radius: $radius-lg;
  box-shadow: $shadow-xl;
  max-width: 400px;
  width: 90%;
  padding: $space-lg;

  .modal-header {
    display: flex;
    align-items: center;
    gap: $space-sm;
    margin-bottom: $space-md;
    padding-bottom: $space-md;
    border-bottom: 1px solid $border-color;

    .info-icon {
      font-size: 24px;
    }

    h4 {
      margin: 0;
      color: $text-primary;
    }
  }

  .modal-body {
    margin-bottom: $space-lg;

    p {
      margin: 0;
      color: $text-primary;
      line-height: 1.5;
    }
  }

  .modal-footer {
    text-align: right;

    .btn {
      min-width: 80px;
    }
  }
}

// ======== CONFIRMATION MODAL ========
.confirm-modal-overlay {
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

.confirm-modal {
  background-color: $bg-surface;
  border-radius: $radius-lg;
  box-shadow: $shadow-xl;
  max-width: 400px;
  width: 90%;
  padding: $space-lg;

  .modal-header {
    display: flex;
    align-items: center;
    gap: $space-sm;
    margin-bottom: $space-md;
    padding-bottom: $space-md;
    border-bottom: 1px solid $border-color;

    .warning-icon {
      font-size: 24px;
    }

    h4 {
      margin: 0;
      color: $text-primary;
    }
  }

  .modal-body {
    margin-bottom: $space-lg;

    p {
      margin: 0;
      color: $text-primary;
      line-height: 1.5;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: $space-sm;

    .btn {
      min-width: 80px;
    }
  }
}

// ======== EDIT NAME MODAL ========
.edit-name-modal-overlay {
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

.edit-name-modal {
  background-color: $bg-surface;
  border-radius: $radius-lg;
  box-shadow: $shadow-xl;
  max-width: 400px;
  width: 90%;
  padding: $space-lg;

  .modal-header {
    display: flex;
    align-items: center;
    gap: $space-sm;
    margin-bottom: $space-md;
    padding-bottom: $space-md;
    border-bottom: 1px solid $border-color;

    .edit-icon {
      font-size: 24px;
    }

    h4 {
      margin: 0;
      color: $text-primary;
    }
  }

  .modal-body {
    margin-bottom: $space-lg;

    .edit-name-form {
      .form-group {
        label {
          display: block;
          margin-bottom: $space-xs;
          font-weight: $fw-medium;
          color: $text-primary;
        }

        input {
          width: 100%;
          padding: $space-sm $space-md;
          border: 1px solid $border-color;
          border-radius: $radius-md;
          font-size: $fs-base;
          transition: border-color $transition-base;

          &:focus {
            outline: none;
            border-color: $primary;
            box-shadow: 0 0 0 2px rgba($primary, 0.1);
          }
        }
      }
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: $space-sm;

    .btn {
      min-width: 80px;
    }
  }
}

// ======== COPY NAME MODAL ========
.copy-name-modal-overlay {
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

.copy-name-modal {
  background-color: $bg-surface;
  border-radius: $radius-lg;
  box-shadow: $shadow-xl;
  max-width: 400px;
  width: 90%;
  padding: $space-lg;

  .modal-header {
    display: flex;
    align-items: center;
    gap: $space-sm;
    margin-bottom: $space-md;
    padding-bottom: $space-md;
    border-bottom: 1px solid $border-color;

    .copy-icon {
      font-size: 24px;
    }

    h4 {
      margin: 0;
      color: $text-primary;
    }
  }

  .modal-body {
    margin-bottom: $space-lg;

    p {
      margin: 0 0 $space-md 0;
      color: $text-primary;
      font-size: $fs-sm;

      strong {
        color: $text-primary;
        font-weight: $fw-semibold;
      }
    }

    .copy-name-form {
      .form-group {
        label {
          display: block;
          margin-bottom: $space-xs;
          font-weight: $fw-medium;
          color: $text-primary;
        }

        input {
          width: 100%;
          padding: $space-sm $space-md;
          border: 1px solid $border-color;
          border-radius: $radius-md;
          font-size: $fs-base;
          transition: border-color $transition-base;

          &:focus {
            outline: none;
            border-color: $primary;
            box-shadow: 0 0 0 2px rgba($primary, 0.1);
          }
        }
      }
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: $space-sm;

    .btn {
      min-width: 80px;
    }
  }
}

// ======== INFO MESSAGE MODAL ========
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
  background-color: $bg-surface;
  border-radius: $radius-lg;
  box-shadow: $shadow-xl;
  max-width: 400px;
  width: 90%;
  padding: $space-lg;

  .modal-header {
    display: flex;
    align-items: center;
    gap: $space-sm;
    margin-bottom: $space-md;
    padding-bottom: $space-md;
    border-bottom: 1px solid $border-color;

    .info-message-icon {
      font-size: 24px;
    }

    h4 {
      margin: 0;
      color: $text-primary;
    }
  }

  .modal-body {
    margin-bottom: $space-lg;

    p {
      margin: 0;
      color: $text-primary;
      line-height: 1.5;
      text-align: center;
    }
  }

  .modal-footer {
    text-align: center;

    .btn {
      min-width: 80px;
    }
  }
}

// ======== CREATE LIST MODAL ========
.create-list-modal-overlay {
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

.create-list-modal {
  background-color: $bg-surface;
  border-radius: $radius-lg;
  box-shadow: $shadow-xl;
  max-width: 400px;
  width: 90%;
  padding: $space-lg;

  .modal-header {
    display: flex;
    align-items: center;
    gap: $space-sm;
    margin-bottom: $space-md;
    padding-bottom: $space-md;
    border-bottom: 1px solid $border-color;

    .create-icon {
      font-size: 24px;
    }

    h4 {
      margin: 0;
      color: $text-primary;
    }
  }

  .modal-body {
    margin-bottom: $space-lg;

    .create-list-form {
      .form-group {
        label {
          display: block;
          margin-bottom: $space-xs;
          font-weight: $fw-medium;
          color: $text-primary;
        }

        input {
          width: 100%;
          padding: $space-sm $space-md;
          border: 1px solid $border-color;
          border-radius: $radius-md;
          font-size: $fs-base;
          transition: border-color $transition-base;

          &:focus {
            outline: none;
            border-color: $primary;
            box-shadow: 0 0 0 2px rgba($primary, 0.1);
          }
        }
      }
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: $space-sm;

    .btn {
      min-width: 80px;
    }
  }
}

// ======== FILTERS SECTION ========
.filters-section {
  margin-top: $space-2xl;
  padding: $space-lg;
  background-color: $bg-surface;
  border-radius: $radius-lg;
  border: 1px solid $border-color;

  @include tablet {
    display: flex;
    align-items: center;
    gap: $space-md;
  }

  .filter-buttons {
    display: flex;
    gap: $space-md;
    justify-content: center;
    margin-bottom: $space-lg;

    @include tablet {
      margin-bottom: 0;
      flex: 3;
    }

    .btn {
      flex: 1;
      // max-width: 120px;
      border: 1px solid $border-color;

      &.active {
        background-color: color.adjust($success, $lightness: -10%) !important;
        border: 2px solid color.adjust($success, $lightness: -10%) !important;
        color: white !important;
      }
    }
  }

  .delete-completed {
    margin-top: $space-lg;
    display: flex;
    justify-content: center;

    @include tablet {
      margin-top: 0;
      flex: 1;
    }

    .btn {
      width: 100%;
    }
  }
}
</style>