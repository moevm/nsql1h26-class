<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BasePagination from '@/components/BasePagination.vue'

const authStore = useAuthStore()
const rooms = ref([])
const availableComputers = ref([])
const unassignedPool = ref([])
const totalRooms = ref(0)
const loading = ref(true)

const isModalOpen = ref(false)
const isEditMode = ref(false)
const currentRoom = ref({
  _key: '',
  name: '',
  description: '',
  grid: { rows: 4, cols: 4 },
  tags: []
})

const tagsInput = ref('')
const roomLayout = ref({})

const isSelectingPC = ref(false)
const activeCell = ref(null)

const roomTagFilters = ref([])
const roomTagInput = ref('')

const addRoomFilterTag = () => {
  const val = roomTagInput.value.trim()
  if (val && !roomTagFilters.value.includes(val)) {
    roomTagFilters.value.push(val)
  }
  roomTagInput.value = ''
}

const removeRoomFilterTag = (idx) => {
  roomTagFilters.value.splice(idx, 1)
}

const filters = ref({
  name: '',
  description: '',
  page: 1,
  limit: 8
})

const totalPages = computed(() => Math.ceil(totalRooms.value / filters.value.limit))

watch(filters, () => {
  fetchRooms()
}, { deep: true })

watch(roomTagFilters, () => {
  filters.value.page = 1
  fetchRooms()
}, { deep: true })

const filteredAvailableComputers = computed(() => {
  const assignedIds = new Set(
    Object.values(roomLayout.value).map(pc => pc._key || pc.id)
  )

  const all = [...availableComputers.value, ...unassignedPool.value]

  const map = new Map()
  for (const pc of all) {
    const id = pc._key || pc.id
    if (!assignedIds.has(id)) {
      map.set(id, pc)
    }
  }

  return Array.from(map.values())
})

const fetchRooms = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      name: filters.value.name,
      description: filters.value.description,
      tag: roomTagFilters.value.join(','),
      page: filters.value.page,
      limit: filters.value.limit
    }).toString();

    const res = await fetch(`http://localhost:3000/api/admin/rooms?${params}`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    if (res.ok) {
      const result = await res.json()
      rooms.value = result.data || []
      totalRooms.value = result.total || 0
    }
  } catch (e) {
    console.error('Ошибка загрузки комнат:', e)
  } finally {
    loading.value = false
  }
}

