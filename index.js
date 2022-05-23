const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync');
const stringify = require('csv-stringify');
const iso3166 = require('iso-3166-2');

const country = {}
var allCustomer = [];
var allCustomerNoProvince = [];

PATH_CUSTOMER = path.resolve('docs', 'customer.csv');
PATH_CUSTOMER_ADDRESS = path.resolve('docs', 'customer_address.csv');

PATH_CUSTOMER_SHOPIFY = path.resolve('docs', 'shopify')
PATH_CUSTOMER_SHOPIFY_NO_PROVINCE = path.resolve('docs', 'shopify');

/**
 * Funcion para leer el archivo csv
 * @param {*} path Ubicacion del archivo csv
 * @returns Data extraida del csv
 */
async function getDataFromCsv(path) {
    const fileContent = await fs.promises.readFile(path);
    return await getData(fileContent, true);
}

/**
 * Funcion para retornar los datos de un archivo csv
 * @param {*} content Contenido del archivo csv
 * @param {*} column 
 * @returns Datos del archivo csv
 */
function getData(content, column) {
    return parse.parse(content, { columns: column });
}

/**
 * Function para unir la data de los archivo
 * PATH_CUSTOMER
 * PATH_CUSTOMER_ADDRESS
 */
async function joinDataCustomer() {
    const customers = await getDataFromCsv(PATH_CUSTOMER);
    const allAddress = await getDataFromCsv(PATH_CUSTOMER_ADDRESS);
    
    customers.forEach((customer) => {
        allAddress.filter((address) => address._email == customer.email).map((addr) => (
            getCustomerAddress(addr)
        )).forEach((customerReady, index) => {
            setAllInformation(customerReady, index, customer);
        });
    });

    writeFilesFromShopify();
    writeFilesFromShopifyNoAddress();
}

/**
 * Funcion para retornar la direccion del cliente
 * @param {*} addres objeto direccion del csv 
 * @returns Objeto aceptado por shopify
 */
function getCustomerAddress(addres){
    return {
        Company: addres.company,
        Phone: addres.telephone,
        City: addres.city,
        Address1: addres.street,
        Zip: addres.postcode,
        Province: getIsoCountry(addres.region_id, addres.country_id, addres.region)?.name,
        'Province Code': getIsoCountry(addres.region_id, addres.country_id, addres.region)?.regionCode,
        Country: getIsoCountry(addres.region_id, addres.country_id, addres.region)?.countryName,
        'Country Code': getIsoCountry(addres.region_id, addres.country_id, addres.region)?.countryCode
    }
}

/**
 * Funcion para transformar la información del pais
 * en iso code aceptado por Shopify
 * @param {*} regionID   Codigo de la región
 * @param {*} countryId  Codigo del pais
 * @param {*} region     Nombre de la provincia
 * @returns Objeto con la informacion del pais, si es null es porque no existe
 */
function getIsoCountry(regionID, countryId, region) {
    return country[regionID] ??= iso3166.subdivision(countryId, region);
}

function setAllInformation(address, index, customer) {
    if(address.Province != undefined){
        if(index == 0){
            allCustomer[allCustomer.length] = {
                'First Name': customer.firstname,
                'Last Name': customer.lastname,
                Email: customer.email,
                ...address
            }
        } else {
            allCustomer[allCustomer.length] = {
                'First Name': '',
                'Last Name': '',
                Email: customer.email,
                ...address
            }
        }
    } else{
        allCustomerNoProvince[allCustomerNoProvince.length] = {
            'First Name': customer.firstname,
            'Last Name': customer.lastname,
            Email: customer.email,
            ...address
        }
    }
}

function writeFilesFromShopify(){
    if(!fs.existsSync(PATH_CUSTOMER_SHOPIFY)){
        fs.mkdir(PATH_CUSTOMER_SHOPIFY, (err) => {
            if(err) console.log(err);
            writeFilesFromShopify();
        });
    } else {
        stringify.stringify(allCustomer, {
            header: true
        }, (error, output) => {
            fs.writeFile(`${PATH_CUSTOMER_SHOPIFY}/customer.csv`, output, (err) => {
                if(err){
                    console.log('error');
                } else {
                    console.log('se migro');
                }
            });
        })
    }
    
}

function writeFilesFromShopifyNoAddress(){
    if(!fs.existsSync(PATH_CUSTOMER_SHOPIFY_NO_PROVINCE)){
        fs.mkdir(PATH_CUSTOMER_SHOPIFY_NO_PROVINCE, (err) => {
            if(err) console.log(err);
            writeFilesFromShopifyNoAddress();            
        });
    } else {
        stringify.stringify(allCustomerNoProvince, {
            header: true
        }, (err, output) => {
            fs.writeFile(`${PATH_CUSTOMER_SHOPIFY_NO_PROVINCE}/customer_no_province.csv`, output, (err) =>{
                if(err){
                    console.log('error');
                } else {
                    console.log('se migro')
                }
            });
        })
    }
}

joinDataCustomer();