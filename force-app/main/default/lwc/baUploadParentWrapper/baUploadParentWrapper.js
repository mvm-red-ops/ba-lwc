import { LightningElement, track } from 'lwc';

export default class BaUploadParentWrapper extends LightningElement {
  @track dealProgramSelected
  @track dealProgram
  @track fileUploaded
  @track csvDownloadReady

  //handles selection of deal program from dropdown
  handleDealProgramSelection(event){
    this.dealProgram = event.detail
    this.dealProgramSelected = true
  }

  //completely resets state to initial values, used mainly for reselecting deal program
  resetState(event){
   this.dealProgramSelected = null
   this.dealProgram = null
   this.fileUploaded = null
   this.csvDownloadReady = null
  }

}


