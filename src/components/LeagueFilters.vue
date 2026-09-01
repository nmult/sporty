<template>
  <select v-model="selectedSport" class="league-filters" aria-label="Filter by sport">
    <option value="">All sports</option>
    <option v-for="option in uniqSports" :key="option" :value="option">{{ option }}</option>
  </select>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useLeaguesStore } from '@/stores/leagues'

const store = useLeaguesStore()
const { selectedSport, uniqSports } = storeToRefs(store)
</script>

<style scoped lang="scss">
.league-filters {
  width: auto;
  min-width: 160px;
  appearance: none;
  padding: var(--space-3);
  padding-right: var(--space-6);
  background: var(--surface);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath fill='%23666' d='M4 6l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--space-2) center;
  background-size: 16px;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font: inherit;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }
}

@media (max-width: 640px) {
  .league-filters {
    width: 100%;
  }
}
</style>
