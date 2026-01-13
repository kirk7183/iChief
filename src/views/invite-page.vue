<template>
  <div class="invite-container">
    <div v-if="!isLoggedIn" class="auth-prompt">
      <h2>Dobrodošli!</h2>
      <p>Da biste pristupili pozivu i videli listu, molimo vas da se prijavite ili registrujete.</p>
      <div class="auth-buttons">
        <button @click="goToLogin" class="btn btn-primary">Prijavi se</button>
        <button @click="goToRegister" class="btn btn-outline">Registruj se</button>
      </div>
    </div>

    <div v-else-if="loading" class="loading">
      <p>Obrada poziva...</p>
    </div>

    <div v-else-if="error" class="error">
      <h2>Greška</h2>
      <p>{{ error }}</p>
      <button @click="goHome" class="btn btn-primary">Idi na početnu</button>
    </div>

    <div v-else-if="success" class="success">
      <h2>Čestitamo!</h2>
      <p>Dobili ste pristup listi čiji je vlasnik <b>{{ ownerName }} ({{ ownerEmail }})</b>.</p>
      <button @click="goToList" class="btn btn-primary">OK</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth-store';
import { useMarketListStore } from '@/stores/market-list-store';
import { useLoaderStore } from '@/stores/loader-store';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const marketStore = useMarketListStore();
const loaderStore = useLoaderStore();
const router = useRouter();

const isLoggedIn = ref(false);
const loading = ref(true);
const error = ref('');
const success = ref(false);
const ownerName = ref('');
const ownerEmail = ref('');

const processInvite = async (code) => {
  console.log('processInvite called with code:', code);
  try {
    const result = await marketStore.acceptInvite(code);
    console.log('acceptInvite result:', result);
    
    // Fetch lists to update the store with the new shared list
    console.log('Fetching lists...');
    await marketStore.fetchLists();
    console.log('Lists fetched:', marketStore.lists);
    
    if (result.alreadyShared) {
      success.value = true;
      ownerName.value = result.ownerInfo.firstName + ' ' + result.ownerInfo.lastName;
      ownerEmail.value = result.ownerInfo.email;
    } else {
      success.value = true;
      ownerName.value = result.ownerInfo.firstName + ' ' + result.ownerInfo.lastName;
      ownerEmail.value = result.ownerInfo.email;
    }
  } catch (err) {
    console.error('Error in processInvite:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // Initial setup when page loads
  const code = router.currentRoute.value.query.code;
  console.log('Invite page mounted, code:', code);
  console.log('Full URL:', window.location.href);

  if (!code) {
    error.value = 'Nevažeći link.';
    loading.value = false;
    loaderStore.setInitializing(false);
    return;
  }

  // Check if user is logged in
  console.log('Is logged in:', authStore.userData.isLoggedIn);
  if (!authStore.userData.isLoggedIn) {
    // User is not logged in, save code for later
    console.log('User not logged in, saving invite code for later');
    marketStore.setPendingInviteCode(code);
    isLoggedIn.value = false;
    loading.value = false;
    loaderStore.setInitializing(false);
    return;
  }

  // User is logged in, process the invite
  isLoggedIn.value = true;
  await processInvite(code);
  loaderStore.setInitializing(false);
});

// Watch for code changes in URL and process invite
watch(() => router.currentRoute.value.query.code, async (newCode) => {
  console.log('Code in URL changed:', newCode);
  if (!newCode) return;
  
  // If user is logged in, process the invite
  if (authStore.userData.isLoggedIn) {
    console.log('User is logged in, processing invite');
    isLoggedIn.value = true;
    loading.value = true;
    try {
      await processInvite(newCode);
    } finally {
      loading.value = false;
    }
  } else {
    // If user is not logged in, just show the auth prompt
    console.log('User is not logged in, showing auth prompt');
    isLoggedIn.value = false;
    loading.value = false;
  }
});

// Watch for login changes
watch(() => authStore.userData.isLoggedIn, async (newVal) => {
  console.log('Watch isLoggedIn changed to:', newVal);
  const code = router.currentRoute.value.query.code;
  console.log('Current code:', code);
  
  if (newVal && code && !isLoggedIn.value) {
    console.log('User just logged in and we have a code, processing invite');
    isLoggedIn.value = true;
    loading.value = true;
    try {
      await processInvite(code);
    } finally {
      loading.value = false;
    }
  }
});

const goToLogin = () => {
  const code = router.currentRoute.value.query.code;
  console.log('Going to login with code:', code);
  // Save code and redirect to login (no redirect param needed)
  marketStore.setPendingInviteCode(code);
  router.push({
    name: 'Login'
  });
};

const goToRegister = () => {
  const code = router.currentRoute.value.query.code;
  console.log('Going to register with code:', code);
  // Save code and redirect to register (no redirect param needed)
  marketStore.setPendingInviteCode(code);
  router.push({
    name: 'Register'
  });
};

const goHome = () => {
  router.push('/');
};

const goToList = () => {
  router.push('/market-list');
};
</script>

<style scoped>
.invite-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.auth-prompt, .loading, .error, .success {
  text-align: center;
  max-width: 400px;
}

.auth-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}
</style>