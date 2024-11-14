<template>
<main class="account-view">
    <h1>This is an account view</h1>
    <button @click="logoutUser">Logout</button>

    <!-- display loading indicator if data is not yet loaded -->
    <section v-if="isLoading">
        <p>Loading account information</p>
    </section>

    <section v-else>
        <ChangeUserInformationComponent />
        <ChangeUsernameComponent />
        <ChangePasswordComponent />
        <DisableAccountComponent />
    </section>
</main>
</template>


<script setup>
import axios from 'axios';
import { useUserStore } from '@/stores/user';
import { useUpdateInformationStore } from '@/stores/update-user-information';
import { useRouter } from 'vue-router';
import { onMounted, reactive, ref } from 'vue';
import ChangeUserInformationComponent from '@/components/Account/ChangeUserInformationComponent.vue';
import ChangeUsernameComponent from '@/components/Account/ChangeUsernameComponent.vue';
import ChangePasswordComponent from '@/components/Account/ChangePasswordComponent.vue';
import DisableAccountComponent from '@/components/Account/DisableAccountComponent.vue';

const user = useUserStore();
const router = useRouter();
const isLoading = ref(true);

// logout function
const logoutUser = async () => {
    try {
        await axios.post('/api/user/logout');
        user.resetUserStore();
        router.push({ name: 'home' });

    } catch (err) {
        console.error('something occured during the log out process');
        console.error(err);
    }
}

const userUpdateInformation = useUpdateInformationStore();
// retrieve account information
const retrieveUserInformation = async () => {
    try {
        const response = await axios.get(`/api/user/user-information/${user.userAccountInformation.number}`);
        const userInformation = response.data.user_information;

        userUpdateInformation.updateAccountInformation.first_name = userInformation.user_first;
        userUpdateInformation.updateAccountInformation.last_name = userInformation.user_last;
        userUpdateInformation.updateAccountInformation.initial = userInformation.user_initial;
        userUpdateInformation.updateAccountInformation.email = userInformation.user_email;
        userUpdateInformation.updateAccountInformation.phone_number = userInformation.user_phone;

        userUpdateInformation.updateUsername.username = userInformation.user_username;

    } catch (err) {
        console.error('an error occured in account view');
        console.error(err);

    } finally {
        isLoading.value = false;
    }
}

onMounted(async () => {
    await retrieveUserInformation();
});
</script>


<style scoped>
.account-view > section > section {
    margin-block-end: 15px;
}

.account-view > section > section:last-of-type {
    margin-block-end: 0px;
}
</style>