<template>
<main class="home-view">
    <h1>Home View</h1>
    <p>Some paragraph</p>
    <nav>
        <ul>
            <li><RouterLink :to="{ name: 'login' }">Login</RouterLink></li>
            <li><RouterLink :to="{ name: 'sign-up' }">Sign up</RouterLink></li>
        </ul>
    </nav>
</main>
</template>


<script setup>
import { RouterLink } from 'vue-router';
</script>