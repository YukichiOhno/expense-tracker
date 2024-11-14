<template>
<main class="expense-view">
    <h1>Expense View</h1>

    <section v-if="isLoading">
        <p>Retrieving your expenses, please wait...</p>
    </section>

    <section v-else-if="cannotRetrieve">
        <p>unable to retrieve expense information due to server error</p>
    </section>

    <section v-else-if="nullExpenseMessage">
        <p>You have not added any expenses yet, try adding one</p>
    </section>

    <section v-else>
        <p>Active expense information</p>
        <table>
            <thead>
                <tr>
                    <th>Expense</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Category</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="expense in expense.expenseTable" :key="expense.expense_number" @click="updateExpenseInstance(expense.expense_number)">
                    <td v-if="expense.active">{{ expense.expense_number }}</td>
                    <td v-if="expense.active">{{ currencySign }}{{ expense.amount }}</td>
                    <td v-if="expense.active">{{ expense.description }}</td>
                    <td v-if="expense.active">{{ expense.date }}</td>
                    <td v-if="expense.active">{{ expense.category }}</td>
                </tr>
            </tbody>
        </table>
    </section>
</main>
</template>

<script setup>
import { useExpenseStore } from '@/stores/expense';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import { reactive, ref, onMounted } from 'vue';
import axios from 'axios';

const user = useUserStore();
const router = useRouter();

const userNumber = user.userAccountInformation.number;
const currencySign = user.settingConfiguration.currency_sign;
const expense = useExpenseStore();
const isLoading = ref(true);
const cannotRetrieve = ref(false);
const nullExpenseMessage = ref(false);

const retrieveExpenseTable = async (req, res) => {
    try {
        const response = await axios.get(`/api/expense/${userNumber}`);
        const expenseResult = response.data.expenses;

        if (expenseResult === null) {
            nullExpenseMessage.value = true;
        } else {
            expense.expenseTable = expenseResult.map(expense => expense);
        }
        
        console.log('successfully retrieved expense information for the user');

    } catch (err) {
        console.error('an error occured while retrieving expense table for the user in expense view');
        console.error(err);
        cannotRetrieve.value = true;
    } finally {
        isLoading.value = false;
    }
}

const updateExpenseInstance = (expense_number) => {
    router.push({ name: 'expense-update', params: { expense_number } });
}

onMounted(async () => {
    await retrieveExpenseTable();
})

</script>


<style scoped>
table, th, tr, td {
    border: 1px solid black;
}

th, td {
    padding-inline: 10px;
    text-align: center;
}

tbody > tr:hover {
    cursor: pointer;
    background-color: pink;
}

</style>