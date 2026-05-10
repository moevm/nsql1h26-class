<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BasePagination from '@/components/BasePagination.vue'

const authStore = useAuthStore()
const rooms = ref([])
const myBookings = ref([])
const loading = ref(true)

const selectedDate = ref(new Date().toISOString().substr(0, 10))
const selectedPair = ref(1)

const totalRooms = ref(0)
const roomsPage = ref(1)
const roomsLimit = 6

const quickData = ref({
  date: new Date().toISOString().substr(0, 10),
  pair: 1,
  tags: ''
})

const isModalOpen = ref(false)
const selectedRoom = ref(null)
const selectedRoomComputers = ref([])
const selectedPC = ref(null)

const pairs = [
  { id: 1, time: '08:00 - 09:30' }, { id: 2, time: '09:50 - 11:20' },
  { id: 3, time: '11:40 - 13:10' }, { id: 4, time: '13:40 - 15:10' },
  { id: 5, time: '15:30 - 17:00' }, { id: 6, time: '17:20 - 18:50' },
  { id: 7, time: '19:00 - 20:30' }
]


const fetchAll = async () => {
  loading.value = true
  await Promise.all([fetchRooms(), fetchMyBookings()])
  loading.value = false
}

const fetchRooms = async () => {
  try {
    const res = await fetch(
      `http://localhost:3000/api/rooms?date=${selectedDate.value}&pair=${selectedPair.value}&page=${roomsPage.value}&limit=${roomsLimit}`,
      { headers: { 'Authorization': `Bearer ${authStore.token}` } }
    )
    const result = await res.json()
    rooms.value = result.data || []
    totalRooms.value = result.total || 0
  } catch (e) {
    console.error("Ошибка загрузки комнат:", e)
  }
}

const fetchMyBookings = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/bookings/my', {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (res.ok) {
      const data = await res.json()
      myBookings.value = data.filter(b => b.status !== 'cancelled')
    }
  } catch (e) { console.error("Ошибка загрузки броней:", e) }
}


const topBookings = computed(() => myBookings.value.slice(0, 2))

const totalPages = computed(() => Math.ceil(totalRooms.value / roomsLimit))
const displayedRooms = computed(() => rooms.value)

const formatTime = (isoString) => {
  if (!isoString) return ''
  return isoString.split('T')[1]?.slice(0, 5) || ''
}


watch([selectedDate, selectedPair], () => {
  roomsPage.value = 1
  fetchRooms()
})

watch(roomsPage, fetchRooms)

const openBooking = async (room) => {
  try {
    const roomId = room._key || room.id
    const res = await fetch(`http://localhost:3000/api/rooms/${roomId}?date=${selectedDate.value}&pair=${selectedPair.value}`, {
    headers: { 'Authorization': `Bearer ${authStore.token}` }
  })
    const data = await res.json()
    selectedRoom.value = data.room
    if (!selectedRoom.value.grid) {
      selectedRoom.value.grid = { rows: 1, cols: 1 }
    }
    selectedRoomComputers.value = data.pcs
    selectedPC.value = null
    isModalOpen.value = true
  } catch (e) { console.error(e) }
}

const selectSeat = (pc) => {
  if (pc.status === 'active') selectedPC.value = pc
}

const confirmBooking = async () => {
  if (!selectedPC.value) return

  const pcId = selectedPC.value._id || selectedPC.value.id || selectedPC.value._key;

  try {
    const res = await fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        pc_id: pcId,
        date: selectedDate.value,
        pair: Number(selectedPair.value)
      })
    })

    if (res.ok) {
      isModalOpen.value = false
      await fetchAll()
      alert('Успешно забронировано!')
    } else {
      const errorData = await res.json()
      alert('Ошибка: ' + errorData.error)
    }
  } catch (e) {
    console.error(e)
  }
}

const cancelBooking = async (id) => {
  if (!confirm('Вы уверены, что хотите отменить бронь?')) return
  try {
    const res = await fetch(`http://localhost:3000/api/bookings/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (res.ok) await fetchAll()
  } catch (e) { console.error(e) }
}

const handleQuickBook = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/bookings/quick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authStore.token}` },
      body: JSON.stringify(quickData.value)
    })
    const data = await res.json()
    if (res.ok) {
      alert(`Бронь создана на месте: ${data.pc_name}`)
      await fetchAll()
    } else {
      alert(data.error || 'Свободных мест не найдено')
    }
  } catch (e) { console.error(e) }
}

const gridSeats = computed(() => {
  if (!selectedRoom.value) return []

  const { rows, cols } = selectedRoom.value.grid
  const totalSlots = rows * cols

  const grid = []
  for (let i = 1; i <= totalSlots; i++) {
    const pc = selectedRoomComputers.value.find(p => p.seat_index === i)
    grid.push(pc || { seat_index: i, isPlaceholder: true })
  }
  return grid
})

onMounted(fetchAll)
</script>

