import { LightningElement, track, api } from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import readCSV from '@salesforce/apex/LWCExampleController.readCSVFile';
import Id from '@salesforce/user/Id';

const columns = [
    { label: 'Id', fieldName: 'Id', type: 'text'}, 
    { label: 'Week', fieldName: 'Week__c', type: 'text' },
    { label: 'Daypart', fieldName: 'LF_Daypart__c', type: 'text'}, 
    { label: 'Deal Brand', fieldName: 'DealBrand__c', type: 'text'}, 
    { label: 'Deal Program', fieldName: 'DealProgram__c', type: 'text'}, 
    { label: 'Long Form', fieldName: 'Long_Form__c', type: 'text'},
    { label: '800 #', fieldName: 'X800_Number__c', type: 'text'},
    { label: 'ISCI Code', fieldName: 'ISCI_CODE__c', type: 'text'},
    { label: 'Rate', fieldName: 'Rate__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClass' }}}

];

const data = [];

export default class ReadCSVFileInLWC extends LightningElement {
    @api recordId;
    @track error;
    @track columns = columns;
    @track data = data;
    @track myRecordId = Id;
    @track updatedVals;
    @track count;
    @track displayFileUpload

    displayFileUpload = true;
    displayColumnsAndHeaders = false;

    // accepted parameters
    get acceptedFormats() {
        return ['.csv'];
    }


    async handleUploadFinished(event) {
        // Get the list of uploaded files
        const uploadedFiles = event.detail.files;

        // calling apex class
      readCSV({idContentDocument : uploadedFiles[0].documentId})
        .then(result => {

            this.data = result;
            this.count = Object.keys(result).length.toString()
            window.console.log('count variable:')
            window.console.log(Object.keys(result).length)
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: 'BA was successfully uploaded!!!',
                    variant: 'success',
                }),
            );
        })
       .then(() => this.formatData(this.data, this.updatedData) ) 

        .catch(error => {
            this.error = error;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: JSON.stringify(error),
                    variant: 'error',
                }),
            );     
        })
    }

    formatData(apiData){

      const schedObjects = [];

      const staticData = Object.keys(apiData);
      const updatedData = Object.values(apiData);
      // if(staticData.length !== updatedData.length) {
      //   throw 'errorMessage! Incorrect lengths'
      // }

      for(let i = 0; i < staticData.length; i++){
        let staticRecord = staticData[i];
        let updatedRecord = updatedData[i];
        //clip excess formattinng from string)
        const string =  staticRecord.substring(staticRecord.lastIndexOf('(') + 1, staticRecord.lastIndexOf(')') );
        window.console.log('string', string)

        //split string into column values
        const dataArr = string.split(',');
        window.console.log(dataArr)
        const schedObj = {}

        for(const field of dataArr){
          window.console.log(field)
          if(!field) continue
          const vals = field.split(':')
          window.console.log(vals)

          if(!vals) continue
          else{ 
            const key = vals[0].trim();
            const val = vals[1].trim();
            schedObj[key] = val
          }
        }
        schedObj.workingCSSClass = 'slds-icon-custom-14'
        const updatedFormattedObj = this.assignTableValue(updatedRecord)
        window.console.log(updatedFormattedObj)
        Object.assign(schedObj, updatedFormattedObj)

        schedObjects.push(schedObj)

      }


      this.displayFileUpload = false
      this.displayColumnsAndHeaders = true
      this.data = schedObjects
      window.console.log('this.data : ', JSON.stringify(this.data))
    }
  
    assignTableValue(obj){
      const map = {
        phone: 'X800_Number__c',
        isci: 'ISCI_CODE__c',
        rate: 'Rate__c',
        week: 'Week__c'
      }

      const returnable = {}

      for( const field of Object.keys(obj)){
        let name = map[field]
        returnable[name] = obj[field]
      }
      window.console.log('returnable', returnable)

      return returnable
    }
}



  