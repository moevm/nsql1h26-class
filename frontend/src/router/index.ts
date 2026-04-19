import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginPage from '../views/LoginPage.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import AdminDashboard from '../views/AdminDashboard.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { hideNavbar: true }
    },
    {
      path: '/admin',
      component: AdminLayout, 
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: AdminDashboard,
          meta: { hideNavbar: true }

        }
      ]
    }
  ]
})

export default router