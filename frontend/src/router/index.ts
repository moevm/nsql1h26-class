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
        // {
        //   path: 'my-bookings',
        //   name: 'my-bookings',
        //   component: () => import('../views/MyBookings.vue')
        // },
        // {
        //   path: 'profile',
        //   name: 'profile',
        //   component: () => import('../views/ProfileView.vue')
        // }
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
        }
        ,
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

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated
  const isAdmin = authStore.isAdmin

  // Если пользователь не вошел и пытается зайти куда-то кроме логина
  if (!isAuthenticated && to.name !== 'login') {
    return next({ name: 'login' })
  }

  // Если пользователь вошел и пытается зайти на страницу логина
  if (isAuthenticated && to.meta.guestOnly) {
    return next(isAdmin ? { name: 'admin-dashboard' } : { name: 'home' })
  }

  // Защита пользовательских страниц от админа
  if (isAuthenticated && to.meta.role === 'user' && isAdmin) {
    return next({ name: 'admin-dashboard' })
  }

  // Защита админских страниц от обычного пользователя
  if (isAuthenticated && to.meta.role === 'admin' && !isAdmin) {
    return next({ name: 'home' })
  }

  next()
})

export default router