<template>
  <main class="app">
    <h1 class="app__title">Sports Leagues</h1>
    <p class="app__subtitle">Search, filter by sport, and open a league to see its season badge.</p>
    <div class="app__filters">
      <SearchBar />
      <LeagueFilters />
    </div>
    <ResultsSummary />
    <LeagueList />
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import LeagueFilters from '@/components/LeagueFilters.vue'
import LeagueList from '@/components/LeagueList.vue'
import ResultsSummary from '@/components/ResultsSummary.vue'
import SearchBar from '@/components/SearchBar.vue'
import { useLeaguesStore } from '@/stores/leagues'

const store = useLeaguesStore()

onMounted(() => {
  store.loadLeagues()
})
</script>

<style scoped lang="scss">
.app__filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

@media (max-width: 640px) {
  .app__filters {
    flex-direction: column;
  }
}
</style>