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
        <!-- If list is shared, show dropdown; otherwise show input -->
        <select 
          v-if="isListShared && buyersList.length > 0" 
          v-model="buyerInput" 
          id="buyer"
          class="buyer-select"
        >
          <option v-for="buyer in buyersList" :key="buyer.value" :value="buyer.value">
            {{ buyer.label }}
          </option>
        </select>
        <input 
          v-else
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
        <button type="button" @click="emit('cancel')" class="btn btn-error">
          Otkaži
        </button>
        <button type="submit" class="btn btn-primary">
          ➕ Dodaj na Listu
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
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useMarketListStore } from "@/stores/market-list-store.js";
import { useAuthStore } from "@/stores/auth-store";
import { doc, getDoc, collection, query, getDocs, where } from "@/firebase/firebase.js";
import { db } from "@/firebase/firebase.js";

const emit = defineEmits(['item-added', 'cancel']);
const props = defineProps({
  currentList: {
    type: Object,
    default: null
  },
  userNames: {
    type: Object,
    default: () => ({})
  }
});

const nameInput = ref("");
const amountInput = ref("");
const unitSelect = ref("Kom");
const infoInput = ref("");
const buyerInput = ref("");
const defaultBuyer = ref("");

// Local copy of userNames to avoid modifying props
const localUserNames = ref({});

// Modal state
const showInfoMessageModal = ref(false);
const infoMessage = ref("");

import { UNITS } from "@/constants/units.js";

const market_list = useMarketListStore();
const authStore = useAuthStore();

// Determine if current user is the owner of the list
const isListOwner = computed(() => {
  return !props.currentList?.sharedFrom;
});

// Computed property to get list of buyers
const buyersList = computed(() => {
  // Force re-computation when userNames changes
  const _ = userNamesVersion.value;
  
  const buyers = [];
  const currentUserName = `${authStore.userData.firstName} ${authStore.userData.lastName}`.trim();
  
  if (isListOwner.value) {
    // Current user is the owner
    // Add owner (self)
    buyers.push({
      label: currentUserName || authStore.userData.email,
      value: currentUserName || authStore.userData.email
    });
    
    // Add all shared users with their names
    if (props.currentList?.sharedWith && props.currentList.sharedWith.length > 0) {
      for (const sharedUser of props.currentList.sharedWith) {
        let userName = '';
        let userValue = '';
        
        // Handle both formats: string (old) and object (new)
        if (typeof sharedUser === 'string') {
          // Old format: just email
          userValue = sharedUser;
          // Try to get name from localUserNames (fetched from Firestore)
          userName = localUserNames.value[sharedUser];
          if (!userName) {
            // Fallback to email if name not available
            userName = sharedUser;
            userValue = sharedUser;
          }
        } else {
          // New format: {email, firstName, lastName}
          userValue = sharedUser.firstName && sharedUser.lastName 
            ? `${sharedUser.firstName} ${sharedUser.lastName}`
            : sharedUser.email;
          userName = userValue;
        }
        
        buyers.push({
          label: userName,
          value: userValue
        });
      }
    }
    
    // Set default to owner
    defaultBuyer.value = buyers[0]?.value || "";
  } else {
    // Current user received this list as shared
    // Add owner of the list
    let ownerName = null;
    
    console.log('Building dropdown for shared list recipient');
    console.log('currentList data:', props.currentList);
    console.log('ownerFirstName:', props.currentList?.ownerFirstName);
    console.log('ownerLastName:', props.currentList?.ownerLastName);
    console.log('ownerName:', props.currentList?.ownerName);
    
    // Try to get owner name from ownerFirstName/ownerLastName fields first (new format)
    if (props.currentList?.ownerFirstName && props.currentList?.ownerLastName) {
      ownerName = `${props.currentList.ownerFirstName} ${props.currentList.ownerLastName}`;
      console.log('Using ownerFirstName+ownerLastName:', ownerName);
    } 
    // Fallback to ownerName field (for backward compatibility with old data)
    else if (props.currentList?.ownerName) {
      ownerName = props.currentList.ownerName;
      console.log('Using ownerName:', ownerName);
    } 
    // Try to get from localUserNames if it was fetched from Firebase
    else if (props.currentList?.sharedFrom && localUserNames.value[props.currentList.sharedFrom]) {
      ownerName = localUserNames.value[props.currentList.sharedFrom];
      console.log('Using localUserNames lookup:', ownerName);
    }
    // Last fallback: look up by sharedFrom email in userNames
    else if (props.currentList?.sharedFrom) {
      ownerName = props.userNames[props.currentList.sharedFrom];
      console.log('Using userNames lookup:', ownerName);
    }
    
    if (ownerName) {
      buyers.push({
        label: ownerName,
        value: ownerName
      });
    } else if (props.currentList?.ownerEmail) {
      buyers.push({
        label: props.currentList.ownerEmail,
        value: props.currentList.ownerEmail
      });
    } else if (props.currentList?.sharedFrom) {
      buyers.push({
        label: props.currentList.sharedFrom,
        value: props.currentList.sharedFrom
      });
    }
    
    // Add all other shared users (people with whom the owner shared this list)
    if (props.currentList?.sharedWith && props.currentList.sharedWith.length > 0) {
      for (const sharedUser of props.currentList.sharedWith) {
        // Skip current user (don't add twice)
        let userEmail = '';
        if (typeof sharedUser === 'string') {
          userEmail = sharedUser;
        } else {
          userEmail = sharedUser.email;
        }
        
        if (userEmail === authStore.userData.email) {
          continue; // Skip self, will be added below
        }
        
        let userName = '';
        let userValue = '';
        
        // Handle both formats: string (old) and object (new)
        if (typeof sharedUser === 'string') {
          // Old format: just email
          userValue = sharedUser;
          // Try to get name from localUserNames
          userName = localUserNames.value[sharedUser];
          if (!userName) {
            userName = sharedUser;
          }
        } else {
          // New format: {email, firstName, lastName}
          userValue = sharedUser.firstName && sharedUser.lastName 
            ? `${sharedUser.firstName} ${sharedUser.lastName}`
            : sharedUser.email;
          userName = userValue;
        }
        
        buyers.push({
          label: userName,
          value: userValue
        });
      }
    }
    
    // Add current user (self)
    buyers.push({
      label: currentUserName || authStore.userData.email,
      value: currentUserName || authStore.userData.email
    });
    
    // Set default to current user
    defaultBuyer.value = buyers[buyers.length - 1]?.value || buyers[0]?.value || "";
  }
  
  return buyers;
});

