import { reactive, ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user-information', () => {
    const userAccountInformation = reactive({
        username: null,
        number: null,
        first_name: null
    });

    const settingConfiguration = reactive({
        page_mode: null,
        currency: null,
        currency_sign: null
    });

    const resetUserStore = () => {
        userAccountInformation.username = null;
        userAccountInformation.number = null;
        userAccountInformation.first_name = null;

        settingConfiguration.page_mode = null;
        settingConfiguration.currency = null;
        settingConfiguration.currency_sign = null;
    };

    return { userAccountInformation, settingConfiguration, resetUserStore }

}, { persist: { enabled: true } });