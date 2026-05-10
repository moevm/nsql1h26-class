<script setup>
const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true }
})

const emit = defineEmits(['update:page'])

const goPrev = () => {
  if (props.page > 1) emit('update:page', props.page - 1)
}

const goNext = () => {
  if (props.page < props.totalPages) emit('update:page', props.page + 1)
}
</script>

<template>
  <div class="pagination" v-if="totalPages > 1">
    <button class="page-btn" :disabled="page === 1" @click="goPrev">
      <span class="arrow">←</span>
    </button>
    <span class="page-info">{{ page }} / {{ totalPages }}</span>
    <button class="page-btn" :disabled="page >= totalPages" @click="goNext">
      <span class="arrow">→</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/variables" as v;

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;

  .page-btn {
    background: v.$bg-surface;
    border: 1px solid v.$border-color;
    color: white;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.2rem;
    transition: v.$transition;

    &:hover:not(:disabled) {
      border-color: v.$accent;
      color: v.$accent;
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }

  .page-info {
    font-weight: 800;
    font-size: 1.1rem;
    color: white;
    min-width: 60px;
    text-align: center;
  }
}
</style>
