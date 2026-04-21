<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const onLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="user-layout">
    <header class="user-header">
      <div class="header-left">
        <nav class="nav-links">
          <RouterLink to="/" exact-active-class="active">Дашборд</RouterLink>
          <RouterLink to="/admin/users" active-class="active">Пользователи</RouterLink>
          <RouterLink to="/admin/rooms" active-class="active">Классы</RouterLink>
        </nav>
      </div>

      <div class="header-right">
        <RouterLink to="/profile" class="profile-link" title="Профиль">
            Я
        </RouterLink>
        <button @click="onLogout" class="logout-icon" title="Выйти">
          Выйти
        </button>
      </div>
    </header>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss">
@use "@/assets/scss/layouts/user-header";
</style>