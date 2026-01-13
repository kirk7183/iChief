<template>
  <div class="home-container">
    <!-- HEADER -->
    <div class="home-header card">
      <div class="header-content">
        <h1>🍳 iChief</h1>
        <div class="auth-section">
          <div v-if="userData.isLoggedIn" class="user-info">
            <div class="user-name-section">
              <span class="user-name">{{ userData.firstName }} {{ userData.lastName }}</span>
              <button @click="openEditProfileModal()" class="edit-icon-btn" title="Izmeni profil">
                ✏️
              </button>
            </div>
            <span class="user-email">{{ userData.email }}</span>
            <button @click="handleLogOut()" class="btn btn-secondary">
              🚪 Odjavi se
            </button>
          </div>
          <div v-else class="auth-buttons">
            <button @click="toLoginPage()" class="btn btn-primary">
              🔐 Prijavi se
            </button>
            <button @click="toRegisterPage()" class="btn btn-outline">
              📝 Registruj se
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="home-content">
      <div class="welcome-section card">
        <h2>Dobrodošli u iChief!</h2>
        <p>Vaša aplikacija za upravljanje kupovnim listama i kulinarskim receptima.</p>

        <div v-if="userData.isLoggedIn" class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🛒</div>
            <h3>Kupovne Liste</h3>
            <p>Kreirajte i upravljajte svojim kupovnim listama</p>
            <router-link to="/market-list" class="btn btn-primary">
              Idi na Liste
            </router-link>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h3>Kulinarska Knjiga</h3>
            <p>Čuvajte i organizujte svoje recepte</p>
            <button class="btn btn-outline" disabled>Uskoro</button>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🏠</div>
            <h3>Hrana u Frižideru</h3>
            <p>Pratite šta imate u frižideru</p>
            <button class="btn btn-outline" disabled>Uskoro</button>
          </div>
        </div>

        <div v-else class="login-prompt">
          <p>Da biste pristupili svim funkcijama, molimo vas da se prijavite.</p>
        </div>
      </div>
    </div>

    <!-- EDIT PROFILE MODAL -->
    <div v-if="showEditProfileModal" class="edit-profile-modal-overlay">
      <div class="edit-profile-modal" @click.stop>
        <div class="modal-header">
          <h3>Izmeni Profil</h3>
          <button @click="closeEditProfileModal()" class="close-btn" title="Zatvori">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleUpdateProfile()" class="edit-profile-form">
            <div class="form-group">
              <label for="editFirstName">Ime *</label>
              <input
                type="text"
                v-model="editForm.firstName"
                id="editFirstName"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="editLastName">Prezime *</label>
              <input
                type="text"
                v-model="editForm.lastName"
                id="editLastName"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="editEmail">Email adresa {{ showEmailChange ? '*' : '' }}</label>
              <input
                type="email"
                v-model="editForm.newEmail"
                id="editEmail"
                class="form-input"
                :disabled="!showEmailChange"
                :required="showEmailChange"
              />
              <button type="button" @click="toggleEmailChange()" class="btn btn-outline" style="margin-top: 8px; padding: 4px 8px; font-size: 14px;">
                {{ showEmailChange ? 'Otkaži promenu email-a' : 'Promeni email' }}
              </button>
            </div>



            <div v-if="hasChanges" class="form-group">
              <label for="editCurrentPassword">Lozinka za potvrdu *</label>
              <input
                type="password"
                v-model="editForm.currentPassword"
                id="editCurrentPassword"
                class="form-input"
              />
            </div>

            <div class="form-actions">
              <button type="button" @click="closeEditProfileModal()" class="btn btn-outline">
                Otkaži
              </button>
              <button type="submit" :disabled="isUpdating" class="btn btn-primary">
                {{ isUpdating ? 'Ažuriranje...' : 'Ažuriraj Profil' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>



  <!-- INFO MESSAGE MODAL -->
  <div v-if="showInfoMessageModal" class="info-message-modal-overlay">
    <div class="info-message-modal" @click.stop>
      <div class="modal-header">
        <h3>Obaveštenje</h3>
      </div>
      <div class="modal-body">
        <p>{{ infoMessage }}</p>
      </div>
      <div class="modal-footer">
        <button @click="closeInfoMessageModal" class="btn btn-primary">OK</button>
      </div>
    </div>
  </div>
</template>


<script setup>
  import { storeToRefs } from "pinia";
  import { useAuthStore } from "@/stores/auth-store";
  import { useLoaderStore } from "@/stores/loader-store";
  import router from "@/router/index.js";
  import { onMounted, ref, nextTick, computed } from "vue";
  // import { useRouter } from "@/router/index.js";
  // const router = useRouter();
  const authStore = useAuthStore();
  const loaderStore = useLoaderStore();
  const handleLogOut = async () => {
    authStore.logout();
  };
  const toLoginPage = () => {
    router.push({ path: "/login" });
  };
  const toRegisterPage = () => {
    router.push({ path: "/register" });
  };
  const { userData } = storeToRefs(authStore);

  // Info message modal state
  const showInfoMessageModal = ref(false);
  const infoMessage = ref('');
  const infoMessageCallback = ref(null);

  // Edit profile modal state
  const showEditProfileModal = ref(false);
  const isUpdating = ref(false);

  // Toggle states for additional fields
  const showEmailChange = ref(false);

  const editForm = ref({
    firstName: '',
    lastName: '',
    newEmail: '',
    currentPassword: ''
  });

  const hasChanges = computed(() => {
    return editForm.value.firstName !== (userData.value.firstName || '') ||
           editForm.value.lastName !== (userData.value.lastName || '') ||
           editForm.value.newEmail !== (userData.value.email || '');
  });

  const openEditProfileModal = () => {
    // Reset toggle states
    showEmailChange.value = false;

    // Populate form with current user data
    editForm.value = {
      firstName: userData.value.firstName || '',
      lastName: userData.value.lastName || '',
      newEmail: userData.value.email || '',
      currentPassword: ''
    };
    showEditProfileModal.value = true;
    
    // Set custom validation messages after modal is shown
    // nextTick(() => {
    //   setCustomValidationMessages();
    // });
  };

  const closeEditProfileModal = () => {
    showEditProfileModal.value = false;
    showEmailChange.value = false;
    editForm.value = {
      firstName: '',
      lastName: '',
      newEmail: '',
      currentPassword: ''
    };
  };

  const toggleEmailChange = () => {
    showEmailChange.value = !showEmailChange.value;
    if (!showEmailChange.value) {
      editForm.value.newEmail = userData.value.email || '';
    }
  };

  const showInfoMessage = (message, callback = null) => {
    infoMessage.value = message;
    infoMessageCallback.value = callback;
    showInfoMessageModal.value = true;
  };

  const closeInfoMessageModal = () => {
    showInfoMessageModal.value = false;
    // Execute callback if provided
    if (infoMessageCallback.value) {
      infoMessageCallback.value();
    }
  };

  const handleUpdateProfile = async () => {
    if (isUpdating.value) return;

    // Validate required fields
    if (!editForm.value.firstName.trim()) {
      showInfoMessage("Unesite ime!");
      return;
    }

    if (!editForm.value.lastName.trim()) {
      showInfoMessage("Unesite prezime!");
      return;
    }

    // Validate email change if enabled
    if (showEmailChange.value) {
      if (!editForm.value.newEmail.trim()) {
        showInfoMessage("Unesite e-mail adresu!");
        return;
      }
      // Email validation will be handled by HTML5 and Firebase
    }

    // Validate current password if there are changes
    if (hasChanges.value) {
      if (!editForm.value.currentPassword.trim()) {
        showInfoMessage("Unesite lozinku za potvrdu!");
        return;
      }
    }

    isUpdating.value = true;
    const emailChanged = showEmailChange.value && editForm.value.newEmail !== userData.value.email;
    
    try {
      const updateData = {
        firstName: editForm.value.firstName,
        lastName: editForm.value.lastName,
        newEmail: showEmailChange.value ? editForm.value.newEmail : undefined,
        newPassword: undefined, // No password change
        currentPassword: hasChanges.value ? editForm.value.currentPassword : undefined,
      };
      
      await authStore.updateProfile(updateData);
      closeEditProfileModal();
      
      if (emailChanged) {
        // Show message that user needs to re-login with callback to logout
        showInfoMessage(
          "Profil je uspešno ažuriran! Molimo da se ponovo prijavite sa novom email adresom.",
          () => {
            authStore.logout();
          }
        );
      } else {
        showInfoMessage("Profil je uspešno ažuriran!");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        showInfoMessage("Pogrešna lozinka!");
      } else {
        showInfoMessage("Greška pri ažuriranju profila!");
      }
    } finally {
      isUpdating.value = false;
    }
  };



  // Set custom validation messages for required fields
  const setCustomValidationMessages = () => {
    // No longer needed since we use JavaScript validation
  };

  // Ensure page is at top when component mounts
  onMounted(() => {
    window.scrollTo(0, 0);
    // Reset initializing state on any page (not loading data, just showing initial state)
    loaderStore.setInitializing(false);
  });
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
  padding: $space-lg;
}

.home-header {
  margin-bottom: $space-xl;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: $space-lg;

    h1 {
      color: white;
      font-size: $fs-2xl;
      font-weight: $fw-bold;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .auth-section {
      .user-info {
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: $space-md;

        .user-name-section {
          display: flex;
          align-items: center;
          gap: $space-sm;
          
          .user-name {
            color: $text-primary;
            font-weight: $fw-medium;
            font-size: $fs-lg;
          }
          
          .edit-icon-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: $fs-lg;
            padding: $space-xs;
            border-radius: $radius-sm;
            transition: background-color $transition-base;
            
            &:hover {
              background-color: rgba(255, 255, 255, 0.1);
            }
          }
        }

        .user-email {
          color: $text-primary;
          font-weight: $fw-medium;
          padding: $space-sm $space-md;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: $radius-md;
        }
      }

      .auth-buttons {
        display: flex;
        gap: $space-sm;
      }
    }
  }
}

