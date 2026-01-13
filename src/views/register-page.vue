<template>
  <div class="register-container">
    <div class="register-card card">
      <div class="register-header">
        <h1>🍳 iChief</h1>
        <h2>Kreirajte svoj nalog</h2>
      </div>

      <form @submit.prevent="handleRegister()" class="register-form">
        <div class="form-group">
          <label for="firstName">Ime</label>
          <input
            type="text"
            v-model="authStore.firstName"
            id="firstName"
            placeholder="Vaše ime"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="lastName">Prezime</label>
          <input
            type="text"
            v-model="authStore.lastName"
            id="lastName"
            placeholder="Vaše prezime"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="email">Email adresa</label>
          <input
            type="email"
            v-model="authStore.email"
            id="email"
            placeholder="vas@email.com"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="password">Lozinka</label>
          <input
            type="password"
            v-model="authStore.password"
            id="password"
            placeholder="Unesite lozinku"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="passwordConfirm">Potvrdite lozinku</label>
          <input
            type="password"
            v-model="passwordConfirm"
            id="passwordConfirm"
            placeholder="Potvrdite lozinku"
            class="form-input"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-full" :disabled="isLoading">
          <span v-if="isLoading">🔄 Registracija...</span>
          <span v-else>📝 Registruj se</span>
        </button>
      </form>

      <div class="register-footer">
        <p>Već imate nalog?
          <button @click="toLoginPage" class="link-btn">Prijavite se</button>
        </p>
      </div>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth-store";
import { useMarketListStore } from "@/stores/market-list-store";
import { useLoaderStore } from "@/stores/loader-store";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const marketStore = useMarketListStore();
const loaderStore = useLoaderStore();
const router = useRouter();
const isLoading = ref(false);
const passwordConfirm = ref("");

// Modal state
const showInfoMessageModal = ref(false);
const infoMessage = ref("");

const handleRegister = async () => {
  if (isLoading.value) return;

  // Validation
  if (!authStore.firstName.trim()) {
    showInfoMessage("Unesite ime!");
    return;
  }

  if (!authStore.lastName.trim()) {
    showInfoMessage("Unesite prezime!");
    return;
  }

  if (!authStore.email.trim()) {
    showInfoMessage("Unesite email adresu!");
    return;
  }

  if (!authStore.password.trim()) {
    showInfoMessage("Unesite lozinku!");
    return;
  }

  if (authStore.password !== passwordConfirm.value) {
    showInfoMessage("Lozinke se ne poklapaju!");
    return;
  }

  isLoading.value = true;
  try {
    await authStore.register();
    console.log('Register successful, checking for pending invite...');
    // Wait a moment for auth state to fully update
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check for pending invite code first
    const pendingCode = marketStore.getPendingInviteCode();
    console.log('Pending invite code:', pendingCode);
    
    if (pendingCode) {
      console.log('Found pending invite, redirecting to invite page');
      marketStore.clearPendingInviteCode();
      router.push({
        name: 'Invite',
        query: {
          code: pendingCode
        }
      });
    } else {
      // Check for redirect parameter (for backward compatibility)
      const redirect = router.currentRoute.value.query.redirect;
      console.log('Redirect parameter:', redirect);
      if (redirect) {
        console.log('Pushing to:', redirect);
        // Handle redirect - it could be a path with query string like /invite?code=XXX
        if (redirect.includes('?')) {
          // Split path and query string
          const [path, queryString] = redirect.split('?');
          // Parse query string into object
          const queryParams = new URLSearchParams(queryString);
          const queryObj = {};
          queryParams.forEach((value, key) => {
            queryObj[key] = value;
          });
          console.log('Parsed path:', path, 'Parsed query:', queryObj);
          router.push({
            path: path,
            query: queryObj
          });
        } else {
          // No query string, just a simple path
          router.push(redirect);
        }
      } else {
        console.log('No redirect, going to home');
        router.push("/");
      }
    }
  } catch (error) {
    console.error("Register error:", error);
    showInfoMessage(error.message || "Greška pri registraciji. Pokušajte ponovo.");
  } finally {
    isLoading.value = false;
  }
};

const showInfoMessage = (message) => {
  infoMessage.value = message;
  showInfoMessageModal.value = true;
};

const toLoginPage = () => {
  router.push("/login");
};

// Ensure page is at top when component mounts
onMounted(() => {
  window.scrollTo(0, 0);
  loaderStore.setInitializing(false);
  // Reset all form fields
  authStore.firstName = "";
  authStore.lastName = "";
  authStore.email = "";
  authStore.password = "";
  passwordConfirm.value = "";
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-lg;
}

.register-card {
  width: 100%;
  max-width: 400px;
  padding: $space-2xl;

  .register-header {
    text-align: center;
    margin-bottom: $space-2xl;

    h1 {
      color: $primary;
      font-size: $fs-2xl;
      margin-bottom: $space-sm;
    }

    h2 {
      color: $text-primary;
      font-size: $fs-lg;
      font-weight: $fw-medium;
      margin: 0;
    }
  }

  .register-form {
    .form-group {
      margin-bottom: $space-lg;

      label {
        display: block;
        color: $text-primary;
        font-weight: $fw-medium;
        margin-bottom: $space-sm;
        font-size: $fs-base;
      }

      .form-input {
        width: 100%;
        padding: $space-md;
        border: 2px solid $border-color;
        border-radius: $radius-md;
        font-size: $fs-base;
        transition: border-color $transition-base, box-shadow $transition-base;

        &:focus {
          outline: none;
          border-color: $primary;
          box-shadow: 0 0 0 3px rgba($primary, 0.1);
        }

        &::placeholder {
          color: $text-tertiary;
        }
      }
    }

    .btn-full {
      width: 100%;
      padding: $space-md;
      font-size: $fs-base;
      font-weight: $fw-medium;
    }
  }

  .register-footer {
    text-align: center;
    margin-top: $space-xl;
    padding-top: $space-lg;
    border-top: 1px solid $border-color;

    p {
      color: $text-secondary;
      margin: 0;
    }

    .link-btn {
      @include reset-button;
      color: $primary;
      font-weight: $fw-medium;
      text-decoration: underline;
      cursor: pointer;
      transition: color $transition-base;

      &:hover {
        color: $primary-dark;
      }
    }
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

// Responsive design
@media (max-width: 480px) {
  .register-container {
    padding: $space-md;
  }

  .register-card {
    padding: $space-xl;
  }
}
</style>
