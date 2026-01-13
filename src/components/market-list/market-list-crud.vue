<template>
  <div class="market-list-container">
    <!-- HEADER SALIST SELEKTOROM -->
    <div class="market-list-header card">
      <div class="header-content">
        <h1>Moje Kupovne Liste</h1>
        <div class="header-actions">
          <button @click="showInvitesModal = true" class="invites-btn" title="Pozivi">📧</button>
          <div class="select-wrapper">
            <label for="list">Izaberite listu:</label>
            <div class="select-container">
              <select v-model="selectedList" id="list" class="list-select">
                <option value="">-- Odaberite listu --</option>
                <option v-for="list in lists" :key="list.id" :value="list.id">
                  {{ list.name }}{{ (list.sharedWith && list.sharedWith.length > 0) || list.sharedFrom ? ' ⇄' : '' }}
                </option>
              </select>
              <button @click.stop="showMenu = !showMenu" class="menu-btn" title="Opcije liste">⋮</button>
              <div v-if="showMenu" ref="dropdownRef" class="menu-dropdown">
                <button @click="createListBtn" class="btn btn-primary">
                  ➕ Nova Lista
                </button>
                <button @click="editListNameBtn" class="btn btn-secondary" :disabled="!selectedList">
                  ✏️ Uredi Naziv Liste
                </button>
                <button @click="shareListBtn" class="btn btn-outline" :disabled="!selectedList">
                  📤 Deli Listu
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
    </div>

    <!-- ADD ITEM BUTTON -->
    <div v-if="selectedList" class="add-item-button">
      <button @click="showAddForm = true" class="btn btn-success">
        ➕ Dodaj Stavku
      </button>
    </div>

    <!-- ADD ITEM FORM -->
    <div v-if="showAddForm" class="add-item-section">
      <Items-Crud :currentList="currentList" :userNames="userNames" @item-added="showAddForm = false" @cancel="showAddForm = false" />
    </div>

    <!-- STAVKE -->
    <div v-if="filteredItems.length > 0" class="items-section">
      <div class="items-header">
        <h2>Stavke na listi</h2>
        <div class="sort-buttons-compact">
          <button @click="currentSort = 'asc'" :class="currentSort === 'asc' ? 'btn active' : 'btn'" title="Sortiraj od A do Z">A-Z</button>
          <button @click="currentSort = 'desc'" :class="currentSort === 'desc' ? 'btn active' : 'btn'" title="Sortiraj od Z do A">Z-A</button>
        </div>
      </div>
      <div class="items-grid">
        <div v-for="(singleItem, index) in filteredItems" :key="index" class="item-card card" :class="{ 'edit-mode': editingId === singleItem.id }">
          <!-- CHECKBOX AT TOP LEFT -->
          <div class="item-header" :class="{ 'no-border': editingId === singleItem.id }">
            <label v-if="editingId !== singleItem.id" class="checkbox-label">
              <input 
                type="checkbox" 
                :checked="singleItem.completed"
                @change="toggleCompleted(singleItem, $event)"
                class="item-checkbox"
              />
              <!-- <span v-if="singleItem.completed" class="item-status completed">Završeno</span>
              <span v-else class="item-status pending">Na listi</span> -->
            </label>
            <!-- ITEM CONTENT -->
            <!--EDIT MODE -->
            <div class="item-content">
              <template v-if="editingId === singleItem.id">
                <div class="edit-modal-header">
                  <h4>Izmene</h4>
                  <button @click="cancelEdit" class="close-btn" title="Zatvori">×</button>
                </div>
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
                  <button class="btn btn-error" @click.prevent="cancelEdit">Otkaži</button>
                  <button class="btn btn-primary" @click.prevent="saveEdit(singleItem.id)">Sačuvaj</button>
                </div>
              </template>
              <!-- VIEW MODE INLINE-->
              <template v-else>
                <div class="item-header-row">
                  <div class="item-name-section">
                    <h3 class="item-name" :class="{ completed: singleItem.completed }">{{ singleItem.name }}</h3>
                    <span class="item-quantity">{{ singleItem.amount }} {{ singleItem.unit }}</span>
                  </div>
                  <button @click="debugDelete(singleItem)" class="btn-icon delete-btn" title="Obriši">×</button>
                </div>
              </template>
            </div>
            <div class="item-actions">
            </div>
          </div>

          <!-- CONTENT BELOW HEADER LINE -->
          <div v-if="editingId !== singleItem.id && expandedItems.has(singleItem.id) && (singleItem.buyer || singleItem.info)" class="item-buyer-info" @click="toggleExpanded(singleItem.id)">
            <div class="left">
              <small v-if="singleItem.buyer" class="item-buyer">{{ singleItem.buyer }}</small>
              <button v-if="singleItem.info" @click.stop="showInfoModal = true; selectedInfo = singleItem.info" class="btn-info" title="Prikaži napomenu">i</button>
            </div>
            <div class="right">
              <button @click.stop="startEdit(singleItem)" class="btn-icon" title="Uredi">✏️</button>
              <!-- <button @click.stop="toggleExpanded(singleItem.id)" class="btn-icon" :title="expandedItems.has(singleItem.id) ? 'Prikaži sve' : 'Sakrij sve'">
                {{ expandedItems.has(singleItem.id) ? '▼' : '▲' }}
              </button> -->
            </div>
          </div>
          
          <!--VIEW MODE COLLAPSED-->
          <div v-if="editingId !== singleItem.id && !expandedItems.has(singleItem.id)" class="item-details" @click="toggleExpanded(singleItem.id)">
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
          <div v-if="editingId !== singleItem.id && !expandedItems.has(singleItem.id)" class="item-metadata" @click="toggleExpanded(singleItem.id)">
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
          <p v-html="confirmMessage"></p>
          <div v-if="confirmSharedUsers.length > 0" class="shared-users-list">
            <div v-for="userId in confirmSharedUsers" :key="userId" class="shared-user-item">
              <div class="user-name">{{ userNames[userId] || userId }}</div>
              <div class="user-email">{{ userId }}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="cancelConfirm" class="btn btn-error">Otkaži</button>
          <button @click="confirmAction" class="btn btn-primary">{{ confirmButtonText }}</button>
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
          <button @click="cancelEditName" class="btn btn-error">Otkaži</button>
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
          <button @click="cancelCopyName" class="btn btn-error">Otkaži</button>
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
          <button @click="cancelCreateList" class="btn btn-error">Otkaži</button>
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
          <p v-html="infoMessage"></p>
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

  <!-- SHARE LIST MODAL -->
  <div v-if="showShareModal" class="modal-overlay" @click="closeShareModal">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>Deli Listu</h3>
        <button @click="closeShareModal" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <div v-if="currentList" class="shared-users">
          <h4>Deljeni korisnici:</h4>
          
          <div v-if="!currentList.sharedWith || (currentList.sharedWith.length === 0 && (!currentList.shareSend || currentList.shareSend.length === 0))" class="no-shared-users">
            <p>Lista nije deljena još uvek</p>
          </div>

          <!-- Prikazane osobe sa kojima je lista deljiva -->
          <div v-for="(userId, index) in currentList.sharedWith" :key="index + '-' + (typeof userId === 'string' ? userId : userId.email)" class="user-item">
            <span v-if="typeof userId === 'string'">
              {{ getUserName(userId) }} ({{ userId }})
            </span>
            <span v-else>
              {{ userId.firstName }} {{ userId.lastName }}
            </span>
            <input type="checkbox" :checked="true" @change="toggleShare(userId)" />
          </div>
        </div>
        <button @click="sendInviteLink" class="btn btn-primary">Pošalji link liste</button>
      </div>
      <div class="modal-footer">
        <button @click="closeShareModal" class="btn btn-error">Otkaži</button>
        <button v-if="hasChanges" @click="saveShareChanges" class="btn btn-primary">Zapamti</button>
      </div>
    </div>
  </div>

  <!-- INVITES MODAL -->
  <div v-if="showInvitesModal" class="modal-overlay" @click="closeInvitesModal">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>Pozivi za liste</h3>
        <button @click="closeInvitesModal" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <div v-if="pendingInvites.length === 0" class="no-invites">
          <p>Nemate neobrađenih poziva.</p>
        </div>
        <div v-else v-for="invite in pendingInvites" :key="invite.code" class="invite-item">
          <p>Poziv za listu '{{ invite.listName }}' od {{ invite.ownerName }} ({{ invite.ownerEmail }})</p>
          <div class="invite-actions">
            <button @click="acceptInvite(invite.code)" class="btn btn-success">Prihvati</button>
            <button @click="declineInvite(invite.code)" class="btn btn-error">Odbij</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- LINK COPIED MODAL -->
  <div v-if="showLinkCopiedModal" class="modal-overlay" @click="showLinkCopiedModal = false">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>Link je kopiran!</h3>
        <button @click="showLinkCopiedModal = false" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <div class="link-copied-content">
          <p class="success-message">✅ Link je uspešno kopiran u clipboard!</p>
          <p class="instructions">Samo uradite PASTE poruke u nekoj od aplikacija koju koristite za dopisivanje (WhatsApp, Messenger, Email, itd.)</p>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="showLinkCopiedModal = false" class="btn btn-primary">Zatvori</button>
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
import { useLoaderStore } from "@/stores/loader-store";
import { doc, updateDoc, getDoc } from "@/firebase/firebase.js";
import { db } from "@/firebase/firebase.js";
import { query, collection, getDocs, where } from "firebase/firestore";

