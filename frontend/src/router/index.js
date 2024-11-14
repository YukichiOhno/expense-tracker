import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import { authorizeToken } from '@/assets/misc-scripts/authorize-token';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue')
        },
        {
            path: '/sign-up',
            name: 'sign-up',
            component: () => import('../views/SignupView.vue')
        },
        {
            path: '/account',
            name: 'account',
            meta: { requiresAuthorization: true },
            component: () => import('../views/AccountView.vue'),
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            meta: { requiresAuthorization: true },
            component: () => import('../views/DashboardView.vue'),
        },
        {
            path: '/expense',
            name: 'expense',
            meta: { requiresAuthorization: true },
            component: () => import('../views/ExpenseView.vue'),
        },
        {
            path: '/expense-update/:expense_number',
            name: 'expense-update',
            meta: { requiresAuthorization: true },
            component: () => import('../views/ExpenseInstanceView.vue'),
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: { name: 'home' }
        }
    ]
});

router.beforeEach(async (to, from, next) => {
    const isLoggedIn = await authorizeToken();

    // redirect if trying to access login or sign-up when already logged in
    if ((to.name === 'login' || to.name === 'sign-up') && isLoggedIn) {
        next({ name: 'home' });
    }
    // redirect if trying to access a protected route without being logged in
    else if (to.meta.requiresAuthorization && !isLoggedIn) {
        next({ name: 'home' });
    } 
    // allow navigation if no redirects are needed
    else {
        next();
    }
});

export default router;
