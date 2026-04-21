<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const equipment = ref([])
const totalEquipment = ref(0)
const loading = ref(true)

const isModalOpen = ref(false)
const isEditMode = ref(false)
const currentEquipment = ref({
  _key: '',
  inv_number: '',
  room_id: '',
  seat_index: '',
  mac_address: '',
  specs: {},
  software: [],
  admin_notes: '',
  status: 'active'
})

const filters = ref({
  search: '',
  status: '',
  room_id: '',
  page: 1,
  limit: 999
})

watch(filters, () => {
  fetchEquipment()
}, { deep: true })

const fetchEquipment = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      search: filters.value.search,
      status: filters.value.status,
      room_id: filters.value.room_id,
      page: filters.value.page,
      limit: filters.value.limit
    })

    const response = await fetch(`http://localhost:3000/api/admin/equipment?${params}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

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
    specs: {},
    software: [],
    admin_notes: '',
    status: 'active'
  }
  isModalOpen.value = true
}

const openEditModal = (item) => {
  isEditMode.value = true
  currentEquipment.value = { ...item }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const saveEquipment = async () => {
  try {
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
      body: JSON.stringify({
        inv_number: currentEquipment.value.inv_number,
        room_id: currentEquipment.value.room_id,
        seat_index: currentEquipment.value.seat_index,
        mac_address: currentEquipment.value.mac_address,
        status: currentEquipment.value.status,
        admin_notes: currentEquipment.value.admin_notes,
        specs: currentEquipment.value.specs || {},
        software: currentEquipment.value.software || [],
        created_by: `Users/${authStore.user?.id || 'admin'}`
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    await fetchEquipment()
    closeModal()
  } catch (error) {
    console.error('Error saving equipment:', error)
    alert('Ошибка при сохранении оборудования')
  }
}

const deleteEquipment = async (id) => {
  if (!confirm('Вы уверены, что хотите удалить это оборудование?')) return

  try {
    const response = await fetch(`http://localhost:3000/api/admin/equipment/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    await fetchEquipment()
  } catch (error) {
    console.error('Error deleting equipment:', error)
    alert('Ошибка при удалении оборудования')
  }
}

onMounted(() => {
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
      <input v-model="filters.search" placeholder="Поиск по инв. номеру, MAC..." class="search-input">
      <select v-model="filters.status" class="filter-select">
        <option value="">Все статусы</option>
        <option value="active">Активное</option>
        <option value="inactive">Неактивное</option>
        <option value="maintenance">На обслуживании</option>
      </select>
      <input v-model="filters.room_id" placeholder="ID аудитории" class="filter-input">
    </div>

    <div class="equipment-list">
      <div v-if="loading" class="loading">Загрузка...</div>
      <div v-else-if="!equipment || equipment.length === 0" class="no-data">Оборудование не найдено</div>
      <div v-else class="equipment-grid">
        <div v-for="item in equipment" :key="item._key || item.id" class="equipment-card">
          <div class="equipment-info">
            <h3>{{ item.inv_number }}</h3>
            <p>Место: {{ item.seat_index }}</p>
            <p>MAC: {{ item.mac_address }}</p>
            <p>Статус: {{ item.status }}</p>
          </div>
          <div class="equipment-actions">
            <button @click="openEditModal(item)" class="btn-secondary">Редактировать</button>
            <button @click="deleteEquipment(item._key || item.id)" class="btn-danger">Удалить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно для создания/редактирования -->
    <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ isEditMode ? 'Редактировать оборудование' : 'Добавить оборудование' }}</h2>
        <form @submit.prevent="saveEquipment">
          <div class="form-group">
            <label>Инвентарный номер:</label>
            <input v-model="currentEquipment.inv_number" required>
          </div>
          <div class="form-group">
            <label>ID аудитории:</label>
            <input v-model="currentEquipment.room_id" required>
          </div>
          <div class="form-group">
            <label>Номер места:</label>
            <input v-model.number="currentEquipment.seat_index" type="number" required>
          </div>
          <div class="form-group">
            <label>MAC адрес:</label>
            <input v-model="currentEquipment.mac_address">
          </div>
          <div class="form-group">
            <label>Статус:</label>
            <select v-model="currentEquipment.status">
              <option value="active">Активное</option>
              <option value="inactive">Неактивное</option>
              <option value="maintenance">На обслуживании</option>
            </select>
          </div>
          <div class="form-group">
            <label>Заметки администратора:</label>
            <textarea v-model="currentEquipment.admin_notes"></textarea>
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