<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BasePagination from '@/components/BasePagination.vue'

const authStore = useAuthStore()
const equipment = ref([])
const totalEquipment = ref(0)
const loading = ref(true)
const rooms = ref([])

const isModalOpen = ref(false)
const isEditMode = ref(false)
const currentEquipment = ref({
  _key: '',
  inv_number: '',
  room_id: '',
  seat_index: '',
  mac_address: '',
  specs: { cpu: '', gpu: '', ram: '' },
  software: [],
  admin_notes: '',
  status: 'active'
})

const softwareNew = ref('')

const softwareFilterTags = ref([])
const softwareFilterInput = ref('')

const addSoftwareFilterTag = () => {
  const val = softwareFilterInput.value.trim()
  if (val && !softwareFilterTags.value.includes(val)) {
    softwareFilterTags.value.push(val)
  }
  softwareFilterInput.value = ''
}

const removeSoftwareFilterTag = (idx) => {
  softwareFilterTags.value.splice(idx, 1)
}

const filters = ref({
  search: '',
  status: '',
  room_id: '',
  page: 1,
  limit: 8
})

const totalPages = computed(() => Math.ceil(totalEquipment.value / filters.value.limit))

let searchTimeout = null
watch(() => filters.value.search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value.page = 1
    fetchEquipment()
  }, 400)
})

watch(() => [filters.value.status, filters.value.room_id], () => {
  filters.value.page = 1
  fetchEquipment()
})

watch(() => filters.value.page, () => {
  fetchEquipment()
})

watch(softwareFilterTags, () => {
  filters.value.page = 1
  fetchEquipment()
}, { deep: true })

const fetchRooms = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/rooms?page=1&limit=100', {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (res.ok) {
      const data = await res.json()
      rooms.value = data.data || []
    }
  } catch (e) {
    console.error('Ошибка загрузки аудиторий:', e)
  }
}

const fetchEquipment = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      search: filters.value.search,
      status: filters.value.status,
      room_id: filters.value.room_id,
      software: softwareFilterTags.value.join(','),
      page: filters.value.page,
      limit: filters.value.limit
    })

    const response = await fetch(`http://localhost:3000/api/admin/equipment?${params}`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const result = await response.json()
    equipment.value = result.data || []
    totalEquipment.value = result.total || 0
  } catch (error) {
    console.error('Error fetching equipment:', error)
    equipment.value = []
    totalEquipment.value = 0
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  isEditMode.value = false
  currentEquipment.value = {
    _key: '',
    inv_number: '',
    room_id: '',
    seat_index: '',
    mac_address: '',
    specs: { cpu: '', gpu: '', ram: '' },
    software: [],
    admin_notes: '',
    status: 'active'
  }
  softwareNew.value = ''
  isModalOpen.value = true
}

