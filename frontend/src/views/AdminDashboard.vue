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
      
      <div class="mass-operations-section">
        <div class="ops-card">
          <div class="ops-info">
            <h3>Массовые операции с данными</h3>
            <p>Загрузите JSON-файл для восстановления базы или экспортируйте текущее состояние всех сущностей (Пользователи, Комнаты, ПК, Бронирования).</p>
          </div>
          
          <div class="ops-actions">
            <div class="import-zone" @click="$refs.fileInput.click()">
              <input 
                type="file" 
                ref="fileInput" 
                style="display: none" 
                accept=".json" 
                @change="handleFileImport" 
              />
              <div class="import-placeholder">
                <span>Нажмите, чтобы выбрать <strong>.json</strong></span>
              </div>
            </div>

            <div class="export-zone">
              <button class="btn-export-all" @click="handleExport">
                Экспортировать всё в JSON
              </button>
            </div>
          </div>
        </div>
      </div>

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
import { useAuthStore } from '@/stores/auth'
import AdminLogs from './AdminLogs.vue'

const authStore = useAuthStore()
const currentTab = ref('summary')
const tabNames = { summary: 'Сводка', logs: 'Журнал'}

const kpiStats = ref([
  { label: 'В сети', value: '342', color: '#10B981' },
  { label: 'В ремонте', value: '8', color: '#EF4444' },
  { label: 'Бронирований', value: '2,150' },
  { label: 'Неявки', value: '5.2%', color: '#F59E0B' }
])

const handleExport = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/admin/export-all', {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    });
    
    if (!response.ok) throw new Error('Ошибка сервера');
    
    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `backup_${new Date().toLocaleDateString()}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    alert('Не удалось экспортировать данные: ' + err.message);
  }
}

const handleFileImport = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      let jsonData;
      
      try {
        jsonData = JSON.parse(e.target.result);
      } catch (parseErr) {
        throw new Error("Файл не является корректным JSON-документом или поврежден.");
      }

      const hasAnyCollection = ['Users', 'Rooms', 'Computers', 'Bookings'].some(key => key in jsonData);
      if (!hasAnyCollection) {
        throw new Error("В файле не найдено ни одной известной коллекции данных.");
      }

      if (!confirm("ВНИМАНИЕ: Это действие полностью перезапишет базу данных. Вы уверены?")) {
        event.target.value = ''; 
        return;
      }

      const response = await fetch('http://localhost:3000/api/admin/import-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify(jsonData)
      });

      const result = await response.json();

      if (response.ok) {
        alert("Успех: " + result.message);
        window.location.reload();
      } else {
        throw new Error(result.message || 'Ошибка при импорте');
      }
    } catch (err) {
      alert("Ошибка валидации: " + err.message);
    } finally {
      event.target.value = ''; 
    }
  };
  reader.readAsText(file);
}

onMounted(async () => {
})
</script>

<style lang="scss" scoped>
@use "@/assets/scss/pages/admin-dashboard";
</style>