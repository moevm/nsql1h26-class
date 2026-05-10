<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BasePagination from '@/components/BasePagination.vue'

const authStore = useAuthStore()
const logs = ref([])
const totalLogs = ref(0)
const loading = ref(true)

const expandedLogIds = ref([])

const filters = ref({
  dateFrom: '',
  dateTo: '',
  status: '',
  fullName: '',
  groupCode: '',
  bookingId: '',
  email: '',
  roomName: '',
  page: 1,
  limit: 10
})

const totalPages = computed(() => Math.ceil(totalLogs.value / filters.value.limit))

const formatDate = (isoString) => {
  if (!isoString) return '—'
  const date = new Date(isoString)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const toggleDetails = (id) => {
  const index = expandedLogIds.value.indexOf(id)
  if (index > -1) {
    expandedLogIds.value.splice(index, 1)
  } else {
    expandedLogIds.value.push(id)
  }
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    Object.keys(filters.value).forEach(key => {
      if (filters.value[key]) {
        params.append(key, filters.value[key])
      }
    })

    const res = await fetch(`http://localhost:3000/api/admin/logs?${params}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })

    if (res.ok) {
      const result = await res.json()
      logs.value = result.data || []
      totalLogs.value = result.total || 0
    }
  } catch (e) {
    console.error('Ошибка загрузки журнала:', e)
  } finally {
    loading.value = false
  }
}

const cancelBooking = async (bookingId) => {
  if (!confirm('Вы уверены, что хотите отменить это бронирование?')) return

  try {
    const res = await fetch(`http://localhost:3000/api/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    if (res.ok) {
      alert('Бронирование успешно отменено')
      fetchLogs()
    } else {
      const err = await res.json()
      alert('Ошибка: ' + (err.error || 'Не удалось отменить'))
    }
  } catch (e) {
    console.error('Ошибка при отмене:', e)
  }
}

let timeout = null
watch(filters, (newVal, oldVal) => {
  const pageChanged = newVal.page !== oldVal?.page
  clearTimeout(timeout)

  if (pageChanged) {
    fetchLogs()
  } else {
    timeout = setTimeout(() => {
      filters.value.page = 1
      fetchLogs()
    }, 500)
  }
}, { deep: true })

onMounted(fetchLogs)
</script>

<template>
  <div class="admin-logs">
    <div class="logs-filters extended">
      <div class="filter-row">
        <div class="filter-group">
          <label>Дата от</label>
          <input type="date" v-model="filters.dateFrom" class="filter-input" />
        </div>
        <div class="filter-group">
          <label>Дата до</label>
          <input type="date" v-model="filters.dateTo" class="filter-input" />
        </div>
        <div class="filter-group">
          <label>Статус</label>
          <select v-model="filters.status" class="filter-input">
            <option value="">Все</option>
            <option value="reserved">Забронировано</option>
            <option value="active">Активно</option>
            <option value="finished">Завершено</option>
            <option value="cancelled">Отменено</option>
            <option value="missed">Неявка</option>
          </select>
        </div>
        <div class="filter-group">
          <label>ID Брони</label>
          <input type="text" v-model="filters.bookingId" placeholder="book_..." class="filter-input" />
        </div>
      </div>

      <div class="filter-row mt-20">
        <div class="filter-group">
          <label>ФИО Студента</label>
          <input type="text" v-model="filters.fullName" placeholder="Иванов И.И." class="filter-input" />
        </div>
        <div class="filter-group">
          <label>Группа</label>
          <input type="text" v-model="filters.groupCode" placeholder="0000" class="filter-input" />
        </div>
        <div class="filter-group">
          <label>Email</label>
          <input type="text" v-model="filters.email" placeholder="example@..." class="filter-input" />
        </div>
        <div class="filter-group">
          <label>Аудитория</label>
          <input type="text" v-model="filters.roomName" placeholder="301-A" class="filter-input" />
        </div>
      </div>
    </div>

    <div class="table-container">
      <table class="logs-table">
        <thead>
        <tr>
          <th>ID / ДАТА</th>
          <th>ПОЛЬЗОВАТЕЛЬ</th>
          <th>АУДИТОРИЯ</th>
          <th>СТАТУС</th>
          <th class="text-right">ДЕЙСТВИЕ</th>
        </tr>
        </thead>
        <tbody>
        <template v-for="log in logs" :key="log.id">
          <tr :class="{ 'is-expanded': expandedLogIds.includes(log.id) }">
            <td class="id-cell">
              <span class="date-text">{{ formatDate(log.date) }}</span>
              <span class="id-text">#{{ log.id }}</span>
            </td>
            <td>
              <div class="user-info">
                <strong>{{ log.user_name }}</strong>
                <span>{{ log.user_email }} (гр. {{ log.group_code || '—' }})</span>
              </div>
            </td>
            <td>
              <div class="room-info">
                <strong>{{ log.room_name }}</strong>
                <span>{{ log.pc_name }}</span>
              </div>
            </td>
            <td>
              <span :class="['status-badge', log.status]">{{ log.statusText }}</span>
            </td>
            <td class="text-right">
              <button class="btn-details" @click="toggleDetails(log.id)">
                {{ expandedLogIds.includes(log.id) ? 'Закрыть' : 'Детали' }}
                <span :class="['arrow', { active: expandedLogIds.includes(log.id) }]">▼</span>
              </button>
            </td>
          </tr>

          <tr v-if="expandedLogIds.includes(log.id)" class="details-row">
            <td colspan="5">
              <div class="timeline-container">
                <div class="timeline-item creation">
                  <div class="t-time">{{ formatTime(log.created_at) }}</div>
                  <div class="t-content">
                    <strong>Бронирование создано</strong>
                    <span class="t-author">Дата создания: {{ formatDate(log.created_at) }}</span>
                  </div>
                </div>

                <div v-for="(event, idx) in log.history" :key="idx" class="timeline-item">
                  <div class="t-time">{{ formatTime(event.changed_at) }}</div>
                  <div class="t-content">
                      <span class="t-status">
                        <span class="old-st">{{ event.old_status }}</span>
                        <span class="arrow-right">→</span>
                        <strong class="new-st">{{ event.new_status }}</strong>
                      </span>
                    <span class="t-author">Кем: {{ event.changed_by.split('/')[1] }}</span>
                  </div>
                </div>

                <div class="timeline-footer">
                  <div class="current-status-info">
                    Текущий статус: <span :class="['status-badge-mini', log.status]">{{ log.statusText }}</span>
                  </div>
                  <button v-if="log.status === 'reserved'" class="btn-cancel-booking" @click="cancelBooking(log.id)">
                    Отменить бронирование
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </template>
        </tbody>
      </table>
      <div v-if="loading" class="table-loading">Загрузка...</div>
    </div>

    <BasePagination :page="filters.page" :totalPages="totalPages" @update:page="filters.page = $event" />
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/pages/admin-logs";
</style>