const openEditModal = (item) => {
  isEditMode.value = true
  currentEquipment.value = {
    ...item,
    specs: item.specs || { cpu: '', gpu: '', ram: '' },
    software: item.software || []
  }
  softwareNew.value = ''
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const addSoftware = () => {
  const val = softwareNew.value.trim()
  if (val && !currentEquipment.value.software.includes(val)) {
    currentEquipment.value.software.push(val)
  }
  softwareNew.value = ''
}

const removeSoftware = (idx) => {
  currentEquipment.value.software.splice(idx, 1)
}

const saveEquipment = async () => {
  try {
    const errors = []
    if (!currentEquipment.value.inv_number?.trim()) errors.push('Инвентарный номер обязателен')
    if (!currentEquipment.value.room_id) errors.push('Аудитория обязательна')
    if (currentEquipment.value.seat_index === '' || currentEquipment.value.seat_index === null || Number(currentEquipment.value.seat_index) < 0) {
      errors.push('Номер места обязателен')
    }
    if (errors.length) {
      alert(errors.join('\n'))
      return
    }

    const payload = {
      inv_number: currentEquipment.value.inv_number.trim(),
      room_id: currentEquipment.value.room_id,
      seat_index: Number(currentEquipment.value.seat_index),
      mac_address: currentEquipment.value.mac_address?.trim() || '',
      status: currentEquipment.value.status,
      admin_notes: currentEquipment.value.admin_notes?.trim() || '',
      specs: {
        cpu: currentEquipment.value.specs?.cpu?.trim() || '',
        gpu: currentEquipment.value.specs?.gpu?.trim() || '',
        ram: currentEquipment.value.specs?.ram?.trim() || ''
      },
      software: currentEquipment.value.software || []
    }

    if (!isEditMode.value) {
      payload.created_by = `Users/${authStore.user?._key || 'admin'}`
    }

    const equipmentId = currentEquipment.value._key || currentEquipment.value.id
    const url = isEditMode.value
      ? `http://localhost:3000/api/admin/equipment/${equipmentId}`
      : 'http://localhost:3000/api/admin/equipment'

    const method = isEditMode.value ? 'PATCH' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.message || `HTTP ${response.status}`)
    }

    await fetchEquipment()
    closeModal()
  } catch (error) {
    console.error('Error saving equipment:', error)
    alert('Ошибка при сохранении: ' + error.message)
  }
}