<template>
  <div class="home-container" v-if="!loading">

    <div class="main-column">
      <!-- ФИЛЬТРЫ -->
      <section class="filters-bar">
        <div class="filter-group">
          <label>ВЫБЕРИТЕ ДАТУ</label>
          <input type="date" v-model="selectedDate" />
        </div>
        <div class="filter-group">
          <label>ВЫБЕРИТЕ ПАРУ</label>
          <select v-model="selectedPair">
            <option v-for="p in pairs" :key="p.id" :value="p.id">
              {{ p.id }} пара ({{ p.time }})
            </option>
          </select>
        </div>
      </section>

      <!-- СПИСОК АУДИТОРИЙ -->
      <div class="rooms-grid">
        <div v-for="room in displayedRooms" :key="room.id || room._key" class="room-card">
          <div class="room-header">
            <h3>{{ room.name }}</h3>
            <div class="tags">
              <span v-for="tag in room.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
          <div class="room-desc-container">
             <p class="desc">{{ room.description }}</p>
          </div>
          <div class="room-footer">
            <div class="status-info">
              <span class="label">ДОСТУПНОСТЬ</span>
              <span class="val">{{ room.available_seats }} / {{ room.total_seats }} мест</span>
            </div>
            <button class="btn-book-action" @click="openBooking(room)" :disabled="room.available_seats === 0">
              ВЫБРАТЬ МЕСТО
            </button>
          </div>
        </div>
      </div>

      <!-- ПАГИНАЦИЯ -->
      <BasePagination :page="roomsPage" :totalPages="totalPages" @update:page="roomsPage = $event" />

      <!-- БЫСТРОЕ БРОНИРОВАНИЕ -->
      <section class="quick-book-form">
        <div class="qb-header">
          <h3>БЫСТРОЕ БРОНИРОВАНИЕ</h3>
        </div>
        <div class="form-grid">
          <div class="f-group">
            <label>ДАТА</label>
            <input type="date" v-model="quickData.date" />
          </div>
          <div class="f-group">
            <label>ПАРА</label>
            <select v-model="quickData.pair">
              <option v-for="p in pairs" :key="p.id" :value="p.id">{{ p.id }} пара</option>
            </select>
          </div>
          <div class="f-group grow">
            <label>ТЕГИ (ЧЕРЕЗ ЗАПЯТУЮ)</label>
            <input type="text" v-model="quickData.tags" placeholder="Напр: Python, GPU, 3060" />
          </div>
          <button class="btn-accent" @click="handleQuickBook">НАЙТИ</button>
        </div>
      </section>
    </div>

    <!-- ПРАВАЯ ПАНЕЛЬ -->
    <aside class="side-panel">
      <div class="side-card">
        <div class="side-header">
          <h3>БЛИЖАЙШИЕ ЗАПИСИ</h3>
          <router-link to="/profile" class="link-all">Все</router-link>
        </div>

        <div v-if="topBookings.length === 0" class="empty-state">
          У вас пока нет активных бронирований.
        </div>

        <div v-for="b in topBookings" :key="b.booking_id" class="booking-ticket">
          <div class="ticket-content">
            <div class="b-header">
              <span class="b-room">{{ b.room_name }}</span>
              <span class="b-time">{{ formatTime(b.start_at) }}</span>
            </div>
            <div class="b-details">
              <span class="pc-label">Место:</span> {{ b.seat_index || b.pc_name }}
            </div>
          </div>
          <button class="btn-cancel" @click="cancelBooking(b.booking_id)">ОТМЕНИТЬ</button>
        </div>
      </div>
    </aside>

    <!-- МОДАЛКА ВЫБОРА -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="isModalOpen = false">
      <div class="modal-content">
        <button class="close-modal" @click="isModalOpen = false">✕</button>
        <header>
          <h2>{{ selectedRoom.name }}</h2>
          <p class="modal-subtitle">{{ selectedRoom.description }}</p>
        </header>

        <div class="pc-details-box" v-if="selectedPC">
          <div class="specs-grid">
            <div class="spec"><span>CPU</span> {{ selectedPC.specs?.cpu || '—' }}</div>
            <div class="spec"><span>GPU</span> {{ selectedPC.specs?.gpu || '—' }}</div>
            <div class="spec"><span>RAM</span> {{ selectedPC.specs?.ram || '—' }}</div>
          </div>
          <div class="software-list" v-if="selectedPC.software?.length">
            <span class="soft-label">Софт:</span>
            <div class="soft-tags">
              <span v-for="s in selectedPC.software" :key="s" class="soft-tag">{{ s }}</span>
            </div>
          </div>
        </div>
        <div v-else class="select-prompt">Выберите ПК на схеме</div>

        <div class="seats-layout">
          <!-- <pre>{{ selectedRoomComputers }}</pre> -->
          <div v-for="pc in gridSeats" :key="pc.id"
            :class="['seat-unit', { selected: selectedPC?.id === pc.id, occupied: pc.status !== 'active' }]"
            @click="selectSeat(pc)"
          >
            <div class="monitor"></div>
            <span class="num">{{ pc.seat_index }}</span>
          </div>
        </div>

        <button class="btn-confirm-final" :disabled="!selectedPC" @click="confirmBooking">
          {{ selectedPC ? `ЗАБРОНИРОВАТЬ ПК №${selectedPC.seat_index}` : 'ВЫБЕРИТЕ МЕСТО' }}
        </button>
      </div>
    </div>
  </div>

  <div v-else class="loader-container">
    <div class="spinner"></div>
    <p>Загрузка данных...</p>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/pages/home-view.scss";
</style>
