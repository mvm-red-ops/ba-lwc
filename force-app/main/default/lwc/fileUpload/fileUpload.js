import { LightningElement, track, api } from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import readCSV from '@salesforce/apex/PPTrafficUploader.readCSVFile';
import Id from '@salesforce/user/Id';


const actions = [
  { label: 'Compare Schedule Values', name: 'compare_schedule' }
];



export default class ReadCSVFileInLWC extends NavigationMixin(LightningElement) {
    @track data = [];
    @track error;
    @track columns = [
      { label: 'Schedule', fieldName: 'idUrl', type: 'url', typeAttributes: { label: {fieldName: 'Id'}}, cellAttributes: { class: { fieldName: 'workingCSSClassSchedule' }}, target: '_blank'}, 
      { label: 'Week', fieldName: 'Week__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassWeek' }} },
      { label: 'Show Title', fieldName: 'LF_traffic__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassShowTitle'}}}, 
      { label: 'Deal Program', fieldName: 'DealProgram__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassDealProg'}}}, 
      { label: 'Long Form', fieldName: 'Long_Form__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassLongForm' }}},
      { label: '800 #', fieldName: 'X800_Number__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassPhone' }}},
      { label: 'ISCI Code', fieldName: 'ISCI_CODE__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassISCI' }}},
      { label: 'Rate', fieldName: 'Rate__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassRate'}}},
      {
        type: 'action',
        typeAttributes: {
          rowActions: actions,
            menuAlignment: 'right'
        }
      }
    ];
    @api dealProgram
    @track count;
    @track matchedCount;
    @track unmatchedCount = 0;
    @track displayFileUpload = true
    @track toggleSpinner = false
    @track tableScheds = {matched: [], unmatched: []};
    @track unmatchedBAScheds = [];
    @track unmatchedSFScheds = [];
    @track matchedScheds = [];
    @track exportMatches = [];
    @track exportUnmatches = [];
    @track selectedRows = [];
    @track updateResult
    @track myRecordId = Id;
    @track fileUploadUpdateButton
    @track showModal 
    @track modalScheds
    @track modalColumns = [
      { label: 'Name', fieldName: 'Name__c', type: 'text'},
      { label: '800 #', fieldName: 'X800_Number__c', type: 'text'},
      { label: 'ISCI Code', fieldName: 'ISCI_CODE__c', type: 'text'},
      { label: 'Rate', fieldName: 'Rate__c', type: 'text'},
      { label: 'Show Title', fieldName: 'LF_traffic__c', type: 'text'}
    ]


    displayFileUpload = true;
    @track displayDatatable = false;

    get acceptedFormats() {
        return ['.csv'];
    }
 
    get renderUpdateButton() {
      window.console.log('GET RENDER UPDATE BUTTON count: ', this.count)
      window.console.log('GET RENDER UPDATE BUTTON matchedScheds: ', this.matchedScheds.length)
      return this.matchedScheds.length > 0 && !this.updateResult
    }
    
    set renderUpdateButton(event){
      window.console.log('render update button, ', event)
      return false
    }

    get renderUpdateComponent(){
      return this.matchedScheds.length > 0 
    }


    get noMatches(){
      return this.matchedScheds.length === 0 && this.unmatchedBAScheds.length > 0 && this.unmatchedSFScheds.length
    }

    //similar to component did mount,
    async handlePrecursor(event){
      this.toggleSpinner = true;
      this.error = null;
      this.handleUploadFinished(event)
    }

    //callback from csv file upload
    async handleUploadFinished(event) {

      // Get the list of uploaded files
      const uploadedFiles = event.detail.files;
      const id = uploadedFiles[0].documentId

      // calling apex class
      window.console.log('show me... SPINNER')
      readCSV({idContentDocument: id, dealProgram: this.dealProgram })
        .then(result => {
            //result is a map of schedules 
            this.data = result;
            window.console.log('result: ')
            window.console.log(JSON.stringify(result))
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: 'BA was successfully uploaded!!!',
                    variant: 'success',
                }),
           this.hideSpinner()
            );
        })
       .then(() => this.formatData(this.data)) 
       .then( result => {
          window.console.log('hopefully no error, plus result = ', result)
          this.hideSpinner()
       })       
        .catch(error => {
            this.error = error;
            this.hideSpinner()
            window.console.log('error: ', error)
            window.console.log('error message: ',error.body.message)

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: "Ooohh! Please read error below!",
                    variant: 'error',
                }),
            );     
        })
    }

      /*
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

  //formatData function accepts 'apiData' which is an array of Objects with the  shape described right above
    formatData(apiData){
      window.console.log('formatting data...')

      let dictionary = {'matched': 0, 'unmatchedBA': 0, 'unmatchedSF': 0}
      for(let i = 0; i < apiData.length; i++){
        const current = apiData[i]

        const fields = Object.values(current)[0]
        const matched = fields.matched[0]
        
        if(matched === "true"){
          this.matchedScheds.push(current)
          dictionary['matched']++
        } else if (matched === "false"){
          //unmatched schedules from the BA have an id property with spaces in it, while unmatched SF schedules have an id property with no spaces
          //this condition exploits that property to determine which type of unmatched schedule we are dealing with
          const idcheck = Object.keys(current)[0].split(' ')
          if(idcheck.length > 1){
            dictionary.unmatchedBA++
            this.unmatchedBAScheds.push(current)
          } else {
            dictionary.unmatchedSF++
            this.unmatchedSFScheds.push(current)
          }
        } 
      }

      this.unmatchedCount = dictionary.unmatchedBA.toString()
      this.matchedCount = dictionary.matched.toString()
      this.count =  (dictionary.unmatchedBA + dictionary.matched).toString()

      //format unmatched BA schedules
      for(let i = 0; i < this.unmatchedBAScheds.length; i++){
        let schedule = this.unmatchedBAScheds[i];
        const schedArr = this.formatUnmatchedBaSchedule(schedule)
        this.tableScheds.unmatched.push(schedArr[0])
        this.exportUnmatches.push(schedArr[1])
      }

      //format unmatched SF schedules
      for(let i = 0; i < this.unmatchedSFScheds.length; i++){
        let schedule = this.unmatchedSFScheds[i];
        const schedArr = this.formatUnmatchedSfSchedule(schedule)
        this.tableScheds.unmatched.push(schedArr[0])
        this.exportUnmatches.push(schedArr[1])
      }

      //format matched schedules
      for(let i = 0; i < this.matchedScheds.length; i ++){
        let schedule = this.matchedScheds[i];
        const schedArr = this.formatMatchedSchedule(schedule)
        if(schedArr === 'skip') continue
        this.tableScheds.matched.push(schedArr[0])
        this.exportMatches.push(schedArr[1])
      }

      // matchedScheds format:
      // {"":{"isci":["N1010511451H\r"],"rate":["1000.00"],"phone":["800-493-9642"],"longform":["A-5:00"],"matched":["false"]}}
      this.displayDatatable = true
      window.console.log('display datatable = true')
      this.tableScheds = [...this.tableScheds.unmatched, ...this.tableScheds.matched]
      this.displayFileUpload = false
      return ['finished']
    }

    handleScheduleView(event) {
      this.selectedRows = event.detail.selectedRows
    }


    showSpinner(){
      window.console.log('show spinner: fx')
      this.toggleSpinner = true;
      window.console.log(this.toggleSpinner)
    }

    hideSpinner(event){
      window.console.log('hide spinner: fx')
      this.toggleSpinner = false;
      window.console.log(this.toggleSpinner)
    }


    updateScheds(event){   
      window.console.log('update shcedules function: ')
      this.showSpinner()
      window.console.log('show spinner: ')

      this.template
        .querySelector("c-update-button")
        .updateSchedules(event, this.selectedRows, this.matchedScheds, this.unmatchedScheds)        
    }

    handleScheduleComparison(event) {
      let rowId = event.detail.row.Id;
      const modalRows = []

      let valMap = {}  

      let fields 

      const foundSchedule = this.data.find( sched => {      
        let schedId = Object.keys(sched)[0]
        if( schedId === rowId ) {
          valMap.id = schedId 

         fields = Object.values(sched)[0];

          valMap.old = {}
          valMap.new = {}
          
          
          valMap.old.Name__c = 'BA Schedule'    
          valMap.old.Rate__c = fields.rate[0]
          valMap.old.ISCI_CODE__c = fields.isci[0]
          valMap.old.X800_Number__c = fields.phone[0]
          valMap.old.LF_traffic__c = fields.showtitle[0] 

          valMap.new.Name__c = 'SF Schedule' 
          valMap.new.Rate__c = fields.rate[1]
          valMap.new.ISCI_CODE__c = fields.isci[1]
          valMap.new.X800_Number__c = fields.phone[1]
          valMap.new.LF_traffic__c = fields.showtitle[1]
          return true
        }
      })
      modalRows.push(valMap.old)
      modalRows.push(valMap.new)


      this.modalScheds = modalRows

      if(!foundSchedule){
        window.console.log("Sorry! We couldn't find a matching schedule!")
        return 
      }

      window.console.log(`Modal values: ${JSON.stringify(modalRows)}`)
      
      this.viewScheduleComparison(valMap)
  }
    // view the current record details
    viewScheduleComparison(scheduleVals) {
      this.showModal = true;
      this.modalSched = scheduleVals;
    }

    // closing modal box
    closeModal() {
        this.showModal = false;
    }

    
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
    schedObj.Week__c = fields.week[0] || 'no week'
    schedObj.Week__c = fields.week[0]
    schedObj.DealProgram__c = fields.dealprog[0]
    schedObj.Long_Form__c = fields.longform[0]
    schedObj.idUrl  = '/' + key;

    
    //the key for unmatched schedules is an id
    //the key for unamtched csv records is multiple concat fields with a space between
    //in order to determine if we need to assign an idUrl we run the below check
    if(key){
      // window.console.log('UNMATCHED KEY COLOR')
      // window.console.log(JSON.stringify(key))
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
  
  formatUnmatchedSfSchedule(schedule){
    let fields = Object.values(schedule)[0]
    const key = Object.keys(schedule)[0]
    const schedObj = {'Id': key}
    const exportSched = {'Id' : key}
    
    exportSched.ISCI_CODE__c = schedObj.ISCI_CODE__c = fields.isci[0] || 'no isci'
    schedObj.Long_Form__c = fields.longform[0] || 'no longform'
    schedObj.Week__c = fields.week[0] || 'no week'
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
      // window.console.log('UNMATCHED KEY COLOR')
      // window.console.log(JSON.stringify(key))
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

  formatMatchedSchedule(schedule){
    const key = Object.keys(schedule)[0]
    let fields = Object.values(schedule)
    const schedObj  = {'Id': key}
    const exportSched = {'Id': key}
    const valueMap = {'Id': key}

    if(!fields[0]) return 'skip' 
    fields = fields[0]

    window.console.log('matched schedule formatting...')
    window.console.log(`${key}: ${JSON.stringify(fields)}`)

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

  handleUpdateInitiated(event){
    this.updateResult = true
    this.count = false
    window.console.log('hiding table...')
  }
}



  



/*

List<<Map<String, Map<String, List<String>>>>>

 [{"a080R000006ybDjQAI":{"rate":["1100.00","1100.00","false"],"phone":["800-405-6210","true"],"longform":["A-3:00","A-3:00","false"],"isci":["N1003513600H\r","true"],"matched":["true"],"week":["2020-01-14"],"daypart":["ON"],"dayofweek":["2Tues"],"dealprog":["COURTTV Mystery PP"]}},
 */