.home-content {
  max-width: 1200px;
  margin: 0 auto;

  .welcome-section {
    text-align: center;
    padding: $space-3xl;

    h2 {
      color: $text-primary;
      font-size: $fs-xl;
      margin-bottom: $space-lg;
    }

    p {
      color: $text-secondary;
      font-size: $fs-lg;
      margin-bottom: $space-2xl;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: $space-xl;
      margin-top: $space-2xl;

      .feature-card {
        background: white;
        padding: $space-2xl;
        border-radius: $radius-lg;
        box-shadow: $shadow-md;
        text-align: center;
        transition: transform $transition-base, box-shadow $transition-base;

        &:hover {
          transform: translateY(-4px);
          box-shadow: $shadow-lg;
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: $space-md;
        }

        h3 {
          color: $text-primary;
          font-size: $fs-lg;
          margin-bottom: $space-sm;
        }

        p {
          color: $text-secondary;
          margin-bottom: $space-lg;
        }
      }
    }

    .login-prompt {
      p {
        color: $text-secondary;
        font-style: italic;
      }
    }
  }
}

// Modal styles
.edit-profile-modal-overlay {
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

.edit-profile-modal {
  background: white;
  border-radius: $radius-lg;
  box-shadow: $shadow-xl;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
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
      font-size: $fs-lg;
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: $text-secondary;
      padding: $space-xs;
      border-radius: $radius-sm;
      
      &:hover {
        background-color: $bg-primary;
        color: $text-primary;
      }
    }
  }

  .modal-body {
    padding: $space-lg;
    
    .edit-profile-form {
      .form-group {
        margin-bottom: $space-lg;
        
        label {
          display: block;
          margin-bottom: $space-sm;
          color: $text-primary;
          font-weight: $fw-medium;
        }
        
        .form-input {
          width: 100%;
          padding: $space-md;
          border: 1px solid $border-color;
          border-radius: $radius-md;
          font-size: $fs-base;
          
          &:focus {
            outline: none;
            border-color: $primary;
            box-shadow: 0 0 0 2px rgba($primary, 0.2);
          }
        }

        .email-display {
          width: 100%;
          padding: $space-md;
          border: 1px solid $border-color;
          border-radius: $radius-md;
          font-size: $fs-base;
          background-color: $bg-primary;
          color: $text-secondary;
        }
        
        .form-hint {
          display: block;
          margin-top: $space-xs;
          font-size: $fs-sm;
          color: $text-secondary;
        }
      }
      
      .form-actions {
        display: flex;
        gap: $space-md;
        justify-content: flex-end;
        margin-top: $space-xl;
        
        .btn {
          padding: $space-md $space-lg;
          border: none;
          border-radius: $radius-md;
          font-size: $fs-base;
          font-weight: $fw-medium;
          cursor: pointer;
          transition: all $transition-base;
          
          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          &.btn-primary {
            background-color: $primary;
            color: white;
            
            &:hover:not(:disabled) {
              background-color: $primary-dark;
            }
          }
          
          &.btn-outline {
            background-color: transparent;
            color: $text-primary;
            border: 1px solid $border-color;
            
            &:hover:not(:disabled) {
              background-color: $bg-primary;
            }
          }
        }
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .home-container {
    padding: $space-md;
  }

  .home-header .header-content {
    flex-direction: column;
    text-align: center;

    h1 {
      font-size: $fs-xl;
    }
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}

// INFO MESSAGE MODAL STYLES
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
</style>;
