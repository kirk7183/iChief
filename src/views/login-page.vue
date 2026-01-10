<template>
  <div class="login-container">
    <div class="login-card card">
      <div class="login-header">
        <h1>🍳 iChief</h1>
        <h2>Prijavite se na svoj nalog</h2>
      </div>

      <form @submit.prevent="handleLogin()" class="login-form">
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

        <button type="submit" class="btn btn-primary btn-full" :disabled="isLoading">
          <span v-if="isLoading">🔄 Prijava...</span>
          <span v-else>🔐 Prijavi se</span>
        </button>
      </form>

      <div class="login-footer">
        <p>Nemate nalog?
          <button @click="toRegisterPage" class="link-btn">Registrujte se</button>
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
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();
const isLoading = ref(false);

// Modal state
const showInfoMessageModal = ref(false);
const infoMessage = ref("");

const handleLogin = async () => {
  if (isLoading.value) return;

  // Validation
  if (!authStore.email.trim()) {
    showInfoMessage("Unesite email adresu!");
    return;
  }

  if (!authStore.password.trim()) {
    showInfoMessage("Unesite lozinku!");
    return;
  }

  isLoading.value = true;
  try {
    await authStore.login();
    // Success - router će automatski redirectovati
  } catch (error) {
    console.error("Login error:", error);
    // Error handling će biti u auth store-u
  } finally {
    isLoading.value = false;
  }
};

const showInfoMessage = (message) => {
  infoMessage.value = message;
  showInfoMessageModal.value = true;
};

const toRegisterPage = () => {
  router.push("/register");
};

// Ensure page is at top when component mounts
onMounted(() => {
  window.scrollTo(0, 0);
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-lg;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: $space-2xl;

  .login-header {
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

  .login-form {
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

  .login-footer {
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
  .login-container {
    padding: $space-md;
  }

  .login-card {
    padding: $space-xl;
  }
}
</style>