const market_list = useMarketListStore();
const { selectedList, items_fields, lists } = storeToRefs(market_list);
const auth = useAuthStore();
const loader = useLoaderStore();

// Editing state
const editingId = ref("");
const showAddForm = ref(false);
const expandedItems = ref(new Set());
const showMenu = ref(false);
const showInfoModal = ref(false);
const showShareModal = ref(false);
const showInvitesModal = ref(false);
const localSharedWith = ref([]);
const originalSharedWith = ref([]);
const userNames = ref({});
const currentList = computed(() => {
  if (market_list.selectedList) {
    return market_list.lists.find(list => list.id === market_list.selectedList) || null;
  }
  return null;
});
const pendingInvites = ref([]);

const hasChanges = computed(() => JSON.stringify(localSharedWith.value) !== JSON.stringify(originalSharedWith.value));

// Watch for changes in items_fields and set all items to expanded (hidden details)
watch(items_fields, () => {
  expandedItems.value.clear();
  items_fields.value.forEach(item => {
    expandedItems.value.add(item.id);
  });
});

// Watch for edit mode changes - close add form when edit starts
watch(editingId, (newEditingId) => {
  if (newEditingId) {
    showAddForm.value = false;
  }
});

// Watch for add form changes - close edit mode when form opens
watch(showAddForm, (newShowAddForm) => {
  if (newShowAddForm) {
    editingId.value = "";
  }
});
const selectedInfo = ref("");
const showConfirmModal = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
const confirmButtonText = ref("Potvrdi");
const confirmCallback = ref(null);
const confirmSuccessMessage = ref(null);
const confirmSharedUsers = ref([]);
const showEditNameModal = ref(false);
const newListName = ref("");
const showCopyNameModal = ref(false);
const copyListName = ref("");
const copySourceName = ref("");
const showCreateListModal = ref(false);
const createListName = ref("");
const showInfoMessageModal = ref(false);
const infoMessage = ref("");
const showLinkCopiedModal = ref(false);
const currentFilter = ref('all');
const currentSort = ref('asc'); // 'asc' (A-Z), 'desc' (Z-A)
const dropdownRef = ref(null);
const allBtn = ref(null);
const pendingBtn = ref(null);
const completedBtn = ref(null);

