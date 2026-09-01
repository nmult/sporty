<template>
  <div v-if="status === Statuses.idle || status === Statuses.loading" class="list__state">
    Loading leagues…
  </div>

  <div v-else-if="status === Statuses.error" class="list__state list__state--error">
    <p>{{ error }}</p>
    <button type="button" class="list__button" @click="store.loadLeagues()">Try again</button>
  </div>

  <div v-else-if="filteredLeagues.length === 0" class="list__state">
    <p v-if="leagues.length === 0">No available leagues.</p>
    <template v-else>
      <p>No leagues match those filters.</p>
      <button type="button" class="list__button" @click="store.clearFilters()">Clear filters</button>
    </template>
  </div>

  <div v-else class="list__grid">
    <LeagueCard v-for="league in filteredLeagues" :key="league.idLeague" :league="league" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import LeagueCard from '@/components/LeagueCard.vue'
import { useLeaguesStore } from '@/stores/leagues'
import { Statuses } from '@/types/league'

const store = useLeaguesStore()
const { status, error, filteredLeagues, leagues } = storeToRefs(store)
</script>

<style scoped lang="scss">
.list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
  align-items: start;
}

.list__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-8);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--muted);
  text-align: center;
}

.list__state--error {
  color: var(--danger);
}

.list__button {
  background: var(--accent);
  color: #fff;
  border: 0;
  border-radius: var(--radius);
  padding: var(--space-2) var(--space-4);
  font: inherit;
  cursor: pointer;
}
</style>
