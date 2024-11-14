<template>
    <HeaderComponent v-if="user.isLoggedIn" />
    <RouterView />
    <FooterComponent v-if="user.isLoggedIn" />
</template>


<script setup>
import HeaderComponent from './components/HeaderComponent.vue';
import { RouterView } from 'vue-router';
import FooterComponent from './components/FooterComponent.vue';
import { useUserStore } from './stores/user';

const user = useUserStore();

</script>

<style scoped>
</style>