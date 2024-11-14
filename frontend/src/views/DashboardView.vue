<template>
<main class="dashboard-view">
    <h2>Home Authenticated</h2>
    <p>hi {{ user.userAccountInformation.first_name }}</p>

    <section v-if="isLoading">
        <p>Loading expense information</p>
    </section>

    <section v-else>
        <p>expense by category: {{  summaryExpenses.expense_by_category }}</p>
        <p>expense by date: {{  summaryExpenses.expense_by_date }}</p>
        <p>total expense amount: {{  summaryExpenses.total_expense_amount }}</p>
        <p>total expense count: {{  summaryExpenses.total_expense_count }}</p>
    </section>
    
</main>
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import { onMounted, reactive, ref } from 'vue';
import axios from 'axios';

const isLoading = ref(true);
const user = useUserStore();
const summaryExpenses = reactive({
    currency_sign: null,
    expense_by_category: null,
    expense_by_date: null,
    total_expense_amount: null,
    total_expense_count: null
});

const retrieveExpenseSummary = async () => {
    try {
        const response = await axios.get(`api/expense/summary/${user.userAccountInformation.number}`);
        const expenses = response.data;
        const expenseByCategory = expenses.expense_by_category;
        const expenseByDate = expenses.expense_by_date;
        const totalExpenseAmount = expenses.total_expense_amount;
        const totalExpenseCount = expenses.total_expense_count;

        expenseByCategory ? summaryExpenses.expense_by_category = expenseByCategory : summaryExpenses.expense_by_category = 'no expense is recorded yet';
        expenseByDate ? summaryExpenses.expense_by_date = expenseByDate : summaryExpenses.expense_by_date = 'no expense is recorded yet';
        totalExpenseAmount ? summaryExpenses.total_expense_amount = totalExpenseAmount : summaryExpenses.total_expense_amount = 'no expense is recorded yet';
        totalExpenseCount ? summaryExpenses.total_expense_count = totalExpenseCount : summaryExpenses.total_expense_count = 'no expense is recorded yet';
        
    } catch (err) {
        console.error('an error occured in dashboard');
        console.error(err);
        summaryExpenses.currency_sign = "unable to retrieve data";
        summaryExpenses.expense_by_category = "unable to retrieve data";
        summaryExpenses.expense_by_date = "unable to retrieve data";
        summaryExpenses.total_expense_amount = "unable to retrieve data";
        summaryExpenses.total_expense_count = "unable to retrieve data";
    } finally {
        isLoading.value = false;
    }
}   

onMounted(async () => {
    await retrieveExpenseSummary();
});

</script>

<style scoped>
p {
    margin-block-end: 15px;
}

p:last-of-type {
    margin-block-end: 0px
}
</style>