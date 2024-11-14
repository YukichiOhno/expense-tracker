<template>
<section class="change-username-component">
    <h2>Change username</h2>
    <form @submit.prevent="changeUsername">
        <ul>
            <li>
                <label for="change-username">Username: </label>
                <input type="text" 
                name="change-username" 
                id="change-username" 
                v-model="newUsername.updateUsername.username"
                required>
            </li>
            <li>
                <label for="password-for-new-username">Password: </label>
                <input type="password" 
                name="password-for-new-username" 
                id="password-for-new-username" 
                v-model="newUsername.updateUsername.password"
                required>
            </li>
            <li>
                <button type="submit">Update Username</button>
            </li>
        </ul>
    </form>

    <section>
        {{ outputMessage }}
    </section>
</section>
</template>

<script setup>
import { useUpdateInformationStore } from '@/stores/update-user-information';
import { useUserStore } from '@/stores/user';
import { ref } from 'vue';
import axios from 'axios';

const user = useUserStore();
const newUsername = useUpdateInformationStore();
const outputMessage = ref(null);
const changeUsername = async () => {
    try {
        const response = await axios.put(`/api/user/change-username/${user.userAccountInformation.number}`, {
            new_username: newUsername.updateUsername.username,
            current_password: newUsername.updateUsername.password
        });
        const newUsernameFromAPI = response.data.new_username;
        const responseMessage = response.data.message;

        // change username in the local storage
        user.userAccountInformation.username = newUsername;

        outputMessage.value = responseMessage;
        window.location.reload();
    } catch (err) {
        console.error('an error occured in change username component');
        console.error(err);
        outputMessage.value = err.response.data.message;
    }
}
</script>