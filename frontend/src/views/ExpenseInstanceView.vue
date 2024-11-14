<template>
<main class="expense-instance-view">
    <h1>Expense Instance</h1>

    <section v-if="isLoading">
        <p>Retrieving expense information for expense number {{ expenseNumber }}</p>
    </section>

    <section v-else-if="serverError">
        <p>A server error occured while fetching data. Refresh the page, or if the problem persists, contact the administrator.</p>
    </section>

    <section v-else>
        {{ expenseInstance }}
    </section>
</main>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const expenseInstance = ref({});

const isLoading = ref(true);
const serverError = ref(false);
const expenseNumber = route.params.expense_number;
const userNumber = user.userAccountInformation.number;

const retrieveExpenseInstance = async () => {
    try {
        const response = await axios.get(`/api/expense/${userNumber}/${expenseNumber}`);
        const expenseInformation = response.data.expense_instance;
        expenseInstance.value = expenseInformation;

    } catch (err) {
        console.error('an error occured while fetching data in expense instance page');
        console.error(err);
        window.alert(`an error occured while retrieving expense number ${expenseNumber}; reloading back to the expense page`);
        serverError.value = true;
        router.push({ name: 'expense' });

    } finally {
        isLoading.value = false;
    }
}

onMounted(async () => {
    await retrieveExpenseInstance();
});
</script>