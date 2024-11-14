<template>
<main class="login-view">
    <h1>Login view</h1>
    <form @submit.prevent="loginUser">
        <ul>
            <li>
                <label for="login-username">Username: </label>
                <input type="text" name="login-username" id="login-username" v-model="loginCredentials.username" required>
            </li>
            <li>
                <label for="login-password">Password: </label>
                <input type="password" name="login-password" id="login-password" v-model="loginCredentials.password" required>
            </li>
            <li>
                <button type="submit">Login</button>
            </li>
        </ul>
    </form>

    <section class="output">
        {{ outputMessage }}
    </section>
</main>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import axios from 'axios';

const outputMessage = ref(null);
const user = useUserStore();
const router = useRouter();
const loginCredentials = reactive({
    username: null,
    password: null
});

const loginUser = async () => {
    outputMessage.value = null;

    try {
        let responseData;
        const response = await axios.post('/api/user/login', {
            username: loginCredentials.username,
            password: loginCredentials.password
        });

        // fill in user store with the response data
        responseData = response.data.user_information;
        user.userAccountInformation.username = responseData.username;
        user.userAccountInformation.number = responseData.number;
        user.userAccountInformation.first_name = responseData.first_name;
        user.settingConfiguration.page_mode = responseData.page_mode;
        user.settingConfiguration.currency = responseData.currency;
        user.settingConfiguration.currency_sign = responseData.currency_sign;

        router.push({ name: 'dashboard' });
    } catch (err) {
        console.error('an error occured in LoginView at loginUser');
        console.error(err);
        outputMessage.value = err.response.data.message;
    }
}
</script>