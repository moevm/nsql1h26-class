<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = ref({
  full_name: '',
  email: '',
  password: '',
  group_code: ''
})
const error = ref('')

const onRegister = async () => {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Ошибка регистрации')

    alert('Успешно! Теперь войдите в систему.')
    router.push('/login')
  } catch (err) {
    error.value = err.message
  }
}
</script>

<template>
  <div class="login-layout"> <div class="form-section">
      <div class="form-container">
        <h2>РЕГИСТРАЦИЯ</h2>
        <p v-if="error" class="error-msg" style="color: #ff4d4d; font-weight: 800; margin-bottom: 15px;">
          {{ error }}
        </p>

        <form @submit.prevent="onRegister">
          <div class="input-group">
            <label>ФИО</label>
            <input v-model="form.full_name" type="text" placeholder="Иванов Иван" required />
          </div>
          <div class="input-group">
            <label>ГРУППА</label>
            <input v-model="form.group_code" type="text" placeholder="4303" />
          </div>
          <div class="input-group">
            <label>EMAIL</label>
            <input v-model="form.email" type="email" placeholder="student@university.edu" required />
          </div>
          <div class="input-group">
            <label>ПАРОЛЬ</label>
            <input v-model="form.password" type="password" placeholder="••••••••" required />
          </div>

          <button type="submit" class="login-btn">СОЗДАТЬ АККАУНТ</button>
        </form>

        <div class="footer-links">
          <span>Уже есть аккаунт? </span>
          <RouterLink to="/login">Войти</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
  @use "@/assets/scss/pages/registration";
</style>