<template>
  <div class="admin-layout">
    <header class="header">
      <div class="header-left">
        <div class="logo-icon">UB</div>
        <div class="app-name">UniBooking</div>
        <div class="admin-badge">Admin Panel</div>
      </div>
      <div class="header-right">
        <nav class="top-nav">
          <RouterLink to="/admin" exact-active-class="active">Дашборд</RouterLink>
          <a href="#">Пользователи</a>
          <a href="#">Классы</a>
        </nav>
        <div class="user-profile">
          <span>Администратор</span>
          <div class="user-avatar">А</div>
        </div>
      </div>
    </header>

    <main class="container">
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss" scoped>
  @use "@/assets/scss/pages/admin-header";
</style>