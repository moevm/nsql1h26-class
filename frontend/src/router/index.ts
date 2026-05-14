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
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterPage.vue'),

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
        },
        {
          path: '/profile',
          name: 'profile',
          component: () => import('@/views/UserProfile.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'bookings',
          name: 'bookings',
          component: () => import('../views/UserBookings.vue')
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
        },
        {
        path: 'profile',
        name: 'admin-profile',
        component: () => import('@/views/UserProfile.vue')
      },
      {
        path: 'users/:id',
        name: 'admin-user-detail',
        component: () => import('@/views/UserProfile.vue'),
        props: true
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

  const publicPages = ['login', 'register'];
  if (!isAuthenticated && !publicPages.includes(to.name as string)) {
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
