import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedState from "pinia-plugin-persistedstate";

import App from "./App.vue";
import router from "./router";

import "./assets/styles/main.scss";

// Disable browser scroll restoration to ensure pages always load at top
history.scrollRestoration = 'manual';

// Ensure page always loads at top
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

const pinia = createPinia();
pinia.use(piniaPluginPersistedState);
// app.use(createPinia());
const app = createApp(App);
app.use(pinia);
app.use(router);

app.mount("#app");
