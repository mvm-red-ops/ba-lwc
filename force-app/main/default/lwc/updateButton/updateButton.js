import { LightningElement, api, track } from 'lwc';
import updateSchedules from '@salesforce/apex/TrafficUpdateFromBA_LWC.updateSchedules';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';



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
    { label: 'Long From', fieldName: 'Long_Form__c'},
    { label: '800 #', fieldName: 'X800_Number__c'},
    { label: 'ISCI Code', fieldName: 'ISCI_CODE__c'},
    { label: 'Show Title', fieldName: 'LF_traffic__c'},
    { label: 'Rate', fieldName: 'Rate__c'}
  ];
  @api count;

  hidespinnerEvent = new CustomEvent("hidespinner", {
    detail: 'event'
  });

  updateFailed =new CustomEvent("updatefailed", {
    detail: 'event'
  });

  updateSucceeded =new CustomEvent("updatesucceeded", {
    detail: 'event'
  });

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

    updateSchedules({scheds})
              .then(result => { 
                  this.data = result;
                  this.success = true;
                  window.console.log('in success')
                  this.error = undefined;
              })
              .then( () => this.formatData(this.data) )
              .then( () => this.dispatchSuccessEvents(this.updateSucceeded))
              .catch(error => {
                window.console.log(error)
                window.console.log('error: ', JSON.stringify(error));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error!!',
                        message: "Ooohh! Please read error below!",
                        variant: 'error',
                    }),
                );     
                this.dispatchEvent(this.hidespinnerEvent);
                this.dispatchEvent(this.updateFailed);
                this.error = error.body.message;
              });


      return null;
    }

    formatData(data){
      window.console.log('Formatting data')
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
          }

          formattedSchedules.push(formatted)
        }

        this.data = formattedSchedules
      } catch(e){
        window.console.log(e)
        window.console.log('error in try catch for return data')
      }
      window.console.log('dispatch event')
      this.dispatchEvent(this.hidespinnerEvent);
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

  dispatchSuccessEvents(){
    this.dispatchEvent(this.updateSucceeded)

    this.dispatchEvent(
      new ShowToastEvent({
          title: 'Success!!',
          message: 'BA was successfully uploaded!!!',
          variant: 'success',
      })
    )

  }
}


// public with sharing class TrafficUpdateFromBA_LWC {
// 	@auraEnabled() 
//     public static Map<Map<String,String>, List<Map<String, String>>> updateSchedules(List<List<Map<String, String>>> scheds){
//         List<Map<String, String>> unmatchedJSON = scheds[0];        
//         List<Map<String, String>> matchedJSON = scheds[1];

//         Map<String,Schedules__c> matchedMap = getMatchedSchedules(matchedJSON);
// 		List<Schedules__c> updatedSchedules = new List<Schedules__c>();


//         for(Integer i = 0; i < matchedJSON.size(); i++){
            
//             //get current match sched obj from json
//             Map<String, String> matchJSON = matchedJSON[i];
//             String sId = matchJSON.get('Id');

//             Schedules__c schedToUpdate = matchedMap.get(sId);
 
//             //grab id and get schedule
//             if(matchJSON.containsKey('Rate__c')){
//                 schedToUpdate.Rate__c = Integer.valueOf(matchJSON.get('Rate__c'));
//             }
//             if(matchJSON.containsKey('ISCI_CODE__c')){
//                 schedToUpdate.ISCI_CODE__c = matchJSON.get('ISCI_CODE__c');
//             }
//             if(matchJSON.containsKey('X800_Number__c')){
//                 schedToUpdate.X800_Number__c = matchJSON.get('X800_Number__c');
//             }            
//             if(matchJSON.containsKey('LF_traffic__c')){
//                 schedToUpdate.LF_traffic__c = matchJSON.get('LF_traffic__c');
//             }
            
//             System.debug(matchJSON);
//             updatedSchedules.add(schedToUpdate);
//         }
//         System.debug('updatedSchedules');
//         System.debug(updatedSchedules);

//         //execute the DML update
//         try{
//            System.debug('updating..');
//            update updatedSchedules ;
//         }
//         catch(Exception e){
//             AuraHandledException ex = new AuraHandledException(' Schedule Update Failed.' + e.getMessage());
//             ex.setMessage('The update for the schedules failed: ' + e.getMessage());
//             throw ex;
//         }
        
//         //want to return non updated schedules
//         //in the format that has the sf scheds that are likely matches
//         //and the csv sched info 
//         //List<Map<String, String>> 
//         //[ {'id: '', 'Week__c': '01/25/2019'}  ]

//         List<Map<String, String>> returnObjects = new List<Map<String, String>>();
//         Map<Map<String,String>, List<Map<String, String>>> returnVals = new Map<Map<String,String>, List<Map<String, String>>>();
//    		Map<String, String> status = new Map<String, String>();
        
//         //would be ideal to return ba schedules that didn't match
//       		System.debug('unmatched');
//             System.debug(unmatchedJSON);
//         if(unmatchedJSON.size() > 0){
//            returnObjects = unmatchedJSON;
//            status = new Map<String, String>{'updateStatus'=>'succesful','code'=> '202', 'matchStatus'=>'BA schedules not matched', 'count' => String.valueOf(unmatchedJSON.size())};
//            returnVals.put(status, returnObjects);
//         } else {
//             status = new Map<String, String>{'updateStatus'=>'succesful','code' => '201', 'matchStatus'=>'every schedule matched'};
//             returnVals.put(status, returnObjects);
//         }
        
//   	    return returnVals;
//     }
    
//     public static Map<String,Schedules__c> getMatchedSchedules(List<Map<String, String>> matched){
//    		List<String> schedIds = new List<String>();
//      	for(Integer i = 0; i < matched.size(); i++ ){
//            //add each sched id to array;
//            Map<String, String> curr = matched[i];
//            schedIds.add(curr.get('Id'));
//         }
      
//         List<Schedules__c> scheds = [SELECT Id FROM Schedules__c WHERE Id IN :schedIds];
        
// 	    Map<String, Schedules__c> schedMap = new Map<String, Schedules__c>();

//         for(Integer i = 0; i < scheds.size(); i++){
//             Schedules__c curr = scheds[i];
//             schedMap.put(String.valueOf(curr.Id), curr);
//         }
        
//         return schedMap;
//     }
    
//     public static List<Map<String, String>> formatUnmatchedJSON(List<Map<String, String>> unmatched){
//         List<Map<String, String>> result = new List<Map<String, String>>();
            
//         for(Integer i = 0; i < unmatched.size(); i++){
//             Map<String, String> curr = unmatched[i];
            
//             //if the id is an sf id, the split value will be 1
//             if(curr.get('Id').split(' ').size() > 1){
//                 //object from csv data
//                 Map<String, String> formattedObj = new Map<String, String>();
//             } else {
//                 //object is a sf sched
//             }
            
//         }
        
//         return result;
//     }
// }