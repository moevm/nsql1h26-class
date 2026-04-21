<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()
const authStore = useAuthStore()

const onLogin = async () => {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    })

    if (!response.ok) throw new Error('Неверный логин или пароль')

    const data = await response.json()
    
    // Сохраняем данные в store
    authStore.setAuth(data.token, data.user)

    // Перенаправляем в зависимости от роли
    if (data.user.is_admin) {
      router.push('/admin')
    } else {
      router.push('/')
    }
  } catch (err) {
    error.value = 'Ошибка входа'
  }
}
</script>

<template>
  <div class="login-layout">
    <div class="form-section">
      <div class="form-container">
        <h2>ВХОД В СИСТЕМУ</h2>
        <p v-if="error" style="color: red;">{{ error }}</p>
        
        <form @submit.prevent="onLogin">
          <div class="input-group">
            <label>EMAIL</label>
            <input type="email" v-model="email" placeholder="student@university.edu" required />
          </div>
          <div class="input-group">
            <label>ПАРОЛЬ</label>
            <input type="password" v-model="password" placeholder="********" required />
          </div>
          <button type="submit" class="btn-submit">ВОЙТИ</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @use "@/assets/scss/pages/login";
</style>