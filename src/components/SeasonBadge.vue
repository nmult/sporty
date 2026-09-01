<template>
  <div class="badge">
    <div v-if="isLoading" class="badge__skeleton" />

    <div v-else-if="hasError" class="badge__error">
      <p v-if="errorMessage" class="badge__error-text">{{ errorMessage }}</p>
      <button type="button" class="badge__retry" @click="$emit('retry')">Try again</button>
    </div>

    <template v-else-if="showImage">
      <img :src="imageUrl" :alt="imageAlt" class="badge__image" @error="onImageError" />
      <p class="badge__season">Season {{ season }}</p>
    </template>

    <div v-else class="badge__placeholder">
      <span class="badge__placeholder-mark" aria-hidden="true">—</span>
      <p class="badge__placeholder-text">{{ placeholderText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Statuses, type BadgeEntry } from '@/types/league'

const props = defineProps<{ entry?: BadgeEntry }>()
defineEmits<{ retry: [] }>()

const failedUrl = ref<string | null>(null)
const imageFailed = computed(() => failedUrl.value !== null && failedUrl.value === props.entry?.url)

const isLoading = computed(() => !props.entry || props.entry.status === Statuses.loading)
const hasError = computed(() => props.entry?.status === Statuses.error)
const errorMessage = computed(() => props.entry?.message ?? '')

const imageUrl = computed(() => props.entry?.url ?? '')
const season = computed(() => props.entry?.season ?? '')
const showImage = computed(() => Boolean(imageUrl.value) && !imageFailed.value)
const imageAlt = computed(() =>
  season.value ? `Season badge for ${season.value}` : 'Season badge',
)

const placeholderText = computed(() =>
  imageFailed.value ? 'The badge image could not be loaded' : 'No badge available for this league',
)

function onImageError() {
  failedUrl.value = props.entry?.url ?? null
}
</script>

<style scoped lang="scss">
@use '../styles/mixins' as m;

.badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);

  /* Badge + gap + caption, so every state occupies one box and the card
     does not jump when the image arrives. */
  min-height: calc(var(--badge-size) + var(--space-2) + var(--badge-caption));
}

.badge__skeleton,
.badge__image,
.badge__placeholder {
  width: var(--badge-size);
  height: var(--badge-size);
}

.badge__skeleton {
  @include m.skeleton;
}

.badge__image {
  object-fit: contain;
}

.badge__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  padding: var(--space-2);
}

.badge__placeholder-mark {
  font-size: 24px;
  color: var(--muted);
}

.badge__placeholder-text,
.badge__season {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}

.badge__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.badge__error-text {
  margin: 0;
  font-size: 14px;
  color: var(--danger);
}

.badge__retry {
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
}
</style>