const closeMenu = () => {
  showMenu.value = false;
};

// Confirmation modal functions
const showConfirm = (title, message, buttonText = "Potvrdi", callback, successMessage = null) => {
  confirmTitle.value = title;
  confirmMessage.value = message;
  confirmButtonText.value = buttonText;
  confirmCallback.value = callback;
  confirmSuccessMessage.value = successMessage;
  showConfirmModal.value = true;
};

const confirmAction = () => {
  if (confirmCallback.value) {
    loader.startLoading();
    Promise.resolve(confirmCallback.value()).finally(() => {
      loader.stopLoading();
      // Show success message if provided
      if (confirmSuccessMessage.value) {
        showInfoMessage(confirmSuccessMessage.value);
      }
    });
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
  unit: "Kom",
  buyer: "",
  info: "",
});

// Filtered items
const filteredItems = computed(() => {
  let items = [];
  switch (currentFilter.value) {
    case 'pending':
      items = items_fields.value.filter(item => !item.completed);
      break;
    case 'completed':
      items = items_fields.value.filter(item => item.completed);
      break;
    default:
      items = items_fields.value;
  }
  
  // Apply sorting
  if (currentSort.value === 'asc') {
    items.sort((a, b) => a.name.localeCompare(b.name, 'sr-RS', { sensitivity: 'base' }));
  } else if (currentSort.value === 'desc') {
    items.sort((a, b) => b.name.localeCompare(a.name, 'sr-RS', { sensitivity: 'base' }));
  }
  
  return items;
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
  editForm.unit = item.unit || "Kom";
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
    loader.startLoading();
    await market_list.updateItem(itemId, payload);
    editingId.value = "";
  } catch (e) {
    console.error('Error saving edit', e);
    showInfoMessage('Greška pri čuvanju izmene');
  } finally {
    loader.stopLoading();
  }
};

