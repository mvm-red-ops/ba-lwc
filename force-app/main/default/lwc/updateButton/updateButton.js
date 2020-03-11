import { LightningElement, api, track } from 'lwc';
import updateSchedules from '@salesforce/apex/TrafficUpdateFromBA_LWC.updateSchedules';



export default class UpdateButton extends LightningElement {
  @api exportMatches = [];
  @api exportUnmatches = [];
  @api selectedRows = [];
  @track data;
  @track error;
  @track success = false;
  @track status;
  @track columns = [
    // { label: 'Schedule Options', fieldName: 'action', type: 'action', typeAttributes: { rowActions: actions, menuAlignment: 'left'}}, 
    { label: 'Id', fieldName: 'Id'},
    { label: 'Week', fieldName: 'Week__c'},
    { label: '800 #', fieldName: 'X800_Number__c'},
    { label: 'ISCI Code', fieldName: 'ISCI_CODE__c'},
    { label: 'Show Title', fieldName: 'LF_traffic__c'},
    { label: 'Rate', fieldName: 'Rate__c'}
  ];
  @api count;

  @api
  updateSchedules(event, selectedScheds, matchedScheds, unmatchedSched) {

    this.success = false

    const selectedEvent = new CustomEvent("updateinitiated", {
      detail: 'event'
    });
    this.dispatchEvent(selectedEvent);


    //array of ids that were checked on the datatable
    const selectedRowIds = this.selectedRows.length > 0 ? this.selectedRows.map( row => row.Id) : []
    const unmatched = this.exportUnmatches
    const matched = this.exportMatches
    const unselectedMatches = [];
    const unselectedUnmatches = [];
    
    //iterate through matched and then unmatched schedules, checking whether their id is in the array of selected rows
    //if it is not, it is added to the unselected arrays above
    for(let i = 0; i < matched.length; i++){
      let id = matched[i].Id

      if(selectedRowIds.includes(id)){
        continue
      } else {
        unselectedMatches.push(matched[i])
      }
    }

    for(let j = 0; j < unmatched.length; j++){
      let curr = unmatched[j]
      if(selectedRowIds.includes(curr.Id)){
        continue
      } else {
        unselectedUnmatches.push(curr)
      }
    }

    let scheds = []
    scheds.push(unselectedUnmatches);
    scheds.push(unselectedMatches);
    window.console.log('HERE? dispatch event');

      updateSchedules({scheds})
              .then(result => { 
                  window.console.log('result', JSON.stringify(result));
                  this.data = result;
                  this.success = true;
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
      window.console.log('FORMAT RETURNED DATA FROM SERVER')
      window.console.log(JSON.stringify(data))

      try{
        this.success = true
        const statusObject = Object.keys(data)[0]
        const schedules = Object.values(data)[0]
        //format data
        window.console.log('finding status')
        window.console.log(JSON.stringify(statusObject))

        const formattedSchedules = [];
        for(let i = 0; i < schedules.length; i++){
          let curr = schedules[i]
          let formatted = Object.assign({}, curr)
          const isSalesforceId = curr.Id.split(' ').length === 1

          if(!isSalesforceId){
            formatted.Id = 'Record From BA'
            window.console.log(JSON.stringify(formatted))
          }

          formattedSchedules.push(formatted)
        }

        this.data = formattedSchedules
      } catch(e){
        window.console.log(e)
      }
      window.console.log('dispatch event')
      const hidespinnerEvent = new CustomEvent("hidespinner", {
        detail: 'event'
      });
      this.dispatchEvent(hidespinnerEvent);
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