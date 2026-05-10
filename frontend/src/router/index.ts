import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UserLayout from '../layouts/UserLayout.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import LoginPage from '../views/LoginPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { guestOnly: true }
    },
    {
      path: '/',
      component: UserLayout,
      meta: { requiresAuth: true, role: 'user' },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue')
        }
      ]
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, role: 'admin' },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('../views/AdminDashboard.vue')
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('../views/AdminUsers.vue')
        },
        {
          path: 'rooms',
          name: 'admin-rooms',
          component: () => import('../views/AdminRooms.vue')
        },
        {
          path: 'equipment',
          name: 'admin-equipment',
          component: () => import('../views/AdminEquipment.vue')
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ]
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated
  const isAdmin = authStore.isAdmin

  if (!isAuthenticated && to.name !== 'login') {
    return { name: 'login' }
  }

  if (isAuthenticated && to.meta.guestOnly) {
    return isAdmin ? { name: 'admin-dashboard' } : { name: 'home' }
  }

  if (isAuthenticated && to.meta.role === 'user' && isAdmin) {
    return { name: 'admin-dashboard' }
  }

  if (isAuthenticated && to.meta.role === 'admin' && !isAdmin) {
    return { name: 'home' }
  }
})

export default router
