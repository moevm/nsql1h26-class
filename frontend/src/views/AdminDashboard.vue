<template>
  <div class="dashboard-container">
    <div class="page-header">
      <div class="title-block">
        <h1>Аналитика и Управление</h1>
        <p>Центр контроля за инфраструктурой ВУЗа</p>
      </div>
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

      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3>График неявок</h3>
            <span class="chart-badge">Заглушка</span>
          </div>
          <div class="chart-body">
            <div class="chart-placeholder">Данные в процессе сбора...</div>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3>График загрузки</h3>
            <span class="chart-badge">Заглушка</span>
          </div>
          <div class="chart-body">
            <div class="chart-placeholder">Данные в процессе сбора...</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="currentTab === 'logs'" class="tab-content">
      <AdminLogs />
    </div>

    <div v-if="currentTab === 'schedule'" class="tab-content">
      <div class="empty-state">
        <p>Расписание в разработке</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLogs from './AdminLogs.vue'

const currentTab = ref('summary')
const tabNames = { summary: 'Сводка', logs: 'Журнал', schedule: 'Расписание' }

const kpiStats = ref([
  { label: 'В сети', value: '342', color: '#10B981' },
  { label: 'В ремонте', value: '8', color: '#EF4444' },
  { label: 'Бронирований', value: '2,150' },
  { label: 'Неявки', value: '5.2%', color: '#F59E0B' }
])

onMounted(async () => {
  // TODO: запрос к бекенду за реальными KPI
})
</script>

<style lang="scss" scoped>
@use "@/assets/scss/pages/admin-dashboard";
</style>
