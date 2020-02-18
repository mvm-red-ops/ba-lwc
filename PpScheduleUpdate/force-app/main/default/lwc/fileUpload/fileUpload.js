import { LightningElement, track, api } from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import readCSV from '@salesforce/apex/PPTrafficUploader.readCSVFile';
import Id from '@salesforce/user/Id';



// const actions = [
//   { label: 'View Schedule', name: 'view_schedule' },
// ];



export default class ReadCSVFileInLWC extends NavigationMixin(LightningElement) {
    @api recordId;
    @track error;
    @track myRecordId = Id;
    @track updatedVals;
    @track count;
    @track matchedCount;
    @track unmatchedCount;
    @track toggleFileUpload = true
    @track toggleSpinner = false
    @track tableScheds = [];
    @track unmatchedScheds = [];
    @track matchedScheds = [];
    @track exportMatches = [];
    @track exportUnmatches = [];
    @track columns = [
      // { label: 'Schedule Options', fieldName: 'action', type: 'action', typeAttributes: { rowActions: actions, menuAlignment: 'left'}}, 
      { label: 'Schedule', fieldName: 'idUrl', type: 'url', typeAttributes: { label: {fieldName: 'Id'}}, cellAttributes: { class: { fieldName: 'workingCSSClassSchedule' }}, target: '_blank'}, 
      { label: 'Week', fieldName: 'Week__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassWeek' }} },
      { label: 'Daypart', fieldName: 'LF_Daypart__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassDaypart'}}}, 
      { label: 'Deal Program', fieldName: 'DealProgram__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassDealProg'}}}, 
      { label: 'Long Form', fieldName: 'Long_Form__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassLongForm' }}},
      { label: '800 #', fieldName: 'X800_Number__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassPhone' }}},
      { label: 'ISCI Code', fieldName: 'ISCI_CODE__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassISCI' }}},
      { label: 'Rate', fieldName: 'Rate__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassRate'}}},
      { label: 'Previous Values', fieldName: 'PreVals', cellAttributes: { class: { fieldName: 'workingCSSClassPrev' }}, type: 'text'}
    ];
    @track data = [];

    displayFileUpload = true;
    displayColumnsAndHeaders = false;



    // accepted parameters
    get acceptedFormats() {
        return ['.csv'];
    }
 

    //similar to component did mount,
    //lifcycle method that fires before component renders
    async handlePrecursor(event){
      window.console.log('set toggle true (handle precursor)')
      this.toggleSpinner = true;
      window.console.log(this.toggleSpinner)

      this.handleUploadFinished(event)
    }

    //callback from csv file upload
    async handleUploadFinished(event) {
      // Get the list of uploaded files
      const uploadedFiles = event.detail.files;

      // calling apex class
      readCSV({idContentDocument : uploadedFiles[0].documentId})
        .then(result => {
            this.data = result;
            // window.console.log('record length')
            // window.console.log(result.length)

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: 'BA was successfully uploaded!!!',
                    variant: 'success',
                }),
            );
        })
       .then(() => this.formatData(this.data) )
       .then( () => {
        window.console.log('second .then')
         this.hideSpinner()
         this.hideFileUpload()
        })
       .catch(error => {
            this.error = error;
            window.console.log('error : ',JSON.stringify(error))
            
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: JSON.stringify(error.body.message),
                    variant: 'error',
                }),
            );     
        })
    }

    // better way of establish data exists 
  
    get hasResults() {
      return (this.sections.data.length > 0);
    }
    
    formatData(apiData){


      window.console.log('formatting data...')
      //apiData is an array of Objects with the following shape
      /*
        s = schedule

      {
        "s.id": {
          field : [old val, new val, false] or [val, false (if both are the same)]

          "isci" : [s.isci],
          "rate" : [s.rate],
          "phone" : [s.phone],
          "longform" : [s.longform],
          "matched" : ["true" or "false" depending on if it had sched match]
        }
      }

     ex:{"a080R000006ybH1QAI":
          {"isci":["N1003513600H\r","true"],
          "rate":["1000.00","1000.00","false"],
          "phone":["800-405-6210","true"],
          "longform":["A-5:30","A-5:30","false"],
          "matched":["true"]}}
     
          for each 
          fieldKeyVals = Object.values(obj )
          fieldKeyVals.matched === true
      */


      let dictionary = {'matched': 0, 'unmatched': 0}
      for(let i = 0; i < apiData.length; i++){
        const current = apiData[i]

        let fields = Object.values(current)
        if(!fields[0]) debugger
        fields = fields[0]


        const matched = fields.matched[0]
        
        if(matched === "true"){
          this.matchedScheds.push(current)
          dictionary['matched']++
        } else if (matched === "false"){
          this.unmatchedScheds.push(current)
          dictionary['unmatched']++
        } else {
            debugger 
        }
        
      }
      
      this.count = (this.unmatchedScheds.length + this.matchedScheds.length).toString()
      this.unmatchedCount = this.unmatchedScheds.length.toString()
      this.matchedCount = this.matchedScheds.length.toString()
      // window.console.log('the count of the unmatched: ', this.unmatchedCount)
      // window.console.log('the count of the matched: ', this.matchedCount)
      // window.console.log('the count of the total schedules is: ', this.count)

      //format unmatched schedules
      // window.console.log('being unmatched formatting..')
      for(let i = 0; i < this.unmatchedScheds.length; i++){
        let schedule = this.unmatchedScheds[i];
        if(!schedule) debugger        

        let fields = Object.values(schedule)[0]
        const key = Object.keys(schedule)[0]
        // window.console.log('Ids, ', JSON.stringify(key))

        const schedObj = {'Id': key}
        const exportSched = {'Id' : key}
        // window.console.log('fields, ', JSON.stringify(fields))

        exportSched.ISCI_CODE__c = schedObj.ISCI_CODE__c = fields.isci[0] || 'no isci'
        schedObj.Long_Form__c = fields.longform[0] || 'no longform'
        schedObj.Week__c = fields.week[0] || 'no week'
        exportSched.Rate__c = schedObj.Rate__c = fields.rate[0] || 'no rate'
        exportSched.X800_Number__c = schedObj.X800_Number__c = fields.phone[0] || 'no phone'
        schedObj.Week__c = fields.week[0]
        schedObj.LF_Daypart__c = fields.daypart[0]
        schedObj.DealProgram__c = fields.dealprog[0]

        schedObj.Long_Form__c = fields.longform[0]
        // schedObj.Week__c = fields.week[1] 
        schedObj.idUrl  = '/' + key;
        // window.console.log('MATCHED schedObj')
        // window.console.log(schedObj)

        
        //the key for unmatched schedules is an id
        //the key for unamtched csv records is multiple concat fields with a space between
        //in order to determine if we need to assign an idUrl we run the below check
        if(key){
          // window.console.log('UNMATCHED KEY COLOR')
          // window.console.log(JSON.stringify(key))
          if(key.split(' ').length === 1){
            schedObj.idUrl  = '/' + key;
            schedObj.workingCSSClassSchedule = 'slds-color__background_gray-7'
            schedObj.workingCSSClassWeek = 'slds-color__background_gray-7'
            schedObj.workingCSSClassDaypart = 'slds-color__background_gray-7'
            schedObj.workingCSSClassDealProg = 'slds-color__background_gray-7'
            schedObj.workingCSSClassLongForm = 'slds-color__background_gray-7'
            schedObj.workingCSSClassPhone = 'slds-color__background_gray-7'
            schedObj.workingCSSClassISCI = 'slds-color__background_gray-7'
            schedObj.workingCSSClassRate = 'slds-color__background_gray-7'
            schedObj.workingCSSClassPrev = 'slds-color__background_gray-7'   
          } else {    
            schedObj.workingCSSClassSchedule = 'slds-icon-custom-custom92'
            schedObj.workingCSSClassWeek = 'slds-icon-custom-custom92'
            schedObj.workingCSSClassDaypart = 'slds-icon-custom-custom92'
            schedObj.workingCSSClassDealProg = 'slds-icon-custom-custom92'
            schedObj.workingCSSClassLongForm = 'slds-icon-custom-custom92'
            schedObj.workingCSSClassPhone = 'slds-icon-custom-custom92'
            schedObj.workingCSSClassISCI = 'slds-icon-custom-custom92'
            schedObj.workingCSSClassRate = 'slds-icon-custom-custom92'
            schedObj.workingCSSClassPrev = 'slds-icon-custom-custom92'   
          }

        }
        this.tableScheds.push(schedObj)
        window.console.log('unmatched export schedule: ', JSON.stringify(exportSched))

        this.exportUnmatches.push(exportSched)

      }


      // window.console.log('being matched formatting..')

      for(let i = 0; i < this.matchedScheds.length; i ++){
        let schedule = this.matchedScheds[i];
        if(!schedule) debugger
        const key = Object.keys(schedule)[0]
        let fields = Object.values(schedule)
        const schedObj  = {'Id': key}
        const exportSched = {'Id': key}
        if(!fields[0]) continue 
        fields = fields[0]
   

        //check for changed values
        //fields.col has an array value
        //the array is either length of 2 or 3
        //if the array is 2 it is automatically changed
        //if the array is 3 you have to check the last value which is true or false based on the equivalence of the first two values
        if(fields.isci.length === 2 || fields.isci[2] === 'true'){
          //if length = 2 / 0 if length =3 1
          exportSched.ISCI_CODE__c = schedObj.ISCI_CODE__c = fields.isci.length === 2 ? fields.isci[0] : fields.isci[1]
          schedObj.workingCSSClassISCI = 'slds-icon-custom-custom101';
        } else {
          exportSched.ISCI_CODE__c = schedObj.ISCI_CODE__c = fields.isci[0]
        }
        //rate change cell color logic 
        window.console.log('RATE VALS: ', JSON.stringify(fields.rate))
        const baRate = parseInt(fields.rate[1],10)
        const sfRate = parseInt(fields.rate[0],10)
        if(fields.rate.length === 2 || fields.rate[2] === 'true'){
          if(fields.rate.length === 2){
            exportSched.Rate__c = schedObj.Rate__c  = fields.rate[0]
            schedObj.workingCSSClassRate = 'slds-icon-custom-custom63';
          } else {
              if(baRate > sfRate){
                schedObj.workingCSSClassRate = 'slds-icon-custom-custom63';  
              } else if(baRate < sfRate) {
                schedObj.workingCSSClassRate = 'slds-icon-custom-custom49';  
              } 
             exportSched.Rate__c = schedObj.Rate__c  = fields.rate[1]
          }
          
        } else {
          exportSched.Rate__c = schedObj.Rate__c = fields.rate[0]
        }
        if(fields.phone.length === 2 || fields.phone[2] === 'true'){
          exportSched.X800_Number__c = schedObj.X800_Number__c = fields.phone.length === 2 ? fields.phone[0] : fields.phone[1]
          schedObj.workingCSSClassPhone = 'slds-icon-custom-custom89';
        }  else {
          exportSched.X800_Number__c = schedObj.X800_Number__c = fields.phone[0]
        }
        schedObj.Week__c = fields.week[0]
        schedObj.LF_Daypart__c = fields.daypart[0]
        schedObj.DealProgram__c = fields.dealprog[0]

        schedObj.Long_Form__c = fields.longform[0]
        // schedObj.Week__c = fields.week[1] 
        schedObj.idUrl  = '/' + key;

        this.tableScheds.push(schedObj)
       // window.console.log('matched export schedule: ', JSON.stringify(exportSched))
        this.exportMatches.push(exportSched)
      }

     // matchedScheds//
     /*
     {"":{"isci":["N1010511451H\r"],"rate":["1000.00"],"phone":["800-493-9642"],"longform":["A-5:00"],"matched":["false"]}}
      */

      // window.console.log('setting state after data is loaded')
      // window.console.log('file uploaded')

      this.displayColumnsAndHeaders = true
      //window.console.log('table scheds', JSON.stringify(this.tableScheds))

      this.data = this.tableScheds
      this.toggleFileUpload = false
      // window.console.log('data set')


    }

    handleScheduleView(event) {

      const recordId = event.detail.row.Id

      this[NavigationMixin.Navigate]({
        type: 'standard__recordPage',
        attributes: {
            actionName: 'view',
            recordId: recordId,
            objectApiName: 'Schedules__c'
        },
      });
    }

    showSpinner(){
      window.console.log('show spinner: fx')
      this.toggleSpinner = true;
      window.console.log(this.toggleSpinner)

    }

    hideSpinner(){
      window.console.log('hide spinner: fx')
      this.toggleSpinner = false;
      window.console.log(this.toggleSpinner)

    }

    showFileUpload(){
      // window.console.log('show file: fx')
      this.displayFileUpload = true;
    }

    hideFileUpload(){
      // window.console.log('hide file: fx')
      this.displayFileUpload = false;
    }

}



  



/*

List<<Map<String, Map<String, List<String>>>>>

 [{"a080R000006ybDjQAI":{"rate":["1100.00","1100.00","false"],"phone":["800-405-6210","true"],"longform":["A-3:00","A-3:00","false"],"isci":["N1003513600H\r","true"],"matched":["true"],"week":["2020-01-14"],"daypart":["ON"],"dayofweek":["2Tues"],"dealprog":["COURTTV Mystery PP"]}},
 */