const isListShared = computed(() => {
  return !isListOwner.value || (props.currentList?.sharedWith && props.currentList.sharedWith.length > 0);
});

// Track when userNames updates to force re-computation
const userNamesVersion = ref(0);

// Fallback function to fetch user names if not available
const fetchMissingUserNames = async (emails) => {
  console.log('fetchMissingUserNames called with:', emails);
  console.log('Current localUserNames:', localUserNames.value);
  
  if (!emails || emails.length === 0) return;
  
  // First, extract names from objects if they have firstName/lastName
  const itemsToProcess = [];
  for (const item of emails) {
    if (typeof item === 'string') {
      // Old format: just email string
      itemsToProcess.push(item);
    } else if (item.firstName && item.lastName) {
      // New format: object with name already included
      const fullName = `${item.firstName} ${item.lastName}`;
      localUserNames.value[item.email] = fullName;
      console.log(`Set name for ${item.email} from object:`, fullName);
    }
  }
  
  // Only fetch from Firebase for missing string emails
  const missingEmails = itemsToProcess.filter(email => !localUserNames.value[email]);
  console.log('Missing emails to fetch:', missingEmails);
  if (missingEmails.length === 0) return;
  
  // Try to fetch from Firebase for missing names
  for (const email of missingEmails) {
    // Try Firebase
    try {
      console.log('Trying to fetch user data for:', email);
      let found = false;
      
      // Try 1: Check if email is the doc ID in /users
      let userDoc = await getDoc(doc(db, "users", email));
      console.log(`User doc /users/${email} exists:`, userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log(`User data for ${email}:`, userData);
        if (userData.firstName && userData.lastName) {
          localUserNames.value[email] = `${userData.firstName} ${userData.lastName}`;
          console.log(`Set name for ${email}:`, localUserNames.value[email]);
          found = true;
        }
      }
      
      // Try 2: Query by email field in /users
      if (!found) {
        console.log(`Trying query by email field in /users for ${email}`);
        const q = query(collection(db, "users"), where("email", "==", email));
        const snapshot = await getDocs(q);
        console.log(`Query result for ${email}:`, !snapshot.empty);
        if (!snapshot.empty) {
          userDoc = snapshot.docs[0];
          const userData = userDoc.data();
          if (userData.firstName && userData.lastName) {
            localUserNames.value[email] = `${userData.firstName} ${userData.lastName}`;
            console.log(`Set name for ${email} via email query:`, localUserNames.value[email]);
            found = true;
          }
        }
      }
      
      // Try 3: Check /userProfiles collection
      if (!found) {
        console.log(`Trying /userProfiles/${email}`);
        const profileDoc = await getDoc(doc(db, "userProfiles", email));
        console.log(`Profile doc for ${email} exists:`, profileDoc.exists());
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          console.log(`Profile data for ${email}:`, profileData);
          if (profileData.firstName && profileData.lastName) {
            localUserNames.value[email] = `${profileData.firstName} ${profileData.lastName}`;
            console.log(`Set name for ${email} from userProfiles:`, localUserNames.value[email]);
            found = true;
          }
        }
      }
      
      // Try 4: List all collections to debug
      if (!found) {
        console.log('User not found, listing all users in /users:');
        const allUsersSnap = await getDocs(collection(db, "users"));
        console.log(`Total users in /users: ${allUsersSnap.size}`);
        allUsersSnap.forEach(doc => {
          const data = doc.data();
          console.log(`  Doc ID: ${doc.id}, email: ${data.email}, firstName: ${data.firstName}, lastName: ${data.lastName}`);
        });
      }
      
      if (!found) {
        console.log(`No user document found for ${email}`);
      }
    } catch (e) {
      console.error('Error fetching user for', email, ':', e);
    }
  }
  console.log('Final localUserNames:', localUserNames.value);
};

