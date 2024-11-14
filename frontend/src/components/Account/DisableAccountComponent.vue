<template>
<section class="disable-account-component">
    <h2>Disable Account</h2>
    <button @click="beginDisable">Start Disable</button>

    <section class="warning-prompt" :style="{ display: displayWarning }">
        {{ warningMessage }}
        <button @click="continueDisable">Ok</button>
        <button @click="cancelDisable">Cancel</button>
    </section>

    <section class="disable-form" :style="{ display: displayDisableForm }">
        <form @submit.prevent="disableAccount">
            <ul>
                <li>
                    <label for="disable-current-password">Password: </label>
                    <input 
                    type="password"
                    name="disable-current-password"
                    id="disable-current-password"
                    v-model="passwordInformation.current_password"
                    required>
                </li>
                <li>
                    <label for="disable-confirm-password">Confirm Password: </label>
                    <input 
                    type="password"
                    name="disable-confirm-password"
                    id="disable-confirm-password"
                    v-model="passwordInformation.confirm_password"
                    required>
                </li>
                <li>
                    <button type="submit">Disable Account</button>
                    <button @click="cancelDisable">Cancel</button>
                </li>
            </ul>
        </form>

        <section>
            <p>{{ checkPassword }}</p>
            <p>{{ outputMessage }}</p>
        </section>
    </section>
</section>
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const user = useUserStore();
const outputMessage = ref(null);
const passwordInformation = reactive({
    current_password: null,
    confirm_password: null
});
const checkPassword = computed(() => {
    return passwordInformation.current_password === passwordInformation.confirm_password ? 'passwords match' : 'unmatched passwords';
});

// warn user about the consequences of disabling
const warningMessage = ref(null);
const displayWarning = ref('none');
const beginDisable = () => {
    displayWarning.value = 'block';
    warningMessage.value = 'once you disable your account, you wo will not able to log back in unless you contact the administrator';
}

// when user clicks ok, display the form
const displayDisableForm = ref('none');
const continueDisable = () => {
    displayWarning.value = 'none';
    displayDisableForm.value = 'block';
}

const cancelDisable = () => {
    displayWarning.value = 'none';
    displayDisableForm.value = 'none';
}

// disable account process
const disableAccount = async () => {
    try {
        const response = await axios.put(`api/user/disable-user/${user.userAccountInformation.number}`, {
            current_password: passwordInformation.current_password
        });

        outputMessage.value = response.data.message;
        user.resetUserStore();
        router.push({ name: 'home' });

    } catch (err) {
        console.error('an error occured in disable account component within disableAccount function');
        console.error(err);
        outputMessage.value = err.response.data.message;
    }
}
</script>

<style scoped>
.warning-prompt {
    border: 1px solid black;
    background-color: pink;
    inline-size: 80%;

    /* positioning */   
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    transform: translate(-50%, -50%); /* Center element */
}

.disable-form {
    border: 1px solid black;
    background-color: yellow;
    inline-size: 80%;

    /* positioning */   
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    transform: translate(-50%, -50%); /* Center element */
}
</style>