<template>
  <div class="my-bookings-page">
    <div class="filters-grid">
      <div class="filter-item">
        <label>Дата от</label>
        <input type="date" v-model="filters.dateFrom" @change="handleFilter">
      </div>
      <div class="filter-item">
        <label>Дата до</label>
        <input type="date" v-model="filters.dateTo" @change="handleFilter">
      </div>
      <div class="filter-item">
        <label>№ Пары</label>
        <select v-model="filters.pairNumber" @change="handleFilter">
          <option value="">Все</option>
          <option v-for="n in 7" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label>Аудитория</label>
        <input type="text" v-model="filters.roomName" @input="handleFilter" placeholder="Номер...">
      </div>
    </div>

    <div class="tabs-nav">
      <button :class="{ active: currentTab === 'active' }" @click="setTab('active')">Текущие</button>
      <button :class="{ active: currentTab === 'history' }" @click="setTab('history')">История</button>
    </div>

    <div class="table-container">
      <table v-if="!loading">
        <thead>
          <tr>
            <th>ДАТА</th>
            <th>ПАРА</th>
            <th>ВРЕМЯ</th>
            <th>АУДИТОРИЯ</th>
            <th>МЕСТО</th>
            <th>СТАТУС</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in bookings" :key="b.id">
            <td>{{ formatDbDate(b.start_at) }}</td>
            <td>№ {{ getPairNumber(b.start_at) }}</td>
            <td>{{ getPairRange(b.start_at) }}</td>
            <td>{{ b.room_name }}</td>
            <td>{{ b.seat_index }}</td>
            <td><span :class="['status-pill', b.status]">{{ b.status }}</span></td>
            <td>
              <button v-if="b.status === 'reserved'" @click="cancel(b.id)" class="btn-cancel">Отмена</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="loader">Загрузка...</div>
    </div>

    <BasePagination :page="filters.page" :totalPages="totalPages" @update:page="handlePageChange" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BasePagination from '@/components/BasePagination.vue'

const authStore = useAuthStore()
const bookings = ref([])
const total = ref(0)
const loading = ref(false)
const currentTab = ref('active')

const filters = ref({
  dateFrom: '',
  dateTo: '',
  pairNumber: '',
  roomName: '',
  page: 1,
  limit: 5
})

const totalPages = computed(() => Math.ceil(total.value / filters.value.limit))

const formatDbDate = (s) => s ? s.split('T')[0].split('-').reverse().join('.') : '—'
const getTimeOnly = (s) => s ? s.split('T')[1].substring(0, 5) : ''

const getPairNumber = (s) => {
  const t = getTimeOnly(s)
  const map = { '08:00':1, '09:50':2, '11:40':3, '13:40':4, '15:30':5, '17:20':6, '19:00':7 }
  return map[t] || '?'
}

const getPairRange = (s) => {
  const t = getTimeOnly(s)
  const map = {
    '08:00':'08:00-09:30', '09:50':'09:50-11:20', '11:40':'11:40-13:10',
    '13:40':'13:40-15:10', '15:30':'15:30-17:00', '17:20':'17:20-18:50', '19:00':'19:00-20:30'
  }
  return map[t] || t
}

const load = async () => {
  loading.value = true
  const query = new URLSearchParams({ type: currentTab.value, ...filters.value }).toString()
  try {
    const res = await fetch(`http://localhost:3000/api/bookings/mybookings?${query}`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    const data = await res.json()
    bookings.value = data.data
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleFilter = () => { filters.value.page = 1; load(); }
const handlePageChange = (p) => { filters.value.page = p; load(); }
const setTab = (t) => { currentTab.value = t; handleFilter(); }

const cancel = async (id) => {
  if (confirm('Удалить бронь?')) {
    await fetch(`http://localhost:3000/api/bookings/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    load()
  }
}

onMounted(load)
</script>
<style lang="scss" scoped>
  @use "@/assets/scss/pages/user_booking";
</style>