import { LightningElement, api, track } from 'lwc';
import updateSchedules from '@salesforce/apex/TrafficUpdateFromBA_LWC.updateSchedules';


const cols = [
  // { label: 'Schedule Options', fieldName: 'action', type: 'action', typeAttributes: { rowActions: actions, menuAlignment: 'left'}}, 
  { label: 'Id', fieldName: 'Id'},
  { label: 'Week', fieldName: 'Week__c'},
  { label: '800 #', fieldName: 'X800_Number__c'},
  { label: 'ISCI Code', fieldName: 'ISCI_CODE__c'},
  { label: 'Rate', fieldName: 'Rate__c'}
];

export default class UpdateButton extends LightningElement {
  @api exportMatches = [];
  @api exportUnmatches = [];
  @track resultProcessed
  @track data;
  @track success = false;
  @track statuses;
  @track columns = cols;
  @api testScheds = ['sched1', 'sched2'];
  
  printVals(){
    window.console.log('match:', JSON.stringify(this.matchedScheds))
    window.console.log('unmatcheD: ',JSON.stringify(this.unmatchedScheds))
  }

  @api
  invokeSchedUpdate() {
    const unmatched = this.exportUnmatches
    const matched = this.exportMatches
    window.console.log('invoke schedule batch')
    window.console.log(JSON.stringify(`tot matches : ${unmatched.length}`))
    window.console.log(JSON.stringify(`tot unmatches: ,${matched.length}`))

    let scheds = []
    scheds.push(unmatched)
    scheds.push(matched)

      updateSchedules({scheds: scheds})
              .then(result => {
                  window.console.log('result', JSON.stringify(result));
                  this.data = result;
                  this.error = undefined;
              })
              .then( () => this.formatData(this.data) )
              .catch(error => {
                  window.console.log('error', JSON.stringify(error));
                  this.error = error;
              });
      return null;
    }

    formatData(data){
      window.console.log('data')
      window.console.log(JSON.stringify(data))
      if(data[0].updateStatus){
        this.success = true
        this.statuses = [{'key': 1, 'name': 'Process', 'status': data[0].updateStatus}, {'key': 2,'name': 'Matches', 'status': data[0].matchStatus}]
      } else {
      //format data
      const formattedData = [];
      for(let i = 0; i < data.length; i++){
        window.console.log('for loop')  
        let curr = data[i]

        let formatted = Object.assign({}, curr)

        window.console.log(JSON.stringify(formatted))

        const isSalesforceId = curr.Id.split(' ').length === 1
        window.console.log(JSON.stringify(isSalesforceId))

        if(!isSalesforceId){
          window.console.log('pre -error')
          formatted.Id = 'Record From BA'
          window.console.log(JSON.stringify(formatted))
        }


        formattedData.push(formatted)
      }

      this.data = formattedData
      this.resultProcessed = true
      window.console.log('result processed')
      window.console.log(this.data)
      window.console.log(this.resultProcessed)
      }


      //{"Id":"01/19/2020 A-4:00 COURTTV Mystery PP","ISCI_CODE__c":"1006513179H\r","Rate__c":"0","X800_Number__c":"201-316-4276"},
      //{"Id":"a080R000006zZbXQAU","ISCI_CODE__c":"blankIsci","Rate__c":"7778.00","X800_Number__c":"blankPhone"}]
    }

    // this method validates the data and creates the csv file to download
    downloadCSVFile() {   
      let rowEnd = '\n';
      let csvString = '';
      // this set elminates the duplicates if have any duplicate keys
      let rowData = new Set();

      // getting keys from data
      this.data.forEach(function (record) {
          Object.keys(record).forEach(function (key) {
              rowData.add(key);
          });
      });

      // Array.from() method returns an Array object from any object with a length property or an iterable object.
      rowData = Array.from(rowData);
      
      // splitting using ','
      csvString += rowData.join(',');
      csvString += rowEnd;

      // main for loop to get the data based on key value
      for(let i=0; i < this.data.length; i++){
          let colValue = 0;

          // validating keys in data
          for(let key in rowData) {
              if(rowData.hasOwnProperty(key)) {
                  // Key value 
                  // Ex: Id, Name
                  let rowKey = rowData[key];
                  // add , after every value except the first.
                  if(colValue > 0){
                      csvString += ',';
                  }
                  // If the column is undefined, it as blank in the CSV file.
                  let value = this.data[i][rowKey] === undefined ? '' : this.data[i][rowKey];
                  csvString += '"'+ value +'"';
                  colValue++;
              }
          }
          csvString += rowEnd;
      }

      // Creating anchor element to download
      let downloadElement = document.createElement('a');

      // This  encodeURI encodes special characters, except: , / ? : @ & = + $ # (Use encodeURIComponent() to encode these characters).
      downloadElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvString);
      downloadElement.target = '_self';
      // CSV File Name
      downloadElement.download = 'Account Data.csv';
      // below statement is required if you are using firefox browser
      document.body.appendChild(downloadElement);
      // click() Javascript function to download CSV file
      downloadElement.click(); 
  }

}