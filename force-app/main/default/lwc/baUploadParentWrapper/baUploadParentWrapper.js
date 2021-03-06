     /*

     This is the parent component of the BAUploader.
     It's functions include: 
     1. Initialize the variables
     2. Pass necesary data to child components
     3. Conditionally render child components based on state 
     4. Handle events from child components
     5. Communicate with SF, pass data and handle responses
     6. Format data 

     The structure of this component is 
     ------- 
     Description
     ------- 
     imports
     ------- 
     variable declaration
     -------
     child event handlers and state handlers
     ------- 
     sf methods 
     -------
     formatting helpers



     This is the shape of the schedule objects that return from Salesforce after the inital csv upload
          s = schedule
  
        {
          "s.id": {
            field : [old val, new val, false] or [val, false (if both are the same)]
  
            "isci" : [s.isci],
            "rate" : [s.rate],
            "phone" : [s.phone],
            "longform" : [s.longform],
            "showtitle" : [s.showtitle],
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
  

import { LightningElement, api } from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import readCSV from '@salesforce/apex/PPTrafficUploader.readCSVFile';
import updateSchedules from '@salesforce/apex/TrafficUpdateFromBA_LWC.updateSchedules';
import Id from '@salesforce/user/Id';

export default class BaUploadParentWrapper extends LightningElement {
  dealProgramSelected
  dealProgram
  fileUploaded
  csvDownloadReady
  documentId
  toggleSpinner
  count
  matchedCount
  unmatchedCount
  selectedRows
  schedules
  displayDatatable
  data
  myRecordId = Id;
 

  //handles selection of deal program from dropdown
  handleDealProgramSelection(event){
    this.dealProgram = event.detail
    this.dealProgramSelected = true
  }

  //captures documentId from file uploaded to SF, needed to pass to readCSV Apex class to query the file in Apex
  handleFileUpload(event){
    const fileObj = event.detail.detail.files[0]

    this.documentId = fileObj.documentId
    if(this.documentId && this.dealProgram)
    this.spinnerHandler('show')
    this.handleUploadToSF(this.documentId, this.dealProgram)
  }

  //used to accept the selected schedules to update
  handleScheduleSelection(event){
    window.console.log(`scheudle selected: ${JSON.stringify(event.detail)}`)
    this.selectedRows = event.detail
  } 


  //handles the response from SF after the update is performed
  handleUpdateResponseFromSF(event){

  }

  //handle events to change spinner state
  spinnerHandler(call){
    window.console.log('spinner handler ', call)
    if(call === 'show') this.toggleSpinner = true
    if(call === 'hide') this.toggleSpinner = false
  }

    //completely resets state to initial values, used mainly for reselecting deal program
    resetState(event){
      this.dealProgramSelected = null
      this.dealProgram = null
      this.documentId = null
      this.toggleSpinner = false
      this.fileUploaded = null
      this.csvDownloadReady = null
      this.count = null
      this.matchedCount = null
      this.unmatchedCount = null
      this.exportSchedules = null
      this.selectedRows = null
     }


  //toasts 

  showToast(call, error){
    let event;
    window.console.log(`call ${call}`)
    window.console.log(`error ${error}`)
    if(call == 'success'){
        event = new ShowToastEvent({
            title: 'Success!!',
            message: 'BA was successfully uploaded!!!',
            variant: 'success',
        })
    } else if (call == 'error'){
        event = new ShowToastEvent({
          title: 'Error!!',
          message:`Ooohh! An error occurred! ${error}`,
          variant: 'error',
      })
    } else if ( call == 'no schedules selected' ){
      event = new ShowToastEvent({
          title: 'No Selection!!',
          message:`No schedules were selected! Please select the ones you'd like to update.`,
          variant: 'error',
      })
    }
   this.dispatchEvent(event)
  }

  



  //handle upload to SF 

    //callback from csv file upload
    async handleUploadToSF(documentId, dealProgram) {

      // calling apex class        
      readCSV({idContentDocument: documentId, dealProgram: dealProgram })
        .then(result => {
            //result is a map of schedules 
            this.data = result;
            this.showToast('success')
        })
       .then(() => {
         const schedMap = this.formatData(this.data)
         this.dataTableScheds = [...schedMap.tableFormat.unmatched, ...schedMap.tableFormat.matched]
         this.exportSchedules = schedMap.exportFormat
         this.unmatchedCount = schedMap.tableFormat.unmatched.length
         this.matchedCount = schedMap.tableFormat.matched.length
         this.displayDatatable = true
        }) 
       .then( result => {
          this.spinnerHandler('hide')
       })       
        .catch(error => {
            this.error = error;
            this.spinnerHandler('hide')
            window.console.log('error: ', error)
            window.console.log('error message: ',error.body.message)

            this.showToast('error', error)   
        })
    }


    updateSchedules(event) {
      window.console.log(`selected rows: ${this.selectedRows}`)
      if(!this.selectedRows || this.selectedRows.length < 1) {
        this.showToast('no schedules selected')
        return
      } else{
        this.updateSchedulesExecute(event) 
      }
    }

  @api
  updateSchedulesExecute(event) {
    this.spinnerHandler('show')

    window.console.log('update schedule function intiated')
    window.console.log(`export scheds: ${JSON.stringify(this.exportSchedules.matched)}`)

    const allSchedsUpdate = this.exportSchedules.matched;
    const schedsToUpdate = [];
    const selectedRowIds = this.selectedRows.length > 0 ? this.selectedRows.map( row => row.Id) : []
    const scheds = { 'matched' : [], 'unmatched': []}
    window.console.log(`selected ids: ${selectedRowIds}`)
    //iterate through matched and then unmatched schedules, checking whether their id is in the array of selected rows
    //if it is not, it is added to the unselected arrays above
    for(let i = 0; i < allSchedsUpdate.length; i++){
      let curr = allSchedsUpdate[i]

      if(selectedRowIds.includes(curr.Id)){
        schedsToUpdate.push(curr)
      } else {
        continue
      }
    }
    scheds.matched = schedsToUpdate
    scheds.unmatched = this.exportSchedules.unmatched || [{'Id': 'N/a'}]
  
    window.console.log(`scheds: ${JSON.stringify(scheds)}`)

    updateSchedules({scheds})
              .then(result => { 
                  this.data = result;
                  this.success = true;
                  window.console.log('in success')
                  this.error = undefined;
              })
              .then( () => this.formatUploadedData(this.data) )
              .then( () => this.showToast('success'))
              .catch(error => {
                window.console.log(error)
                window.console.log('error: ', JSON.stringify(error));
                this.showToast('error', error)    
                this.spinnerHandler('hide')
                this.dispatchEvent(this.updateFailed);
                this.error = error.body.message;
              });


      return null;
    }

     
    //-----formatting helpers start------

    //formatData function accepts 'apiData' which is an array of Objects with the  shape described right above
    formatData(apiData){
      let schedMap = {
        tableFormat: {
          unmatched: [], 
          matched: []
        }, 
        exportFormat: {
          unmatched: [], 
           matched: []
        }
      }
      for(let i = 0; i < apiData.length; i++){
        const current = apiData[i]
        const fields = Object.values(current)[0]
        const matched = fields.matched[0]
        
        if(matched === "true"){
          // this.matchedScheds.push(current)
          let formattedSchedArr = this.formatMatchedSchedule(current)
          if(formattedSchedArr === 'skip') continue
          schedMap.tableFormat.matched.push(formattedSchedArr[0])
          schedMap.exportFormat.matched.push(formattedSchedArr[1])
        } else if (matched === "false"){
          //unmatched schedules from the BA have an id property with spaces in it, while unmatched SF schedules have an id property with no spaces
          //this condition exploits that property to determine which type of unmatched schedule we are dealing with
          const idcheck = Object.keys(current)[0].split(' ')
          if(idcheck.length > 1){
            // this.unmatchedBAScheds.push(current)
            let formattedSchedArr = this.formatUnmatchedBaSchedule(current)
            schedMap.tableFormat.unmatched.push(formattedSchedArr[0])
            schedMap.exportFormat.unmatched.push(formattedSchedArr[0])
          } else {
            schedMap.tableFormat.unmatched.push(current)
          }
        } 
      }

      // matchedScheds format:
      // {"":{"isci":["N1010511451H\r"],"rate":["1000.00"],"phone":["800-493-9642"],"longform":["A-5:00"],"matched":["false"]}}

      window.console.log(`schedes map: ${JSON.stringify(schedMap)}`)
      return schedMap
    }


     formatMatchedSchedule(schedule){
      const key = Object.keys(schedule)[0]
      let fields = Object.values(schedule)
      const schedObj  = {'Id': key}
      const exportSched = {'Id': key}
      const valueMap = {'Id': key}
  
      if(!fields[0]) return 'skip'
      fields = fields[0]
  
  
      //check for changed values
      //fields.col has an array value
      //the array is either length of 2 or 3
      //if the array is 2 it is automatically changed
      //if the array is 3 you have to check the last value which is true or false based on the equivalence of the first two values
      if(fields.isci.length === 2 || fields.isci[2] === 'true'){
        //if length = 2 / 0 if length =3 1
        valueMap.isciVals = fields.isci
        exportSched.ISCI_CODE__c = schedObj.ISCI_CODE__c = fields.isci.length === 2 ? fields.isci[0] : fields.isci[1]
        schedObj.workingCSSClassISCI = 'slds-icon-custom-custom101';
      } else {
        exportSched.ISCI_CODE__c = schedObj.ISCI_CODE__c = fields.isci[0]
      }
      if(fields.showtitle.length === 2 || fields.showtitle[2] === 'true'){
        //if length = 2 / 0 if length =3 1
        exportSched.LF_traffic__c = schedObj.LF_traffic__c = fields.showtitle.length === 2 ? fields.showtitle[0] : fields.showtitle[1]
        schedObj.workingCSSClassShowTitle = 'slds-icon-custom-custom22';
      } else {
        exportSched.LF_traffic__c = schedObj.LF_traffic__c = fields.showtitle[0] || 'no traffic'
      }
      //rate change cell color logic 
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
      schedObj.DealProgram__c = fields.dealprog[0]
      schedObj.Long_Form__c = fields.longform[0]
      schedObj.idUrl  = '/' + key;
  
      return [schedObj, exportSched]
    }


        
    formatUnmatchedSfSchedule(schedule){
      let fields = Object.values(schedule)[0]
      const key = Object.keys(schedule)[0]
      const schedObj = {'Id': key}
      const exportSched = {'Id' : key}
      
      exportSched.ISCI_CODE__c = schedObj.ISCI_CODE__c = fields.isci[0] || 'no isci'
      schedObj.Long_Form__c = fields.longform[0] || 'no longform'
      schedObj.Week__c = fields.week[0].split(' ')[0] || 'no week'
      exportSched.Rate__c = schedObj.Rate__c = fields.rate[0] || 'no rate'
      exportSched.X800_Number__c = schedObj.X800_Number__c = fields.phone[0] || 'no phone'
      exportSched.LF_traffic__c = schedObj.LF_traffic__c = fields.showtitle[0] || 'no isci'
      schedObj.Week__c = fields.week[0]
      schedObj.DealProgram__c = fields.dealprog[0]
      schedObj.Long_Form__c = fields.longform[0]
      schedObj.idUrl  = '/' + key;
      
      //the key for unmatched schedules is an id
      //the key for unamtched csv records is multiple concat fields with a space between
      //in order to determine if we need to assign an idUrl we run the below check
      if(key){
          schedObj.idUrl  = '/' + key;
          schedObj.workingCSSClassSchedule = 'slds-color__background_gray-7'
          schedObj.workingCSSClassWeek = 'slds-color__background_gray-7'
          schedObj.workingCSSClassDealProg = 'slds-color__background_gray-7'
          schedObj.workingCSSClassLongForm = 'slds-color__background_gray-7'
          schedObj.workingCSSClassPhone = 'slds-color__background_gray-7'
          schedObj.workingCSSClassISCI = 'slds-color__background_gray-7'
          schedObj.workingCSSClassRate = 'slds-color__background_gray-7'
          schedObj.workingCSSClassPrev = 'slds-color__background_gray-7'   
          schedObj.workingCSSClassShowTitle = 'slds-color__background_gray-7'
      }
  
      return [schedObj, exportSched]
    }
  


    //formatting
    formatUnmatchedBaSchedule(schedule){
      let fields = Object.values(schedule)[0]
      const key = Object.keys(schedule)[0]
      const schedObj = {'Id': key}
      const exportSched = {'Id' : key}
  
      exportSched.ISCI_CODE__c = schedObj.ISCI_CODE__c = fields.isci[0] || 'no isci'
      exportSched.Rate__c = schedObj.Rate__c = fields.rate[0] || 'no rate'
      exportSched.X800_Number__c = schedObj.X800_Number__c = fields.phone[0] || 'no phone'
      exportSched.LF_traffic__c = schedObj.LF_traffic__c = fields.showtitle[0] || 'no isci'
      schedObj.Long_Form__c = fields.longform[0] || 'no longform'
      schedObj.Week__c = fields.week[0].split(' ')[0] || 'no week'
      schedObj.DealProgram__c = fields.dealprog[0]
      schedObj.idUrl  = '/' + key;
  
      
      //the key for unmatched schedules is an id
      //the key for unamtched csv records is multiple concat fields with a space between
      //in order to determine if we need to assign an idUrl we run the below check
      if(key){
          schedObj.workingCSSClassSchedule = 'slds-icon-custom-custom92'
          schedObj.workingCSSClassWeek = 'slds-icon-custom-custom92'
          schedObj.workingCSSClassDealProg = 'slds-icon-custom-custom92'
          schedObj.workingCSSClassLongForm = 'slds-icon-custom-custom92'
          schedObj.workingCSSClassPhone = 'slds-icon-custom-custom92'
          schedObj.workingCSSClassISCI = 'slds-icon-custom-custom92'
          schedObj.workingCSSClassRate = 'slds-icon-custom-custom92'
          schedObj.workingCSSClassPrev = 'slds-icon-custom-custom92'   
          schedObj.workingCSSClassShowTitle = 'slds-icon-custom-custom92' 
        }
  
        return [schedObj, exportSched]
    }  


    formatUploadedData(data){
      try{
        this.success = true
        const statusObject = Object.keys(data)[0]
        const schedules = Object.values(data)[0]
        //format data
        window.console.log('finding status')
        window.console.log(JSON.stringify(statusObject))

        const formattedSchedules = [];
        if(!schedules || !schedules.length) return
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

      this.spinnerHandler('hide')
      this.displayDatatable = false

    }

  
    //formatting helpers end

}


