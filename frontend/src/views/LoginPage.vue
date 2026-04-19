<template>
  <div class="login-layout">
    <div class="info-section">
      <div class="bottom-text">
        <p class="breadcrumb">ЭЛЕКТРОННАЯ ОЧЕРЕДЬ - АВТОРИЗАЦИЯ</p>
        <h1>ЛИЧНЫЙ КАБИНЕТ</h1>
      </div>
    </div>

    <div class="form-section">
      <div class="form-container">
        <h2>ВХОД В СИСТЕМУ</h2>
        
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
        <div class="register-link">
          <p>Нет аккаунта? <a href="#">Зарегистрироваться</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')

const onLogin = () => {
  console.log('Данные формы:', {
    email: email.value,
    password: password.value
  })
}
</script>

<style lang="scss" scoped>
  @use "@/assets/scss/pages/login";
</style>