<template>
<header>
    <ul>
        <li><RouterLink :to="{ name: 'dashboard' }">Dashboard</RouterLink></li>
        <li><RouterLink :to="{ name: 'account' }">Account</RouterLink></li>
    </ul>
</header>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>