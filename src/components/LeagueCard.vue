<template>
  <article class="card" @click="loadBadge">
    <div class="card__header">
      <span class="card__sport">{{ league.strSport }}</span>
      <h2 class="card__name">{{ league.strLeague }}</h2>
      <span v-if="league.strLeagueAlternate" class="card__alternate">{{ league.strLeagueAlternate }}</span>
    </div>

    <div class="card__badge-container">
      <button
        v-if="!entry"
        type="button"
        class="card__badge-button"
        :disabled="isLoading"
        :aria-busy="isLoading"
      >
        View Badge
      </button>
      <SeasonBadge v-else :entry="entry" @retry="store.retryBadge(league.idLeague)" />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import SeasonBadge from '@/components/SeasonBadge.vue'
import { useLeaguesStore } from '@/stores/leagues'
import { Statuses, type League } from '@/types/league'

const props = defineProps<{ league: League }>()

const store = useLeaguesStore()
const { badges } = storeToRefs(store)

const entry = computed(() => badges.value.get(props.league.idLeague))
const isLoading = computed(() => entry.value?.status === Statuses.loading)

function loadBadge() {
  store.loadBadge(props.league.idLeague)
}
</script>

<style scoped lang="scss">
.card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: border-color 0.15s ease;
  height: 273px;
  cursor: pointer;

  &:hover {
    border-color: var(--accent);
  }
}

.card__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
  text-align: left;
}

.card__name {
  margin: 0;
  font-size: 16px;
}

.card__sport {
  align-self: flex-start;
  background: var(--surface-2);
  border-radius: 999px;
  padding: 0 var(--space-2);
  margin-bottom: var(--space-2);
  font-size: 12px;
  color: var(--muted);
}

.card__alternate {
  font-size: 14px;
  color: var(--muted);
}

.card__badge-container {
  flex: 1;
  padding: var(--space-4);
  border-top: 1px solid var(--border);
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card__badge-button {
  padding: var(--space-3) var(--space-4);
  background: var(--accent);
  color: var(--accent-foreground);
  border: 0;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: progress;
    opacity: 0.6;
  }
}
</style>
