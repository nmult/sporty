<template>
  <div v-if="isVisible" class="summary">
    <p class="summary__count" aria-live="polite">{{ countLabel }}</p>

    <button
      v-if="hasActiveFilters"
      type="button"
      class="summary__clear"
      @click="store.clearFilters()"
    >
      Clear filters
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useLeaguesStore } from '@/stores/leagues'
import { Statuses } from '@/types/league'

const store = useLeaguesStore()
const { status, leagues, filteredLeagues, hasActiveFilters } = storeToRefs(store)

// Only meaningful once a non-empty list has loaded; the list itself owns the
// loading, error and "nothing at all" states.
const isVisible = computed(() => status.value === Statuses.success && leagues.value.length > 0)

const countLabel = computed(() =>
  hasActiveFilters.value
    ? `${filteredLeagues.value.length} of ${leagues.value.length} leagues`
    : `${leagues.value.length} leagues`,
)
</script>

<style scoped lang="scss">
.summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.summary__count {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
}

.summary__clear {
  background: none;
  color: var(--accent);
  border: 0;
  padding: var(--space-1) 0;
  font: inherit;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}
</style>
