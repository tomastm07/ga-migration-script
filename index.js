const csv   = require('csv-parser');
const path  = require('path');
const fs    = require('fs');

PATH_CUSTOMER = path.resolve('docs', 'customer.csv');
PATH_CUSTOMER_ADDRESS = path.resolve('docs', 'customer_address.csv');

//Variables a utilizar
const customerData = [];
const customerAddressData = [];

console.log(`Fichero del cliente: ${PATH_CUSTOMER}`);
console.log(`Fichero de las direcciones del cliente: ${PATH_CUSTOMER_ADDRESS}`);

//Obtenemos los datos del cliente

fs.createReadStream(PATH_CUSTOMER)
.pipe(csv())
.on('data', (data) => customerData.push(data))
.on('end', () => {
    console.log(customerData)
});


console.log(customerData)