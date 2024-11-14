import axios from "axios";
import { useUserStore } from '@/stores/user';

export const authorizeToken = async () => {
    const user = useUserStore();

    try {
        const response = await axios.get('/api/user/verify-token');
        console.log(response.data.message);
        return true; // user is authenticated
    } catch (err) {
        console.error('an error occurred in misc/authorizeToken:', err);

        // automatically log out if there's an authorization issue (e.g., expired token)
        if (err.response && err.response.status === 401) { 
            console.error('token expired or unauthorized. logging out.');
            user.resetUserStore();
        }
        return false; // user is not authenticated
    }
};

