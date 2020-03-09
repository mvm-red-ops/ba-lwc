import { LightningElement, track } from 'lwc';

export default class BaUploadParentWrapper extends LightningElement {
  @track dealProgramSelected
  @track dealProgram
  @track fileUploaded
  @track csvDownloadReady
  @track state0 = true
  showTemplateOne = true;


  handleDealProgramSelection(event){
    window.console.log('deal set in parent')
    this.dealProgram = event.detail
    this.dealProgramSelected = true
    window.console.log('deal program:', this.dealProgram)
  }

  resetState(event){
   this.dealProgramSelected = null
   this.dealProgram = null
   this.fileUploaded = null
   this.csvDownloadReady = null
  }

}


