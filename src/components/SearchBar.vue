<template>
  <div class="search-bar">
    <input
      v-model="query"
      type="search"
      class="search-bar__input"
      placeholder="Search leagues…"
      aria-label="Search leagues by name"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useLeaguesStore } from '@/stores/leagues'

const store = useLeaguesStore()
const { query } = storeToRefs(store)
</script>

<style scoped lang="scss">
.search-bar {
  position: relative;
  flex: 1;
}

.search-bar__input {
  width: 100%;
  padding: var(--space-3);
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font: inherit;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }
}
</style>