const deleteEquipment = async (id) => {
  if (!confirm('Вы уверены, что хотите удалить это оборудование?')) return
  try {
    const response = await fetch(`http://localhost:3000/api/admin/equipment/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    await fetchEquipment()
  } catch (error) {
    console.error('Error deleting equipment:', error)
    alert('Ошибка при удалении')
  }
}

onMounted(() => {
  fetchRooms()
  fetchEquipment()
})
</script>

<template>
  <div class="admin-equipment">
    <div class="header">
      <h1>Управление оборудованием</h1>
      <button @click="openCreateModal" class="btn-primary">Добавить оборудование</button>
    </div>

    <div class="filters">
      <input
        v-model="filters.search"
        placeholder="Поиск по инв. номеру, MAC..."
        class="search-input"
      >
      <select v-model="filters.status" class="filter-select">
        <option value="">Все статусы</option>
        <option value="active">Активное</option>
        <option value="maintenance">На обслуживании</option>
      </select>
      <select v-model="filters.room_id" class="filter-select">
        <option value="">Все аудитории</option>
        <option v-for="room in rooms" :key="room.id" :value="`Rooms/${room.id}`">
          {{ room.name }}
        </option>
      </select>

      <div class="chips-filter">
        <div class="chips-list">
          <span v-for="(tag, idx) in softwareFilterTags" :key="tag" class="chip">
            {{ tag }}
            <button type="button" @click="removeSoftwareFilterTag(idx)" class="chip-remove">×</button>
          </span>
          <input
            v-model="softwareFilterInput"
            @keydown.enter.prevent="addSoftwareFilterTag"
            placeholder="Фильтр по ПО (Enter)"
            class="chip-input"
          />
        </div>
      </div>
    </div>

    <div class="equipment-list">
      <div v-if="loading" class="loading">Загрузка...</div>
      <div v-else-if="!equipment.length" class="no-data">Оборудование не найдено</div>
      <div v-else class="equipment-grid">
        <div v-for="item in equipment" :key="item._key || item.id" class="equipment-card">
          <div class="equipment-info">
            <h3>{{ item.inv_number }}</h3>
            <div class="info-row">
              <span class="label">Место</span>
              <span class="value">{{ item.seat_index }}</span>
            </div>
            <div class="info-row">
              <span class="label">MAC</span>
              <span class="value">{{ item.mac_address || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Статус</span>
              <span :class="['status-badge', item.status]">{{ item.status }}</span>
            </div>
            <div class="info-row">
              <span class="label">Аудитория</span>
              <span class="value">{{ item.room_name || '—' }}</span>
            </div>

            <div v-if="item.meta" class="meta-block">
              <span class="meta-item" v-if="item.meta.created_at">
                Создано: {{ new Date(item.meta.created_at).toLocaleDateString('ru-RU') }}
              </span>
              <span class="meta-item" v-if="item.meta.created_by">
                Автор: {{ item.meta.created_by.split('/').pop() }}
              </span>
            </div>

            <div v-if="item.specs && (item.specs.cpu || item.specs.gpu || item.specs.ram)" class="specs-block">
              <div class="spec-tag" v-if="item.specs.cpu"><span>CPU</span>{{ item.specs.cpu }}</div>
              <div class="spec-tag" v-if="item.specs.gpu"><span>GPU</span>{{ item.specs.gpu }}</div>
              <div class="spec-tag" v-if="item.specs.ram"><span>RAM</span>{{ item.specs.ram }}</div>
            </div>

            <div v-if="item.software?.length" class="software-block">
              <span v-for="sw in item.software.slice(0, 4)" :key="sw" class="sw-tag">{{ sw }}</span>
              <span v-if="item.software.length > 4" class="sw-more">+{{ item.software.length - 4 }}</span>
            </div>
          </div>
          <div class="equipment-actions">
            <button @click="openEditModal(item)" class="btn-secondary">Редактировать</button>
            <button @click="deleteEquipment(item._key || item.id)" class="btn-danger">Удалить</button>
          </div>
        </div>
      </div>
    </div>

    <BasePagination :page="filters.page" :totalPages="totalPages" @update:page="filters.page = $event" />

    <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ isEditMode ? 'Редактировать оборудование' : 'Добавить оборудование' }}</h2>
        <form @submit.prevent="saveEquipment">
          <div class="form-group">
            <label>Инвентарный номер <span class="req">*</span></label>
            <input v-model="currentEquipment.inv_number" required placeholder="INV-2024-001">
          </div>

          <div class="form-row dual">
            <div class="form-group">
              <label>Аудитория <span class="req">*</span></label>
              <select v-model="currentEquipment.room_id" required>
                <option value="">Выберите аудиторию</option>
                <option v-for="room in rooms" :key="room.id" :value="`Rooms/${room.id}`">
                  {{ room.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Номер места <span class="req">*</span></label>
              <input v-model.number="currentEquipment.seat_index" type="number" min="0" required>
            </div>
          </div>

          <div class="form-group">
            <label>MAC адрес</label>
            <input v-model="currentEquipment.mac_address" placeholder="00:1B:44:11:3A:B7">
          </div>

          <div class="form-row triple">
            <div class="form-group">
              <label>CPU</label>
              <input v-model="currentEquipment.specs.cpu" placeholder="Intel i7-12700">
            </div>
            <div class="form-group">
              <label>GPU</label>
              <input v-model="currentEquipment.specs.gpu" placeholder="RTX 3060">
            </div>
            <div class="form-group">
              <label>RAM</label>
              <input v-model="currentEquipment.specs.ram" placeholder="16GB DDR4">
            </div>
          </div>

          <div class="form-group">
            <label>ПО</label>
            <div class="chips-filter">
              <div class="chips-list">
                <span v-for="(sw, idx) in currentEquipment.software" :key="idx" class="chip">
                  {{ sw }}
                  <button type="button" @click="removeSoftware(idx)" class="chip-remove">×</button>
                </span>
                <input
                  type="text"
                  v-model="softwareNew"
                  @keydown.enter.prevent="addSoftware"
                  placeholder="Добавить ПО (Enter)"
                  class="chip-input"
                />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Статус</label>
            <select v-model="currentEquipment.status">
              <option value="active">Активное</option>
              <option value="maintenance">На обслуживании</option>
            </select>
          </div>

          <div class="form-group">
            <label>Заметки администратора</label>
            <textarea v-model="currentEquipment.admin_notes" placeholder="Комментарий..."></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-secondary">Отмена</button>
            <button type="submit" class="btn-primary">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/pages/admin-equipment";
</style>
