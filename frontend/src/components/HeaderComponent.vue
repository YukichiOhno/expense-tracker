<template>
<header>
    <ul>
        <li><RouterLink :to="{ name: 'home' }">Home</RouterLink></li>
        <li><RouterLink :to="{ name: 'about' }">About</RouterLink></li>
        <li><RouterLink :to="{ name: 'login' }">Login</RouterLink></li>
    </ul>
</header>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>