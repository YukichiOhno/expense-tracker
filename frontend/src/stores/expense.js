import { reactive, ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useExpenseStore = defineStore('expense-information', () => {
    const expenseTable = ref({});
    const expenseInstanceInformation = ref({});

    return { expenseTable, expenseInstanceInformation }
});
