<template>
  <div class="profile-page" v-if="!loading">
    <header class="profile-header">
      <h1>Профиль</h1>
      <div class="user-badges">
        <span class="badge">ID: {{ user?._key }}</span>
        <span class="badge">Группа: {{ user?.group_code || 'N/A' }}</span>
        <span :class="['badge', authStore.isAdmin ? 'role-admin' : 'role-student']">
          {{ authStore.isAdmin ? 'Администратор' : 'Студент' }}
        </span>
      </div>
    </header>

    <div class="stats-grid" v-if="!authStore.isAdmin">
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
            <input v-model="emailForm.email" type="email" placeholder="example@mail.ru" required />
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
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const user = ref(null)
const loading = ref(true)
const stats = ref({ total: 0, active: 0, cancelled: 0 })

const emailForm = ref({ email: '' })
const passwordForm = ref({ new: '', confirm: '' })

const fetchProfile = async () => {
  loading.value = true
  try {
    const res = await fetch('http://localhost:3000/api/profile/me', {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (res.ok) user.value = await res.json()

    if (!authStore.isAdmin) {
      const [all, active, archive] = await Promise.all([
        fetch('http://localhost:3000/api/bookings?type=all&limit=1', { headers: { 'Authorization': `Bearer ${authStore.token}` }}).then(r => r.json()),
        fetch('http://localhost:3000/api/bookings?type=active&limit=1', { headers: { 'Authorization': `Bearer ${authStore.token}` }}).then(r => r.json()),
        fetch('http://localhost:3000/api/bookings?type=archive&limit=1', { headers: { 'Authorization': `Bearer ${authStore.token}` }}).then(r => r.json())
      ])
      stats.value = { 
        total: all.total || 0, 
        active: active.total || 0, 
        cancelled: archive.total || 0 
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const updateEmail = async () => {
  if (!emailForm.value.email) return;
  
  try {
    const res = await fetch('http://localhost:3000/api/profile/me', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: emailForm.value.email })
    });

    const data = await res.json();

    if (res.ok) {
      alert('Email успешно обновлен');
      user.value.email = emailForm.value.email;
      emailForm.value.email = '';
      
      authStore.user.email = data.user.email; 
      localStorage.setItem('user', JSON.stringify(authStore.user));
    } else {
      alert(data.message || 'Ошибка при обновлении email');
    }
  } catch (e) {
    console.error(e);
    alert('Ошибка соединения с сервером');
  }
}

const updatePassword = async () => {
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    alert('Пароли не совпадают!');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/profile/me', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: passwordForm.value.new })
    });

    const data = await res.json();

    if (res.ok) {
      alert('Пароль успешно изменен');
      passwordForm.value.new = '';
      passwordForm.value.confirm = '';
    } else {
      alert(data.message || 'Ошибка при смене пароля');
    }
  } catch (e) {
    console.error(e);
  }
}

onMounted(fetchProfile)
</script>

<style lang="scss">
@use "@/assets/scss/pages/user_profile";
</style>