const fetchAvailableComputers = async () => {
  try {
    const res = await fetch(`http://localhost:3000/api/rooms/pcs/available`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (res.ok) {
      availableComputers.value = await res.json()
    }
  } catch (e) {
    console.error('Ошибка загрузки доступных ПК:', e)
  }
}

const openCreateModal = () => {
  isEditMode.value = false
  unassignedPool.value = []
  currentRoom.value = {
    name: '',
    description: '',
    grid: { rows: 4, cols: 4 },
    tags: []
  }
  tagsInput.value = ''
  roomLayout.value = {}
  isModalOpen.value = true
}

const openEditModal = async (room) => {
  isEditMode.value = true
  unassignedPool.value = []
  currentRoom.value = JSON.parse(JSON.stringify(room))
  tagsInput.value = room.tags ? room.tags.join(', ') : ''

  try {
    const res = await fetch(`http://localhost:3000/api/rooms/${room._key}`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (res.ok) {
      const data = await res.json()
      const layout = {}
      if (data.pcs) {
        data.pcs.forEach(pc => {
          if (pc.seat_index !== undefined && pc.seat_index !== null) {
            const r = Math.floor((pc.seat_index - 1) / currentRoom.value.grid.cols)
            const c = (pc.seat_index - 1) % currentRoom.value.grid.cols
            layout[`${r}-${c}`] = pc
          }
        })
      }
      roomLayout.value = layout
    }
  } catch (e) {
    console.error('Ошибка загрузки деталей аудитории:', e)
  }
  isModalOpen.value = true
}

const handleCellClick = (r, c) => {
  activeCell.value = { r, c }
  isSelectingPC.value = true
  fetchAvailableComputers()
}

const assignPC = (pc) => {
  const key = `${activeCell.value.r}-${activeCell.value.c}`
  roomLayout.value = { ...roomLayout.value, [key]: { ...pc } }
  isSelectingPC.value = false
}

const unassignPC = () => {
  const key = `${activeCell.value.r}-${activeCell.value.c}`
  const pc = roomLayout.value[key]
  if (pc) {
    unassignedPool.value.push(pc)
  }
  const newLayout = { ...roomLayout.value }
  delete newLayout[key]
  roomLayout.value = newLayout
  isSelectingPC.value = false
}

const saveRoom = async () => {
  if (!currentRoom.value.name?.trim()) {
    alert('Название аудитории обязательно')
    return
  }

  const { _key, ...roomData } = currentRoom.value
  const payload = {
    ...roomData,
    tags: tagsInput.value.split(',').map(t => t.trim()).filter(t => t),
    layout: Object.entries(roomLayout.value).map(([coord, pc]) => {
      const [r, c] = coord.split('-').map(Number)
      return {
        pc_id: pc._key || pc.id,
        seat_index: r * currentRoom.value.grid.cols + c + 1
      }
    })
  }

  const url = isEditMode.value
    ? `http://localhost:3000/api/admin/rooms/${currentRoom.value._key}`
    : `http://localhost:3000/api/admin/rooms`

  try {
    const res = await fetch(url, {
      method: isEditMode.value ? 'PUT' : 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      isModalOpen.value = false
      fetchRooms()
    } else {
      const errorData = await res.json()
      alert('Ошибка при сохранении: ' + (errorData.error || 'Неизвестная ошибка'))
    }
  } catch (e) {
    console.error(e)
    alert('Сетевая ошибка при сохранении')
  }
}

const deleteRoom = async (id) => {
  if (!confirm('Вы уверены, что хотите удалить аудиторию? Все компьютеры будут отвязаны.')) return
  try {
    const res = await fetch(`http://localhost:3000/api/admin/rooms/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (res.ok) {
      fetchRooms()
    }
  } catch (e) {
    console.error('Ошибка при удалении:', e)
  }
}

onMounted(() => {
  fetchRooms()
})
</script>

<<template>
  <div class="admin-rooms-page">
    <div class="page-header">
      <div class="title-block">
        <h1>Управление аудиториями</h1>
        <p>Настройка посадочных мест и конфигурация оборудования</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        <span>+</span> Добавить аудиторию
      </button>
    </div>

    <div class="filters">
      <input
        v-model="filters.name"
        placeholder="Поиск по названию..."
        class="filter-input"
      />
      <input
        v-model="filters.description"
        placeholder="Поиск по описанию..."
        class="filter-input"
      />
      <div class="chips-filter">
        <div class="chips-list">
          <span v-for="(tag, idx) in roomTagFilters" :key="tag" class="chip">
            {{ tag }}
            <button @click="removeRoomFilterTag(idx)" class="chip-remove">×</button>
          </span>
          <input
            v-model="roomTagInput"
            @keydown.enter.prevent="addRoomFilterTag"
            placeholder="Фильтр по тегам (Enter)"
            class="chip-input"
          />
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">Загрузка данных...</div>

    <div v-else class="rooms-grid">
      <div v-for="room in rooms" :key="room._key" class="room-card">
        <div class="card-content">
          <div class="room-header">
            <h3>{{ room.name }}</h3>
            <span class="grid-badge">{{ room.grid.rows }}x{{ room.grid.cols }}</span>
          </div>
          <p class="description">{{ room.description || 'Описание отсутствует' }}</p>
          <div class="tags-list">
            <span v-for="tag in room.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn-edit" @click="openEditModal(room)">Настроить</button>
          <button class="btn-delete" @click="deleteRoom(room._key)">Удалить</button>
        </div>
      </div>

      <div v-if="rooms.length === 0" class="empty-rooms">
        Аудитории не найдены. Попробуйте изменить фильтры.
      </div>
    </div>

    <BasePagination :page="filters.page" :totalPages="totalPages" @update:page="filters.page = $event" />

    <div v-if="isModalOpen" class="modal-overlay" @click.self="isModalOpen = false">
      <div class="editor-modal">
        <div class="settings-sidebar">
          <h2>{{ isEditMode ? 'Редактирование' : 'Новая аудитория' }}</h2>

          <div class="form-group">
            <label>Название аудитории <span class="req">*</span></label>
            <input v-model="currentRoom.name" placeholder="Напр: 404 Кванториум" />
          </div>

          <div class="form-group">
            <label>Описание</label>
            <textarea v-model="currentRoom.description" placeholder="Краткая информация..."></textarea>
          </div>

          <div class="form-group">
            <label>Теги (через запятую)</label>
            <input v-model="tagsInput" placeholder="RTX 3070, i7, 16GB" />
          </div>

          <div class="grid-inputs">
            <div class="form-group">
              <label>Ряды <span class="req">*</span></label>
              <input type="number" v-model.number="currentRoom.grid.rows" min="1" max="10" />
            </div>
            <div class="form-group">
              <label>Столбцы <span class="req">*</span></label>
              <input type="number" v-model.number="currentRoom.grid.cols" min="1" max="10" />
            </div>
          </div>

          <div class="sidebar-footer">
            <button class="btn-save" @click="saveRoom">Сохранить изменения</button>
            <button class="btn-cancel" @click="isModalOpen = false">Отмена</button>
          </div>
        </div>

        <div class="grid-preview">
          <div class="matrix-container" :style="{
            gridTemplateRows: `repeat(${currentRoom.grid.rows}, 1fr)`,
            gridTemplateColumns: `repeat(${currentRoom.grid.cols}, 1fr)`
          }">
            <template v-for="r in currentRoom.grid.rows" :key="'row-'+r">
              <div
                v-for="c in currentRoom.grid.cols"
                :key="'col-'+c"
                class="seat-cell"
                :class="{
                  'has-pc': roomLayout[`${r-1}-${c-1}`],
                  'pc-broken': roomLayout[`${r-1}-${c-1}`]?.status && roomLayout[`${r-1}-${c-1}`].status !== 'active'
                }"
                @click="handleCellClick(r-1, c-1)"
              >
                <span class="seat-index">{{ (r-1) * currentRoom.grid.cols + c }}</span>
                <div v-if="roomLayout[`${r-1}-${c-1}`]" class="pc-indicator">
                  <span class="pc-name">{{ roomLayout[`${r-1}-${c-1}`].inv_number || roomLayout[`${r-1}-${c-1}`]._key }}</span>
                  <span class="pc-status" :class="roomLayout[`${r-1}-${c-1}`].status">{{ roomLayout[`${r-1}-${c-1}`].status || 'active' }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isSelectingPC" class="modal-overlay dark" @click.self="isSelectingPC = false">
      <div class="pc-selector-card">
        <div class="selector-header">
          <h3>Место №{{ activeCell.r * currentRoom.grid.cols + activeCell.c + 1 }}</h3>
          <button class="close-icon" @click="isSelectingPC = false">✕</button>
        </div>

        <div v-if="roomLayout[`${activeCell.r}-${activeCell.c}`]" class="current-assignment">
          <div class="pc-card-detailed">
            <div class="header">
              <span class="pc-id-label">Инв. №</span>
              <h4>{{ roomLayout[`${activeCell.r}-${activeCell.c}`].inv_number || roomLayout[`${activeCell.r}-${activeCell.c}`]._key }}</h4>
            </div>
            <div class="specs-summary">
              <div class="spec-pill"><span>ID</span>{{ roomLayout[`${activeCell.r}-${activeCell.c}`]._key }}</div>
              <div class="spec-pill"><span>Статус</span>{{ roomLayout[`${activeCell.r}-${activeCell.c}`].status || 'active' }}</div>
              <div class="spec-pill" v-if="roomLayout[`${activeCell.r}-${activeCell.c}`].mac_address">
                <span>MAC</span>{{ roomLayout[`${activeCell.r}-${activeCell.c}`].mac_address }}
              </div>
              <div class="spec-pill" v-if="roomLayout[`${activeCell.r}-${activeCell.c}`].specs?.cpu">
                <span>CPU</span>{{ roomLayout[`${activeCell.r}-${activeCell.c}`].specs.cpu }}
              </div>
              <div class="spec-pill" v-if="roomLayout[`${activeCell.r}-${activeCell.c}`].specs?.gpu">
                <span>GPU</span>{{ roomLayout[`${activeCell.r}-${activeCell.c}`].specs.gpu }}
              </div>
              <div class="spec-pill" v-if="roomLayout[`${activeCell.r}-${activeCell.c}`].specs?.ram">
                <span>RAM</span>{{ roomLayout[`${activeCell.r}-${activeCell.c}`].specs.ram }}
              </div>
            </div>
            <button class="btn-detach" @click="unassignPC">Отвязать устройство</button>
          </div>
        </div>

        <div v-else class="available-selection">
          <p class="section-label">Доступные устройства:</p>
          <div class="pc-items-list">
            <div
              v-for="pc in filteredAvailableComputers"
              :key="pc._key"
              class="pc-list-item"
              @click="assignPC(pc)"
            >
              <div class="info">
                <strong>{{ pc.inv_number || pc._key }}</strong>
                <span class="id-line">ID: {{ pc._key }} · Статус: <span :class="['status-badge', pc.status]">{{ pc.status }}</span></span>
                <span class="specs-line">{{ pc.specs?.cpu || '—' }} · {{ pc.specs?.gpu || '—' }} · {{ pc.specs?.ram || '—' }}</span>
              </div>
              <div class="plus">+</div>
            </div>

            <div v-if="filteredAvailableComputers.length === 0" class="no-data">
              Нет свободных ПК в базе
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/pages/admin-rooms";
</style>
