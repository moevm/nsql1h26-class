<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BasePagination from "@/components/BasePagination.vue";

const authStore = useAuthStore()
const users = ref([])
const totalUsers = ref(0)
const loading = ref(true)

const filters = ref({
  full_name: '',
  email: '',
  group_code: '',
  role: ''
})

const currentPage = ref(1)
const itemsPerPage = 3

const totalPages = computed(() => Math.ceil(totalUsers.value / itemsPerPage))

const isModalOpen = ref(false)
const newUser = ref({
  full_name: '',
  email: '',
  password: '',
  is_admin: false,
  group_code: ''
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      full_name: filters.value.full_name,
      email: filters.value.email,
      group_code: filters.value.group_code,
      role: filters.value.role,
      page: currentPage.value.toString(),
      limit: itemsPerPage.toString()
    })

    const res = await fetch(`http://localhost:3000/api/admin/users?${params}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })

    if (res.ok) {
      const result = await res.json()
      users.value = result.data || []
      totalUsers.value = result.total || 0
    }
  } catch (e) {
    console.error('Fetch error:', e)
  } finally {
    loading.value = false
  }
}

let timeout = null
watch(filters, () => {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    currentPage.value = 1
    fetchUsers()
  }, 500)
}, { deep: true })

watch(currentPage, fetchUsers)

const createUser = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(newUser.value)
    })

    if (res.ok) {
      isModalOpen.value = false
      newUser.value = { full_name: '', email: '', password: '', is_admin: false, group_code: '' }
      fetchUsers()
    } else {
      const err = await res.json()
      alert(err.error || 'Ошибка при создании')
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(fetchUsers)
</script>

<template>
  <div class="admin-users-container">
    <div class="page-header">
      <div class="header-text">
        <h1>Управление доступом</h1>
        <p>Найдено записей: {{ totalUsers }}</p>
      </div>
      <button class="btn-add" @click="isModalOpen = true">
        <span>+</span> ДОБАВИТЬ ПОЛЬЗОВАТЕЛЯ
      </button>
    </div>

    <div class="filters-grid">
      <div class="filter-item">
        <label>ФИО</label>
        <input v-model="filters.full_name" type="text" placeholder="Поиск по имени..." />
      </div>
      <div class="filter-item">
        <label>Email</label>
        <input v-model="filters.email" type="text" placeholder="example@uni.edu" />
      </div>
      <div class="filter-item">
        <label>Группа</label>
        <input v-model="filters.group_code" type="text" placeholder="0000" />
      </div>
      <div class="filter-item">
        <label>Роль</label>
        <select v-model="filters.role">
          <option value="">Все</option>
          <option value="admin">Администраторы</option>
          <option value="user">Студенты</option>
        </select>
      </div>
    </div>

    <div class="table-wrapper">
      <table v-if="!loading">
        <thead>
        <tr>
          <th>ПОЛЬЗОВАТЕЛЬ</th>
          <th>ГРУППА</th>
          <th>РОЛЬ</th>
          <th>ПОСЛЕДНИЙ ВХОД</th>
          <th class="actions-head"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>
            <div class="user-cell">
              <div class="user-avatar">{{ user.full_name ? user.full_name[0] : '?' }}</div>
              <div class="user-meta">
                <div class="full-name">{{ user.full_name }}</div>
                <div class="email">{{ user.email }}</div>
              </div>
            </div>
          </td>
          <td><span class="group-code">{{ user.group_code || '—' }}</span></td>
          <td>
              <span :class="['role-badge', user.is_admin ? 'is-admin' : 'is-user']">
                {{ user.is_admin ? 'Администратор' : 'Студент' }}
              </span>
          </td>
          <td class="date-cell">
            {{ user.last_login ? new Date(user.last_login).toLocaleString() : 'Нет данных' }}
          </td>
          <td class="actions-cell">
            <router-link :to="'/admin/users/' + user.id" class="btn-profile">
              Открыть профиль
            </router-link>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- ПАГИНАЦИЯ -->
    <BasePagination :page="currentPage" :totalPages="totalPages" @update:page="currentPage = $event" />

    <div v-if="isModalOpen" class="modal-overlay" @click.self="isModalOpen = false">
      <div class="modal-content">
        <h2>Новый пользователь</h2>
        <form @submit.prevent="createUser">
          <div class="form-row">
            <div class="form-group">
              <label>ФИО</label>
              <input v-model="newUser.full_name" placeholder="Иванов Иван" required />
            </div>
            <div class="form-group">
              <label>Группа</label>
              <input v-model="newUser.group_code" placeholder="0000" />
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="newUser.email" type="email" required />
          </div>
          <div class="form-group">
            <label>Пароль</label>
            <input v-model="newUser.password" type="password" required />
          </div>
          <div class="form-group">
            <label>Роль</label>
            <select v-model="newUser.is_admin">
              <option :value="false">Студент</option>
              <option :value="true">Администратор</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="isModalOpen = false">Отмена</button>
            <button type="submit" class="btn-submit">Создать</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/pages/admin-users" as v;
</style>
