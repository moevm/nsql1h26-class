<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h1 class="page-title">Аналитика и Управление</h1>
      <p class="page-subtitle">Центр контроля за инфраструктурой ВУЗа</p>
    </div>

    <div class="local-tabs">
      <div 
        v-for="tab in ['summary', 'logs', 'schedule']" 
        :key="tab"
        :class="['local-tab', { active: currentTab === tab }]"
        @click="currentTab = tab"
      >
        {{ tabNames[tab] }}
      </div>
    </div>

    <div v-if="currentTab === 'summary'" class="tab-content">
      <div class="kpi-grid">
        <div class="kpi-card" v-for="stat in kpiStats" :key="stat.label">
          <span class="kpi-label">{{ stat.label }}</span>
          <div class="kpi-val" :style="{ color: stat.color }">{{ stat.value }}</div>
        </div>
      </div>
      
      <div class="charts-placeholder">
        <div class="chart-box">График неявок (Заглушка)</div>
        <div class="chart-box">График загрузки (Заглушка)</div>
      </div>
    </div>

    <div v-if="currentTab === 'logs'" class="tab-content">
      <AdminLogs />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLogs from './AdminLogs.vue'
const currentTab = ref('summary')
const tabNames = { summary: 'Сводка', logs: 'Журнал', schedule: 'Расписание' }

// пока заглушка, но тут бек прикрутить надо
const kpiStats = ref([
  { label: 'В сети', value: '342', color: '#10B981' },
  { label: 'В ремонте', value: '8', color: '#EF4444' },
  { label: 'Бронирований', value: '2,150' },
  { label: 'Неявки', value: '5.2%', color: '#F59E0B' }
])

const logs = ref([
  { id: '#BK-8492', date: '12 Окт 2023', user: 'Иванов Иван', room: 'Ауд. 301-A', status: 'Завершено', statusType: 'done' },
  { id: '#BK-8488', date: '12 Окт 2023', user: 'Сидоров Семен', room: 'ВЦ-415', status: 'Неявка', statusType: 'miss' }
])

onMounted(async () => {
  // запрос к беку сбда
})
</script>

<style lang="scss" scoped>
  @use "@/assets/scss/pages/admin-dashboard";
</style>