// Watch for changes in userNames prop to sync with local copy
watch(() => props.userNames, (newUserNames) => {
  localUserNames.value = { ...newUserNames };
  userNamesVersion.value++;
}, { deep: true, immediate: true });

// Watch for changes in currentList.sharedWith to trigger re-computation
watch(() => props.currentList?.sharedWith, () => {
  userNamesVersion.value++;
}, { deep: true });

// Watch for changes in owner info to trigger dropdown re-computation
watch(() => ({
  ownerFirstName: props.currentList?.ownerFirstName,
  ownerLastName: props.currentList?.ownerLastName,
  ownerName: props.currentList?.ownerName
}), () => {
  userNamesVersion.value++;
}, { deep: true });

// Watch for changes in buyersList and set default value
watch([buyersList, userNamesVersion], ([newList]) => {
  if (newList.length > 0 && !buyerInput.value) {
    buyerInput.value = defaultBuyer.value;
  }
}, { immediate: true });

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
  unitSelect.value = "Kom";
  infoInput.value = "";
  buyerInput.value = "";
};

// Mount hook to fetch missing user names and sharedWith from owner
onMounted(async () => {
  console.log('Items-Crud mounted with currentList:', props.currentList);
  console.log('Items-Crud mounted with userNames prop:', props.userNames);
  
  // Initialize local copy of userNames
  localUserNames.value = { ...props.userNames };
  
  // If this is a shared list, fetch sharedWith from the owner's list
  if (props.currentList?.sharedFrom) {
    console.log('Shared list detected with sharedFrom:', props.currentList.sharedFrom);
    try {
      // Fetch the owner's list to get the current sharedWith array
      const ownerListRef = doc(db, "market-list", props.currentList.sharedFrom, "lists", props.currentList.id);
      const ownerListDoc = await getDoc(ownerListRef);
      if (ownerListDoc.exists()) {
        const ownerListData = ownerListDoc.data();
        console.log('Fetched owner list sharedWith:', ownerListData.sharedWith);
        
        // Update the local currentList object with the owner's sharedWith
        // This ensures we always have the latest list of people with access
        if (ownerListData.sharedWith && ownerListData.sharedWith.length > 0) {
          props.currentList.sharedWith = ownerListData.sharedWith;
          console.log('Updated currentList.sharedWith from owner');
        }
        
        // Also fetch user names for all shared users
        await fetchMissingUserNames(ownerListData.sharedWith || []);
      }
      
      // Also fetch owner's full name if not already set
      if (!props.currentList?.ownerFirstName && props.currentList?.sharedFrom) {
        const userDocRef = doc(db, "users", props.currentList.sharedFrom);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('Fetched owner info:', userData);
          if (userData.firstName && userData.lastName) {
            props.currentList.ownerFirstName = userData.firstName;
            props.currentList.ownerLastName = userData.lastName;
            localUserNames.value[props.currentList.sharedFrom] = `${userData.firstName} ${userData.lastName}`;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching sharedWith from owner:', err);
    }
  }
  
  // Also process owner name if it exists
  if (props.currentList?.sharedFrom && props.currentList?.ownerFirstName) {
    localUserNames.value[props.currentList.sharedFrom] = `${props.currentList.ownerFirstName} ${props.currentList.ownerLastName}`;
    console.log('Set owner name from props:', localUserNames.value[props.currentList.sharedFrom]);
  }
  
  // For owned lists, fetch missing names for sharedWith
  if (props.currentList?.sharedWith && props.currentList.sharedWith.length > 0) {
    console.log('Fetching missing user names for:', props.currentList.sharedWith);
    await fetchMissingUserNames(props.currentList.sharedWith);
  }
  
  userNamesVersion.value++;
  console.log('After mount, localUserNames:', localUserNames.value);
});
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
    padding: $space-md $space-lg;
    border-bottom: 2px solid $border-color;
    margin: (-$space-lg) (-$space-lg) $space-lg (-$space-lg);
    border-radius: $radius-md $radius-md 0 0;
    background-color: rgba(245, 159, 0, 0.05);

    h3 {
      color: $secondary;
      margin: 0;
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