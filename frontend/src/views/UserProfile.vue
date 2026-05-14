<template>
  <div class="profile-page" v-if="!loading">
    <header class="profile-header">
      <div class="title-area">
        <h1>{{ isAdminViewingOthers ? 'Управление пользователем' : 'Мой профиль' }}</h1>
        <h2 class="user-fullname">{{ user?.full_name }}</h2>
      </div>
      <div class="user-badges">
        <span class="badge">Группа: {{ user?.group_code || 'N/A' }}</span>
        <span :class="['badge', user?.is_admin ? 'role-admin' : 'role-student']">
          {{ user?.is_admin ? 'Администратор' : 'Студент' }}
        </span>
      </div>
    </header>

    <div class="info-grid">
      <div class="info-card meta-info">
        <h3>Системная информация</h3>
        <div class="info-item">
          <label>ID пользователя:</label>
          <span>{{ user?._key }}</span>
        </div>
        <div class="info-item">
          <label>Дата регистрации:</label>
          <span>{{ formatDate(user?.meta?.created_at) }}</span>
        </div>
        <div class="info-item">
          <label>Последний вход:</label>
          <span>{{ formatDate(user?.meta?.last_login) }}</span>
        </div>
      </div>
    </div>

    <div class="stats-grid" v-if="!isAdminViewingOthers">
      <div class="stat-card total">
        <label>Всего бронирований</label>
        <div class="value">{{ stats.total }}</div>
      </div>
      <div class="stat-card active">
        <label>Активных сейчас</label>
        <div class="value">{{ stats.active }}</div>
      </div>
      <div class="stat-card cancelled">
        <label>Отменено</label>
        <div class="value">{{ stats.cancelled }}</div>
      </div>
    </div>

    <div class="settings-grid">
      <section class="settings-card">
        <h3>Изменить почту</h3>
        <label>Текущий Email</label>
        <div class="current-info"><strong>{{ user?.email }}</strong></div>
        <form @submit.prevent="updateEmail">
          <div class="form-group">
            <label>Новый Email</label>
            <input v-model="emailForm.email" type="email" placeholder="example@uni.edu" required />
          </div>
          <button type="submit" class="btn-submit">Обновить почту</button>
        </form>
      </section>

      <section class="settings-card">
        <h3>Безопасность</h3>
        <form @submit.prevent="updatePassword">
          <div class="form-group">
            <label>Новый пароль</label>
            <input v-model="passwordForm.new" type="password" placeholder="••••••••" required />
          </div>
          <div class="form-group">
            <label>Подтвердите пароль</label>
            <input v-model="passwordForm.confirm" type="password" placeholder="••••••••" required />
          </div>
          <button type="submit" class="btn-submit">Сменить пароль</button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const user = ref(null)
const loading = ref(true)
const stats = ref({ total: 0, active: 0, cancelled: 0 })

const emailForm = ref({ email: '' })
const passwordForm = ref({ new: '', confirm: '' })

// Определяем, редактируем ли мы чужой профиль через админку
const userIdFromRoute = computed(() => route.params.id)
const isAdminViewingOthers = computed(() => !!userIdFromRoute.value && authStore.isAdmin)

// Форматирование даты из ISO в читаемый вид
const formatDate = (isoString) => {
  if (!isoString) return 'Нет данных'
  return new Date(isoString).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getBaseUrl = () => {
  return isAdminViewingOthers.value
    ? `http://localhost:3000/api/admin/users/${userIdFromRoute.value}`
    : `http://localhost:3000/api/profile/me`
}

const fetchProfile = async () => {
  loading.value = true
  try {
    const res = await fetch(getBaseUrl(), {
      headers: { 
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (res.ok) {
      user.value = await res.json()
      // Статистику грузим только для своего профиля
      if (!isAdminViewingOthers.value) {
        await fetchStats()
      }
    }
  } catch (e) {
    console.error('Ошибка загрузки:', e)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const headers = { 'Authorization': `Bearer ${authStore.token}` }
    const [all, active, archive] = await Promise.all([
      fetch('http://localhost:3000/api/bookings?type=all&limit=1', { headers }).then(r => r.json()),
      fetch('http://localhost:3000/api/bookings?type=active&limit=1', { headers }).then(r => r.json()),
      fetch('http://localhost:3000/api/bookings?type=archive&limit=1', { headers }).then(r => r.json())
    ])
    stats.value = {
      total: all.total || 0,
      active: active.total || 0,
      cancelled: archive.total || 0
    }
  } catch (e) {
    console.warn('Статистика недоступна')
  }
}

const updateEmail = async () => {
  try {
    const res = await fetch(getBaseUrl(), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: emailForm.value.email })
    })

    if (res.ok) {
      alert('Email успешно обновлен')
      user.value.email = emailForm.value.email
      if (!isAdminViewingOthers.value) {
        authStore.user.email = emailForm.value.email
        localStorage.setItem('user', JSON.stringify(authStore.user))
      }
      emailForm.value.email = ''
    }
  } catch (e) {
    alert('Ошибка при обновлении')
  }
}

const updatePassword = async () => {
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    alert('Пароли не совпадают')
    return
  }
  try {
    const res = await fetch(getBaseUrl(), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: passwordForm.value.new })
    })
    if (res.ok) {
      alert('Пароль успешно изменен')
      passwordForm.value.new = ''
      passwordForm.value.confirm = ''
    }
  } catch (e) {
    alert('Ошибка сервера')
  }
}

watch(() => route.params.id, () => fetchProfile())
onMounted(fetchProfile)
</script>

<style lang="scss">
@use "@/assets/scss/pages/user_profile";
</style>