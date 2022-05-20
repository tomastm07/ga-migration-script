const fs    = require('fs').promises;
const path  = require('path');
const parse   = require('csv-parse/sync');
const iso3166 = require('iso-3166-2');

const country = {}

PATH_CUSTOMER = path.resolve('docs', 'customer.csv');
PATH_CUSTOMER_ADDRESS = path.resolve('docs', 'customer_address.csv');


async function getDataFromCsv(path){
    const fileContent = await fs.readFile(path);
    return await getData(fileContent, true);
}

function getData(content, column){
    return parse.parse(content, {columns: column});
}

async function joinDataCustomer(){
    const customers = await getDataFromCsv(PATH_CUSTOMER);
    const allAddress  = await getDataFromCsv(PATH_CUSTOMER_ADDRESS);
    customers.forEach((customer) => {

        const addressCustomer = allAddress.filter((address) => address._email == customer.email).map((dir) => ({
            Company: dir.company,
            Phone: dir.telephone,
            City: dir.city,
            Addres1: dir.street,
            Zip: dir.postcode,
            
        }));
    });

    //Los datos que se deben sacar de customer son -> email, firstname, lastname | Email, First Name, Last Name

    //Datos que se debe sacar de address 
    /**


     * 
     * region       | Province, Province Code, Country
     * country_id   | Country Code
     * 
     * street       | Address1, Address2
     * city         | City
     * company      | Company
     * postcode     | Zip
     * telephone    | Phone
     */
}

function getIsoCountry(regionID, countryId, region){
    return country[regionID] ??= iso3166.subdivision(countryId, region);
}

getIsoCountry(571, 'AU', 'Victoria');
getIsoCountry(570, 'AU', 'New South Wales');
getIsoCountry(569, 'AU', 'Australian Capital Territory');
getIsoCountry(161, 'ES', 'Madrid');
getIsoCountry(571, 'AU', 'Victoria');
getIsoCountry(572, 'AU', 'Queensland');
getIsoCountry(573, 'AU', 'South Australia');
getIsoCountry(12, 'US', 'California');
getIsoCountry(0, 'NZ', '');


console.log(country)
