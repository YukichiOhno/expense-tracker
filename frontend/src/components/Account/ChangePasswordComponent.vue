<template>
<section class="change-password-component">
    <h2>Change password</h2>
    <form @submit.prevent="changePassword">
        <ul>
            <li>
                <label for="new-password">New Password: </label>
                <input 
                type="password"
                name="new-password"
                id="new-password"
                v-model="passwordInformation.new_password"
                required>
            </li>
            <li>
                <label for="confirm-new-password">Confirm Password: </label>
                <input 
                type="password"
                name="confirm-new-password"
                id="confirm-new-password"
                v-model="passwordInformation.confirm_password"
                required>
            </li>
            <li>
                <label for="current-password">Current Password: </label>
                <input 
                type="password"
                name="current-password"
                id="current-password"
                v-model="passwordInformation.current_password"
                required>
            </li>
            <li>
                <button type="submit">Change Password</button>
            </li>
        </ul>
    </form>

    <section>
        <p>{{ checkPassword }}</p>
        <p>{{ outputMessage }}</p>
    </section>
</section>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import axios from 'axios';

const outputMessage = ref(null);
const user = useUserStore();

const passwordInformation = reactive({
    new_password: "",
    current_password: "",
    confirm_password: ""
});

const checkPassword = computed(() => {
    const minLength = 8;
    if (passwordInformation.new_password.length < minLength) {
        return 'password must be at least 8 characters long'
    }
    return passwordInformation.new_password === passwordInformation.confirm_password ? 'looks great' : 'passwords are unmatching';
});

const changePassword = async () => {
    try {
        const response = await axios.put(`/api/user/change-password/${user.userAccountInformation.number}`, {
            new_password: passwordInformation.new_password,
            current_password: passwordInformation.current_password
        });
        outputMessage.value = response.data.message;
        console.log(response.data.message);
        window.location.reload();
    } catch (err) {
        console.error('an error occured in change password component');
        console.error(err);
        outputMessage.value = err.response.data.message;
    }
}

</script>