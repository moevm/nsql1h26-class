<template>
  <header>
    <nav v-if="!$route.meta.hideNavbar">
      <RouterLink to="/">Главная</RouterLink> |
      <RouterLink to="/login">ieufb</RouterLink>
    </nav>
  </header>

  <RouterView />
</template>

<style scoped>
nav { padding: 20px; background: #2c3e50; color: white; }
nav a { color: #42b983; margin: 0 10px; text-decoration: none; }
</style>