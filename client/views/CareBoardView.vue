<script setup lang="ts">
import CareBoardPostListComponent from "@/components/Post/PostListComponentCareBoard.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";

const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
</script>

<template>
  <main class="homepage">
    <!-- Header Section -->
    <section class="header">
      <h1 class="welcome-message">
        <span v-if="isLoggedIn">Welcome, {{ currentUsername }}!</span>
        <span v-else>Please login to access your account!</span>
      </h1>
    </section>

    <!-- Care Board Section -->
    <section class="care-board">
      <h2 class="section-title">Care Board</h2>
      <CareBoardPostListComponent />
    </section>
  </main>
</template>

<style scoped>
/* General Layout */
.homepage {
  background-color: #ffe3e3;
  padding: 2rem;
  border-radius: 12px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

/* Welcome Section */
.header {
  background-color: #ffb3b3;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.welcome-message {
  font-size: 1.8rem;
  color: #000;
  font-weight: bold;
}

/* Section Titles */
.section-title {
  font-size: 1.6rem;
  color: #fff;
  background-color: #000;
  padding: 0.8rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 1rem;
}

/* Sister Circles & Care Board Sections */
.sister-circles,
.care-board {
  background-color: #ffc1c1;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sister-circles :deep(h2),
.care-board :deep(h2) {
  margin-bottom: 1rem;
}

/* Component Wrappers */
.sister-circles > div,
.care-board > div {
  padding: 1rem;
  background-color: #ffe3e3;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
