<template>
<section class="change-user-information-component">
    <h2>Change user information</h2>
    <form @submit.prevent=updateAccount>
        <ul>
            <li>
                <label for="update-first-name">First Name: </label>
                <input 
                type="text" 
                name="update-first-name" 
                id="update-first-name" 
                v-model="updateInformation.updateAccountInformation.first_name"
                required>
            </li>
            <li>
                <label for="update-last-name">Last Name: </label>
                <input 
                type="text" 
                name="update-last-name" 
                id="update-last-name" 
                v-model="updateInformation.updateAccountInformation.last_name"
                required>
            </li>
            <li>
                <label for="update-initial">Initial: </label>
                <input 
                type="text" 
                name="update-initial" 
                id="update-initial" 
                v-model="updateInformation.updateAccountInformation.initial"
                maxlength="1"
                required>
            </li>
            <li>
                <label for="update-phone-number">Phone Number: </label>
                <input 
                type="text" 
                name="update-phone-number" 
                id="update-phone-number" 
                v-model="updateInformation.updateAccountInformation.phone_number"
                minlength="10"
                maxlength="10"
                required>
            </li>
            <li>
                <label for="update-email">Email: </label>
                <input 
                type="text" 
                name="update-email" 
                id="update-email" 
                v-model="updateInformation.updateAccountInformation.email"
                required>
            </li>
            <li>
                <button type="submit">Update Account</button>
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
const updateInformation = useUpdateInformationStore();
const outputMessage = ref(null);

// update account
const updateAccount = async () => {
    try {
        const response = await axios.put(`/api/user/change-information/${user.userAccountInformation.number}`, {
            first: updateInformation.updateAccountInformation.first_name,
            last: updateInformation.updateAccountInformation.last_name,
            initial: updateInformation.updateAccountInformation.initial,
            phone: updateInformation.updateAccountInformation.phone_number,
            email: updateInformation.updateAccountInformation.email
        });

        // change first name in the local storage
        user.userAccountInformation.first_name = updateInformation.updateAccountInformation.first_name;
        
        outputMessage.value = response.data.message;
        window.location.reload();
    } catch (err) {
        console.error('an error occured in change user information component');
        console.error(err)
        outputMessage.value = err.response.data.message;
    }
}

</script>