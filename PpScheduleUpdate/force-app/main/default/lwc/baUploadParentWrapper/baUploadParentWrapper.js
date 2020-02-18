import { LightningElement, track } from 'lwc';

export default class BaUploadParentWrapper extends LightningElement {
  @track dealProgramSelected
  @track dealProgram
  @track fileUploaded
  @track csvDownloadReady
  @track state0 = true
  showTemplateOne = true;

  //there are four states of the parent container:

  //1. initial 
      // no deal program selected
      //in this state a dropdown is presented to user 
      //after selecting the program, the next state is prepared
  //2. dealprogram selected
      //after deal program is selected the file upload button will be rendered
  //3. file uploaded
      //after the file is uploaded the result/datatable is rendered 
      //with the table is an update button, which when hit triggers the next state exist 
  //4. csv download ready
      //after the update is performed on the salesforce server a csv is returned to the client
      // with the results of the unmatched schedules - or - if there were no unamatched schedules,
      // a success message is populated on the screen

  get state1(){
    window.console.log('state 1: ', !this.dealProgramSelected)
    return !this.dealProgramSelected
  }

  get state2(){
    window.console.log('state 2: ', this.dealProgramSelected)
    return this.dealProgramSelected 
  }

  get state3(){
    window.console.log('state 3: ', this.fileUploaded)
    return this.fileUploaded
  }

  get state4(){
    window.console.log('state 4: ', this.csvDownloadReady)
    return this.csvDownloadReady
  }

  handleDealProgramSelection(event){
    this.dealProgram = event.detail
    this.dealProgramSelected = true
    window.console.log('dealprogram selected:', this.dealProgramSelected)
  }

  handleFileUploaded(event){
    this.fileUploaded = true
    window.console.log('handled file upload:', this.fileUploaded)
  }

  resetState(event){
   this.dealProgramSelected = null
   this.dealProgram = null
   this.fileUploaded = null
   this.csvDownloadReady = null
  }

}