onMounted(async () => {
  try {
    // Keep loader visible while loading initial data
    loader.startLoading();
    
    if (auth && typeof auth.waitForAuth === "function") {
      try {
        await auth.waitForAuth();
      } catch (e) {
        console.warn("waitForAuth failed", e);
      }
    }
    
    // Wait for lists to load
    await market_list.fetchLists();
    market_list.realTimeListeners();
    
    if (market_list.selectedList) {
      await market_list.fetchItemsFields();
    }
    document.addEventListener('click', handleClickOutside);
    
    // Fetch owner names for any shared lists
    const sharedFromEmails = market_list.lists
      .filter(list => list.sharedFrom)
      .map(list => list.sharedFrom)
      .filter((email, index, self) => self.indexOf(email) === index); // unique
    
    if (sharedFromEmails.length > 0) {
      await fetchUserNames(sharedFromEmails);
    }
  } finally {
    // Stop loader only after all data is loaded
    loader.stopLoading();
    loader.setInitializing(false);
  }
  
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

// Sharing functions
let ignoreNextWatcher = false;

const shareListBtn = async () => {
  if (!selectedList.value) {
    showInfoMessage("Izaberite listu za deljenje.");
    showMenu.value = false;
    return;
  }
  
  // Fetch fresh data from Firebase to ensure we have latest sharedWith
  try {
    const freshListDoc = await getDoc(doc(db, "market-list", auth.userData.email, "lists", selectedList.value));
    if (freshListDoc.exists()) {
      const freshData = freshListDoc.data();
      // Update the store's list data
      const listIndex = market_list.lists.findIndex(l => l.id === selectedList.value);
      if (listIndex !== -1) {
        market_list.lists[listIndex].sharedWith = freshData.sharedWith || [];
        market_list.lists[listIndex].shareSend = freshData.shareSend || [];
      }
    }
  } catch (err) {
    console.error('Error refreshing list data:', err);
  }
  
  // Check if user is the owner (not shared)
  if (currentList.value && currentList.value.sharedFrom) {
    // If no owner name, try to fetch it
    let ownerDisplay = currentList.value.ownerName || 'vlasnika';
    if (!currentList.value.ownerName && currentList.value.sharedFrom) {
      // Fetch owner info synchronously if possible, but since it's async, show with fallback
      market_list.getOwnerInfo(currentList.value.sharedFrom).then(ownerInfo => {
        ownerDisplay = `${ownerInfo.firstName} ${ownerInfo.lastName}`;
        const emailPart = currentList.value.ownerEmail ? `<br>(<strong>${currentList.value.ownerEmail}</strong>)` : ` (<strong>${currentList.value.sharedFrom}</strong>)`;
        showInfoMessage(`Nemate privilegiju da delite ovu listu jer niste njen vlasnik. Lista "${currentList.value.name}" vam je dodeljena od strane<br><br><strong>${ownerDisplay}</strong><br>${emailPart}<br><br>Samo vlasnik može deliti listu sa drugim korisnicima.`);
      });
    } else {
      const emailPart = currentList.value.ownerEmail ? `<br>(<strong>${currentList.value.ownerEmail}</strong>)` : ` (<strong>${currentList.value.sharedFrom}</strong>)`;
      showInfoMessage(`Nemate privilegiju da delite ovu listu jer niste njen vlasnik. Lista "${currentList.value.name}" vam je dodeljena od strane<br><strong>${ownerDisplay}</strong><br>${emailPart}</br><br>Samo vlasnik može deliti listu sa drugim korisnicima.`);
    }
    showMenu.value = false;
    return;
  }
  
  try {
    ignoreNextWatcher = true; // Prevent watcher from firing during modal opening
    userNames.value = {}; // Clear previous names
    localSharedWith.value = [...(currentList.value?.sharedWith || [])];
    originalSharedWith.value = [...(currentList.value?.sharedWith || [])];
    
    // Only fetch user names if they are strings (old format)
    // If they are objects (new format), names are already included
    const userIdsToFetch = [];
    for (const item of localSharedWith.value) {
      if (typeof item === 'string') {
        // Old format: just email string
        userIdsToFetch.push(item);
      }
      // New format (object): names already included, no need to fetch
    }
    
    // If this is a shared list (received by current user), also fetch owner's name
    if (currentList.value?.sharedFrom && !userIdsToFetch.includes(currentList.value.sharedFrom)) {
      userIdsToFetch.push(currentList.value.sharedFrom);
    }
    
    // Only fetch if there are string IDs to fetch
    if (userIdsToFetch.length > 0) {
      await fetchUserNames(userIdsToFetch);
    }
    
    // Only open the modal AFTER everything is ready
    showShareModal.value = true;
    await nextTick();
  } catch (err) {
    console.error('Error in shareListBtn:', err);
    console.error('Error stack:', err.stack);
    showInfoMessage('Greška pri otvaranju "Deli listu" modala: ' + err.message);
  }
  showMenu.value = false;
};

const closeShareModal = () => {
  showShareModal.value = false;
  localSharedWith.value = [];
  originalSharedWith.value = [];
};

const sendInviteLink = async () => {
  console.log('sendInviteLink called', currentList.value);
  if (!currentList.value) {
    showInfoMessage("Nema izabrane liste.");
    return;
  }
  try {
    const result = await market_list.generateInviteLink(currentList.value.id);
    console.log('Generated link:', result);
    showShareModal.value = false;
    showLinkCopiedModal.value = true;
  } catch (error) {
    console.error('Error:', error);
    showInfoMessage("Greška pri generisanju linka: " + error.message);
  }
};

const toggleShare = (userId) => {
  // Handle both string (old format) and object (new format)
  if (typeof userId === 'string') {
    localSharedWith.value = localSharedWith.value.filter(id => 
      typeof id === 'string' ? id !== userId : id.email !== userId
    );
  } else {
    // Object format - filter by email
    localSharedWith.value = localSharedWith.value.filter(id => 
      typeof id === 'string' ? id !== userId.email : id.email !== userId.email
    );
  }
};

const saveShareChanges = async () => {
  // Handle both string (old format) and object (new format) for removed users
  const removedUsers = currentList.value.sharedWith.filter(oldId => {
    const oldEmail = typeof oldId === 'string' ? oldId : oldId.email;
    return !localSharedWith.value.some(newId => {
      const newEmail = typeof newId === 'string' ? newId : newId.email;
      return newEmail === oldEmail;
    });
  });
  
  for (const userId of removedUsers) {
    // Extract email for removeUserAccess
    const userEmail = typeof userId === 'string' ? userId : userId.email;
    await market_list.removeUserAccess(currentList.value.id, userEmail);
  }
  const auth = useAuthStore();
  const listRef = doc(db, "market-list", auth.userData.email, "lists", currentList.value.id);
  await updateDoc(listRef, { sharedWith: localSharedWith.value });
  closeShareModal();
};

const getUserName = (userId) => {
  return userNames.value[userId] || `Korisnik ${userId}`;
};

const closeInvitesModal = () => {
  showInvitesModal.value = false;
};

const acceptInvite = async (code) => {
  try {
    await market_list.acceptInvite(code);
    showInfo("Poziv prihvaćen!");
    closeInvitesModal();
  } catch (error) {
    showInfo("Greška: " + error.message);
  }
};

const declineInvite = async (code) => {
  try {
    await market_list.declineInvite(code);
    showInfo("Poziv odbijen.");
    closeInvitesModal();
  } catch (error) {
    showInfo("Greška: " + error.message);
  }
};

const convertUserIdsToEmails = async (userIds) => {
  if (!userIds || userIds.length === 0) {
    return [];
  }
  
  const emails = [];
  for (const userId of userIds) {
    // If already an email, keep it
    if (userId.includes('@')) {
      emails.push(userId);
      continue;
    }
    
    // Otherwise, query by UID to get email
    try {
      const q = query(collection(db, "users"), where("uid", "==", userId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const userEmail = snapshot.docs[0].id;
        emails.push(userEmail);
      } else {
        emails.push(userId); // Fallback to UID if not found
      }
    } catch (e) {
      console.error('Error converting UID to email for', userId, ':', e);
      emails.push(userId); // Fallback to UID
    }
  }
  return emails;
};

const fetchUserNames = async (userIds) => {
  if (!userIds || userIds.length === 0) {
    return;
  }
  
  const promises = userIds.map(async (id) => {
    if (!userNames.value[id]) {
      try {
        let userData = null;
        
        // First, try to treat it as an email (if it contains @)
        if (id.includes('@')) {
          // Try 1: Check if email is the doc ID
          let userDoc = await getDoc(doc(db, "users", id));
          console.log(`Fetching user doc for ${id}:`, userDoc.exists());
          if (userDoc.exists()) {
            userData = userDoc.data();
            console.log(`Found user data for ${id}:`, userData);
          }
          
          // Try 2: Query by email field
          if (!userData) {
            const q = query(collection(db, "users"), where("email", "==", id));
            const snapshot = await getDocs(q);
            console.log(`Query email field for ${id}:`, !snapshot.empty);
            if (!snapshot.empty) {
              userData = snapshot.docs[0].data();
              console.log(`Found user by email query ${id}:`, userData);
            }
          }
        }
        
        // If not found as email or not an email, try as UID
        if (!userData && !id.includes('@')) {
          const q = query(collection(db, "users"), where("uid", "==", id));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            userData = snapshot.docs[0].data();
          }
        }
        
        if (userData && userData.firstName && userData.lastName) {
          userNames.value[id] = `${userData.firstName} ${userData.lastName}`;
          console.log(`Set username for ${id}:`, userNames.value[id]);
        } else {
          userNames.value[id] = id; // Show the ID/email itself if not found
          console.log(`No user data found for ${id}, using email as fallback`);
        }
      } catch (e) {
        console.error('Error fetching user name for', id, ':', e);
        userNames.value[id] = id;
      }
    }
  });
  await Promise.all(promises);
};

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

watch(
  () => market_list.selectedList,
  async () => {
    currentFilter.value = 'all';
    if (market_list.selectedList !== "") {
      market_list.fetchItemsFields();
      
      // Fetch user names for shared users in the newly selected list
      const list = market_list.lists.find(l => l.id === market_list.selectedList);
      console.log('List selected:', list);
      if (list) {
        const userIdsToFetch = [...(list.sharedWith || [])];
        // Also add owner if this is a shared list
        if (list.sharedFrom && !userIdsToFetch.includes(list.sharedFrom)) {
          userIdsToFetch.push(list.sharedFrom);
        }
        console.log('User IDs to fetch:', userIdsToFetch);
        if (userIdsToFetch.length > 0) {
          console.log('Calling fetchUserNames with:', userIdsToFetch);
          await fetchUserNames(userIdsToFetch);
          console.log('fetchUserNames completed, userNames now:', userNames.value);
        }
      }
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
// Update localSharedWith when currentList.sharedWith changes
// Watcher for real-time updates to sharedWith (but not when opening modal)
watch(() => currentList.value?.sharedWith, async (newSharedWith) => {
  console.log('sharedWith changed:', newSharedWith, 'showShareModal:', showShareModal.value);
  if (ignoreNextWatcher) {
    ignoreNextWatcher = false;
    return;
  }
  if (newSharedWith && showShareModal.value) {
    console.log('Updating modal with new sharedWith data');
    localSharedWith.value = [...newSharedWith];
    originalSharedWith.value = [...newSharedWith];
    await fetchUserNames(localSharedWith.value);
    await nextTick();
    console.log('Modal updated');
  }
}, { deep: true });

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

const deleteListBtn = async () => {
  if (!market_list.selectedList) {
    showInfoMessage('Izaberite listu za brisanje');
    return;
  }
  const current = market_list.lists.find(l => l.id === market_list.selectedList);
  const isShared = current && current.sharedFrom;
  const title = isShared ? 'Uklanjanje pristupa listi' : 'Brisanje liste';
  const buttonText = isShared ? 'Ukloni pristup' : 'Obriši';
  
  if (isShared) {
    let ownerDisplay = current.ownerName || 'vlasnika';
    if (!current.ownerName && current.sharedFrom) {
      // Fetch owner info
      try {
        const ownerInfo = await market_list.getOwnerInfo(current.sharedFrom);
        ownerDisplay = `${ownerInfo.firstName} ${ownerInfo.lastName}`;
      } catch (error) {
        console.warn('Failed to fetch owner info:', error);
      }
    }
    const emailPart = current.ownerEmail ? `<br>(<strong>${current.ownerEmail}</strong>)` : ` (<strong>${current.sharedFrom}</strong>)`;
    const message = `Ova lista vam je dodeljena od strane<br><strong>${ownerDisplay}</strong>${emailPart}<br><br>Pošto niste vlasnik liste, možete samo da obrišete vaš pristup ovoj listi - originalna lista i sve stavke će ostati kod vlasnika.<br><br>Više nećete moći pristupiti ovoj listi sve dok vam vlasnik ponovo ne pošalje poziv za deljenje.<br><br>Da li želite da uklonite pristup listi <br>"<strong>${current ? current.name : ''}</strong>"?`;
    confirmSharedUsers.value = [];
    showConfirm(
      title,
      message,
      buttonText,
      async () => {
        const result = await market_list.deleteList(null, true);
        if (result.success) {
          showInfoMessage(result.message);
        } else {
          showInfoMessage(result.message);
        }
      }
    );
  } else {
    // Ako je vlasnik, prikaži sa kime je lista deljiva
    confirmSharedUsers.value = [];
    let messageWithUsers = `Da li ste sigurni da želite da obrišete listu "<strong>${current ? current.name : ''}</strong>" i sve stavke u njoj?`;
    
    if (current && current.sharedWith && current.sharedWith.length > 0) {
      messageWithUsers += `<br><br><strong>Ova lista je podeljena sa:</strong>`;
      // Extract user IDs from sharedWith (handle both string and object formats)
      const userIds = current.sharedWith.map(item => {
        // Handle both string (old format with email) and object (new format)
        return typeof item === 'string' ? item : (item.email || item);
      });
      // Convert UIDs to emails if needed
      const userEmails = await convertUserIdsToEmails(userIds);
      // Fetch user names if not already fetched
      await fetchUserNames(userEmails);
      confirmSharedUsers.value = userEmails;
    }
    
    showConfirm(
      title,
      messageWithUsers,
      buttonText,
      async () => {
        const result = await market_list.deleteList(null, true);
        if (result.success) {
          showInfoMessage(result.message);
        } else {
          showInfoMessage(result.message);
        }
      }
    );
  }
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
    `Ukupno završenih stavki za brisanje: ${completedItems.length}`,
    'Obriši',
    async () => {
      for (const item of completedItems) {
        await market_list.deleteItem(item, true);
      }
    },
    `Ukupno obrisanih stavki sa liste: ${completedItems.length}`
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
    },
    `Artikal "${item.name}" je obrisan sa liste`
  );
};

const editItem = (itemId) => {
  const it = market_list.items_fields.find(i => i.id === itemId);
  if (it) startEdit(it);
};

const toggleCompleted = async (item, ev) => {
  const checked = ev.target.checked;
  try {
    loader.startLoading();
    await market_list.updateItemCompletion(item.id, checked);
  } catch (e) {
    console.error('Error toggling completion', e);
    showInfoMessage('Greška pri promeni statusa itema');
  } finally {
    loader.stopLoading();
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

    h1 {
      color: $text-primary;
      font-size: $fs-xl;
      font-weight: $fw-bold;
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: $space-md;
    }

    .invites-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: $space-xs;
      border-radius: $radius-sm;

      &:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
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

  .items-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $space-lg;
    gap: $space-md;

    h2 {
      margin: 0;
      color: $text-primary;
      font-size: $fs-lg;
      flex: 1;

      @include md {
        font-size: $fs-xl;
      }
    }

    .sort-buttons-compact {
      display: flex;
      gap: $space-sm;

      .btn {
        padding: $space-sm $space-xl;
        font-size: $fs-sm;
        border: 1px solid $border-color;
        white-space: nowrap;

        &.active {
          background-color: color.adjust($primary, $lightness: -10%) !important;
          border: 2px solid color.adjust($primary, $lightness: -10%) !important;
          color: white !important;
        }
      }
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
  padding: $space-lg;

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

    &.delete-btn {
      width: 36px;
      height: 36px;
      font-size: 24px;
      margin-left: auto;
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .item-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: $space-sm;
    padding-bottom: $space-sm;
    border-bottom: 2px solid $border-color;

    &.no-border {
      border-bottom: none;
      padding-bottom: 0;
      margin-bottom: 0;
    }

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
    }
  }

  .item-content {
    flex: 1;

    .item-name {
      color: $accent-red;
      margin-bottom: $space-xs;
      word-break: break-word;
      padding-right: 5px;
      line-height: 18px;
      font-weight: $fw-semibold;

      &.completed {
        text-decoration: line-through;
        color: $text-muted;
      }
    }

    .item-name-section {
      margin-top: 2px;
    }

    .item-header-row {
      display: flex;
      align-items: center;
      padding-left: 10px;
      gap: $space-sm;

      .item-quantity {
        color: $text-muted;
        font-size: $fs-sm;
        font-weight: $fw-regular;
      }
    }

    .form-group {
      label {
        color: $text-muted;
      }
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
    margin-right: $space-lg;
  }

  .item-buyer-info {
    display: flex;
    gap: $space-sm;
    align-items: center;
    justify-content: space-between;
    margin-top: $space-xs;
    cursor: pointer;
    .right {
      .btn-icon:first-of-type {
        margin-top: 4px;
        margin-right: 8px;
      }
    }
  }

  .btn-info {
    @include reset-button;
    color: $text-secondary;
    font-size: $fs-sm;
    border: 1px solid $text-secondary;
    border-radius: 50%;
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: $space-xs;
    margin-right: $space-sm;
    cursor: pointer;
    transition: all $transition-fast;
    line-height: 20px;

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
    cursor: pointer;

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

  .item-metadata {
    border-top: 1px solid $border-color;
    padding-top: $space-md;
    display: grid;
    grid-template-columns: 1fr;
    gap: $space-sm;
    cursor: pointer;

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

// ======== EDIT MODAL HEADER ========
.edit-modal-header {
  padding: $space-md $space-lg;
  border-bottom: 2px solid $border-color;
  margin-bottom: $space-lg;
  background-color: rgba($secondary, 0.05);
  border-radius: $radius-md $radius-md 0 0;

  h4 {
    margin: 0;
    color: $secondary;
    font-size: $fs-lg;
    font-weight: $fw-semibold;
  }
}

// ======== EDIT MODE STYLING ========
.item-card.edit-mode {
  background: linear-gradient(135deg, $bg-surface 0%, rgba($secondary, 0.05) 100%);
  border-left: 4px solid $secondary;
  padding: $space-lg;
  border-radius: $radius-md;
  box-shadow: $shadow-md;
  transition: none;
  
  .edit-modal-header {
    padding: $space-md $space-lg;
    border-bottom: 2px solid $border-color;
    margin: (-$space-lg) (-$space-lg) $space-lg (-$space-lg);
    border-radius: $radius-md $radius-md 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h4 {
      margin: 0;
      color: $secondary;
      font-size: $fs-lg;
      font-weight: $fw-semibold;
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
      margin: 0 0 $space-md 0;
      color: $text-primary;
      line-height: 1.5;
      text-align: center;

      strong {
        font-weight: bold;
      }
    }

    .shared-users-list {
      margin-top: $space-lg;
      padding: $space-md;
      background-color: $bg-primary;
      border-radius: $radius-md;
      border-left: 4px solid $primary;

      .shared-user-item {
        padding: $space-sm 0;
        border-bottom: 1px solid $border-color;

        &:last-child {
          border-bottom: none;
        }

        .user-name {
          font-weight: $fw-medium;
          color: $text-primary;
          margin-bottom: $space-xs;
        }

        .user-email {
          font-size: $fs-sm;
          color: $text-secondary;
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

      strong {
        font-weight: bold;
      }
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

  .sort-buttons {
    display: flex;
    gap: $space-md;
    justify-content: center;
    margin-bottom: $space-lg;

    @include tablet {
      margin-bottom: 0;
      flex: 2;
    }

    .btn {
      flex: 1;
      border: 1px solid $border-color;
      font-size: $fs-sm;

      &.active {
        background-color: color.adjust($primary, $lightness: -10%) !important;
        border: 2px solid color.adjust($primary, $lightness: -10%) !important;
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

// Modal styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: $radius-lg;
  box-shadow: $shadow-xl;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $space-lg;
    border-bottom: 1px solid $border-color;

    h3 {
      margin: 0;
      color: $text-primary;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
  }

  .modal-body {
    padding: $space-lg;

    .shared-users {
      margin-bottom: $space-lg;

      h4 {
        margin-bottom: $space-md;
        color: $text-primary;
      }

      .user-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $space-sm;
        border-bottom: 1px solid $border-color;
      }

      .pending-invite-item {
        padding: $space-md;
        background-color: #fff3e0;
        border: 1px solid #ffb74d;
        border-radius: $radius-md;
        margin-bottom: $space-md;

        .invite-info {
          display: flex;
          flex-direction: column;
          gap: $space-xs;
          font-size: $fs-sm;

          .invite-status {
            font-weight: $fw-medium;
            color: #ff9800;
          }

          .invite-code {
            color: $text-secondary;
            word-break: break-all;
            font-family: monospace;
          }

          .invite-sent,
          .invite-expires {
            color: $text-secondary;
          }
        }
      }
    }

    .no-invites {
      text-align: center;
      color: $text-secondary;
    }

    .invite-item {
      padding: $space-md;
      border: 1px solid $border-color;
      border-radius: $radius-md;
      margin-bottom: $space-md;

      .invite-actions {
        display: flex;
        gap: $space-sm;
        margin-top: $space-sm;
      }
    }
  }

  .modal-footer {
    padding: $space-lg;
    border-top: 1px solid $border-color;
    display: flex;
    justify-content: flex-end;
    gap: $space-md;
  }

  .link-copied-content {
    text-align: center;
    padding: $space-lg;

    .success-message {
      font-size: 1.3rem;
      color: #4caf50;
      font-weight: bold;
      margin-bottom: $space-lg;
    }

    .instructions {
      color: $text-secondary;
      font-size: 1rem;
      line-height: 1.6;
      margin: 0;
    }
  }
}
</style>