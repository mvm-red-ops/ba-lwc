import { LightningElement, track } from 'lwc';

export default class BaUploadParentWrapper extends LightningElement {
  dealProgramSelected
  dealProgram
  fileUploaded
  csvDownloadReady
  documentId
  toggleSpinner
  

  //handles selection of deal program from dropdown
  handleDealProgramSelection(event){
    this.dealProgram = event.detail
    this.dealProgramSelected = true
  }

  handleFileUpload(event){
    const fileObj = event.detail
    window.console.log(`fileObj: ${JSON.stringify(fileObj.detail)}`)
    const fileObj2 = fileObj.detail.files[0]
    window.console.log(`fileObj2: ${fileObj2}`)

    this.documentId = fileObj2.documentId
    window.console.log(`documentId: ${fileObj.documentId}`)
  }

  //handle events to change spinner state
  spinnerHandler(event){
    if(event.detail === 'show') this.toggleSpinner = true
    if(event.detail === 'hide') this.toggleSpinner = false
  }

    //completely resets state to initial values, used mainly for reselecting deal program
    resetState(event){
      this.dealProgramSelected = null
      this.dealProgram = null
      this.documentId = null
      this.toggleSpinner = false
      this.fileUploaded = null
      this.csvDownloadReady = null
     }
}


