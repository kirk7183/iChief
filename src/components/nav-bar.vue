<template>
  <nav class="navbar">
    <div class="nav-container">
      <!-- LOGO -->
      <div class="nav-logo">
        <RouterLink to="/" class="logo-link">
          🛒 iChief
        </RouterLink>
      </div>

      <!-- DESKTOP MENU -->
      <div class="nav-menu desktop-menu">
        <RouterLink to="/" class="nav-link">Početna</RouterLink>
        <RouterLink to="/about" class="nav-link">O nama</RouterLink>
      </div>

      <!-- MOBILE MENU BUTTON -->
      <button @click="toggleMenu" class="hamburger-btn" :class="{ active: showMenu }">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
    </div>

    <!-- MOBILE MENU -->
    <div v-if="showMenu" class="mobile-menu">
      <RouterLink to="/" @click="closeMenu" class="nav-link">Početna</RouterLink>
      <RouterLink to="/about" @click="closeMenu" class="nav-link">O nama</RouterLink>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue';

const showMenu = ref(false);

const toggleMenu = () => {
  showMenu.value = !showMenu.value;
};

const closeMenu = () => {
  showMenu.value = false;
};
</script>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.navbar {
  background-color: $primary;
  box-shadow: $shadow-sm;
  position: sticky;
  top: 0;
  z-index: 100;
  margin-top: 0;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 $space-lg;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;

  @include md {
    padding: 0 $space-2xl;
  }

  @include xl {
    max-width: none;
    margin: 0;
    padding: 0 $space-xl;
  }
}

// LOGO
.nav-logo {
  .logo-link {
    color: white;
    font-size: $fs-lg;
    font-weight: $fw-bold;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: $space-sm;

    &:hover {
      color: rgba(white, 0.8);
    }
  }
}

// DESKTOP MENU
.desktop-menu {
  display: none;

  @include lg {
    display: flex;
    gap: $space-xl;
  }

  .nav-link {
    color: rgba(white, 0.9);
    text-decoration: none;
    font-weight: $fw-medium;
    padding: $space-sm $space-md;
    border-radius: $radius-md;
    transition: all $transition-fast;

    &:hover {
      background-color: rgba(white, 0.1);
      color: white;
    }

    &.router-link-active {
      background-color: rgba(white, 0.2);
      color: white;
    }
  }
}

// HAMBURGER BUTTON
.hamburger-btn {
  @include reset-button;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: $space-sm;
  height: 40px;
  border-radius: $radius-md;
  transition: all $transition-fast;

  @include lg {
    display: none;
  }

  &:hover {
    background-color: rgba(white, 0.1);
  }

  .hamburger-line {
    width: 20px;
    height: 2px;
    background-color: white;
    transition: all $transition-fast;
    transform-origin: center;
  }

  &.active {
    .hamburger-line:nth-child(1) {
      transform: rotate(45deg) translate(5px, 4px);
    }
    .hamburger-line:nth-child(2) {
      opacity: 0;
    }
    .hamburger-line:nth-child(3) {
      transform: rotate(-45deg) translate(4px, -4px);
    }
  }
}

// MOBILE MENU
.mobile-menu {
  display: block;
  background-color: $primary;
  border-top: 1px solid rgba(white, 0.1);
  padding: $space-md 0;

  @include lg {
    display: none;
  }

  .nav-link {
    display: block;
    color: rgba(white, 0.9);
    text-decoration: none;
    font-size: $fs-lg;
    font-weight: $fw-medium;
    padding: $space-md $space-lg;
    transition: all $transition-fast;

    &:hover {
      background-color: rgba(white, 0.1);
      color: white;
    }

    &.router-link-active {
      background-color: rgba(white, 0.2);
      color: white;
    }
  }
}
</style>