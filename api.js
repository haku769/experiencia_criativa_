import express, { response } from 'express';
const app = express();
const PORT = 3000;

const objresponse = {name: 'Lucas', age: 22, city: 'São Paulo'};

app.get('/', (req, res) => {
    res.send('get recebido!');
})

app.listen(PORT, () => {
    console.log('Servidor rodando na porta  3000');
});