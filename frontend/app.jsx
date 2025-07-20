// Contoh axios
import axios from 'axios';
axios.get('http://localhost:8080/users').then(res => {
    console.log(res.data);
});
