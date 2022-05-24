const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync');
const stringify = require('csv-stringify');
const iso3166 = require('iso-3166-2');

const country = {}
var allCustomer = [];
var allCustomerNoProvince = [];
var maxResults = 5000;

PATH_CUSTOMER = path.resolve('data-migration', 'input', 'customer' , 'customer.csv');
PATH_CUSTOMER_ADDRESS = path.resolve('data-migration', 'input' , 'customer', 'customer_address.csv');

PATH_CUSTOMER_SHOPIFY = path.resolve('data-migration', 'output' ,'customer')
PATH_CUSTOMER_SHOPIFY_NO_PROVINCE = path.resolve('data-migration', 'output', 'error');

/**
 * Function to read the csv file
 * @param {*} path Location of the csv file
 * @returns Data extracted from the csv file
 */
async function getDataFromCsv(path) {
    const fileContent = await fs.promises.readFile(path);
    return await getData(fileContent, true);
}

/**
 * Function to return the data from a csv file.
 * @param {*} content Contents of the csv file
 * @param {*} column 
 * @returns Data of the csv file
 */
function getData(content, column) {
    return parse.parse(content, { columns: column });
}

/**
 * Function for merging file data
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
 * Function to return the client's address
 * @param {*} addres object address from csv 
 * @returns Object accepted by shopify
 */
function getCustomerAddress(addres){
    return {
        Company: addres.company,
        Address1: addres.street,
        Address2: '',
        City: addres.city,
        Province: getIsoCountry(addres.region_id, addres.country_id, addres.region)?.name,
        'Province Code': getIsoCountry(addres.region_id, addres.country_id, addres.region)?.regionCode,
        Country: getIsoCountry(addres.region_id, addres.country_id, addres.region)?.countryName,
        Zip: addres.postcode,
        Phone: addres.telephone,
        'Country Code': getIsoCountry(addres.region_id, addres.country_id, addres.region)?.countryCode
    }
}

/**
 * Function to transform the country information
 * in iso code accepted by Shopify
 * @param {*} regionID Region code
 * @param {*} countryId Country ID Country code
 * @param {*} region Name of province
 * @returns Object with the country information, if null it is because it does not exist
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
                Email: customer.email.toLowerCase(),
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
            Email: customer.email.toLowerCase(),
            Note: 'Error in fields',
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
        var presentResults = 0;
        var sizeFile = Math.ceil(allCustomer.length / maxResults);
        var nextResults = maxResults;
        for (let i = 0; i < sizeFile; i++) {
            const resultConvert = convertCsvShopify(allCustomer.slice(presentResults, nextResults), 
                                                    `${PATH_CUSTOMER_SHOPIFY}/customer_${i + 1}.csv`);
            presentResults = (maxResults * (i + 1)) + 1;
            nextResults = (maxResults * (i + 2));
        }
    }
}

async function writeFilesFromShopifyNoAddress(){
    if(!fs.existsSync(PATH_CUSTOMER_SHOPIFY_NO_PROVINCE)){
        fs.mkdir(PATH_CUSTOMER_SHOPIFY_NO_PROVINCE, (err) => {
            if(err) console.log(err);
            writeFilesFromShopifyNoAddress();            
        });
    } else {
        var presentResults = 0;
        var sizeFile = Math.ceil(allCustomerNoProvince.length / maxResults);
        var nextResults = maxResults;
        for (let i = 0; i < sizeFile; i++) {
            const result = await convertCsvShopify(allCustomerNoProvince.slice(presentResults, nextResults), 
                                                  `${PATH_CUSTOMER_SHOPIFY_NO_PROVINCE}/customer_error_${i + 1}.csv`);
            presentResults = (maxResults * (i + 1)) + 1;
            nextResults = (maxResults * (i + 2));
        }
    }
}

function convertCsvShopify(listResult, path){
    return new Promise((resolve, reject) => {
        stringify.stringify(listResult, {
            header: true
        }, (err, output) => {
            fs.writeFile(path, output, (err) =>{
                if(err){
                    reject(false);
                } else {
                    console.log('file created');
                    resolve(true);
                }
            });
        });
    })
}

joinDataCustomer();
