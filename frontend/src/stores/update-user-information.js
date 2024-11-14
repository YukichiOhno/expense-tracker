import { reactive, ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useUpdateInformationStore = defineStore('user-update-information', () => {
    const updateAccountInformation = reactive({
        first_name: null,
        last_name: null,
        initial: null,
        phone_number: null,
        email: null
    });

    const updateUsername = reactive({
        username: null,
        password: null
    })

    return { updateAccountInformation, updateUsername }
});